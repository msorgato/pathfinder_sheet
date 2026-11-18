import {
  AmbientLight, BufferGeometry, CanvasTexture, Color, DirectionalLight, EdgesGeometry, LineBasicMaterial, LineSegments, Mesh,
  MeshStandardMaterial, PerspectiveCamera, Quaternion, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import type { RollOutcome } from '../../utils/rollReveal';
import { atlasGeometry, atlasLayout, dieGeometry, logicalFaces } from './geometry';
import type { LogicalFace } from './geometry';
import { restingQuaternion } from './orientation';
import {
  CAMERA_FOV, CAMERA_Z, THROW_STAGGER_MS, diceScale, diceX, dieDuration, easeOutBack, easeOutCubic, easeOutQuart, visibleHeight,
} from './motion';
import { dieSides, faceIndexForValue, faceLabels } from './values';
import type { DieSpec } from './values';

/**
 * The 3D dice of the roll reveal: each die flies in, tumbles and comes to rest with the rolled face
 * turned towards the viewer. The outcome is decided before; this only stages it. No physics.
 */

export interface PlaySpec {
  dice: DieSpec[];
  /** Body colour of the dice (any CSS colour). */
  color: string;
  spinMs: number;
}

export interface DiceScene {
  play(spec: PlaySpec): void;
  /** Colours the effect of the result (critical glow, fumble shake); call once the dice have landed. */
  setOutcome(outcome: RollOutcome): void;
  /** Jumps to the end of the throw (the user skipped it). */
  finish(): void;
  dispose(): void;
}

// ── Shared, cached resources (they survive from one roll to the next) ───────────

interface DieModel { faces: LogicalFace[]; geometry: BufferGeometry; edges: EdgesGeometry }
const models = new Map<number, DieModel>();
function modelFor(dieType: number): DieModel {
  const sides = dieSides(dieType);
  let m = models.get(sides);
  if (!m) {
    const base = dieGeometry(dieType);
    const faces = logicalFaces(base);
    const geometry = atlasGeometry(base, faces);
    base.dispose();
    m = { faces, geometry, edges: new EdgesGeometry(geometry, 15) };
    models.set(sides, m);
  }
  return m;
}

const CELL = 128;
/** Share of the cell taken by the font, per die: smaller on the triangular faces. */
const FONT_SHARE: Record<number, number> = { 4: 0.34, 6: 0.48, 8: 0.36, 10: 0.36, 12: 0.42, 20: 0.32 };
const textures = new Map<string, CanvasTexture>();

/** Atlas with the numbers of a die, one cell per face, in the order of `logicalFaces`. */
function labelTexture(dieType: number, role: DieSpec['role'], color: Color): CanvasTexture {
  const key = `${dieType}|${role}|${color.getHexString()}`;
  const cached = textures.get(key);
  if (cached) return cached;
  const labels = faceLabels(dieType, role);
  const { cols, rows } = atlasLayout(labels.length);
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    ctx.fillStyle = luminance > 0.45 ? '#1b1410' : '#f6efe0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    labels.forEach((label, i) => {
      const size = CELL * (FONT_SHARE[dieSides(dieType)] ?? 0.4) * (label.length > 1 ? 0.78 : 1);
      const cx = (i % cols) * CELL + CELL / 2;
      const cy = Math.floor(i / cols) * CELL + CELL / 2;
      ctx.font = `700 ${size}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(label, cx, cy + size * 0.04);
      if (label === '6' || label === '9') { // so that 6 and 9 cannot be confused
        ctx.fillRect(cx - size * 0.24, cy + size * 0.46, size * 0.48, Math.max(2, size * 0.06));
      }
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  textures.set(key, texture);
  return texture;
}

// ── The scene ────────────────────────────────────────────────────────────────

interface Die {
  mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  edgeMaterial: LineBasicMaterial;
  rest: Quaternion;
  axisA: Vector3; angleA: number;
  axisB: Vector3; angleB: number;
  x: number; scale: number; startX: number;
  delay: number; duration: number;
  landed: boolean; landedAt: number;
}

const randomAxis = () => new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
const randomTurns = () => (3 + Math.random() * 2) * Math.PI * 2 * (Math.random() < 0.5 ? -1 : 1);

/** Creates the scene on `canvas`; returns null (after calling `onError`) when WebGL is not available. */
export function createDiceScene(canvas: HTMLCanvasElement, onError: () => void): DiceScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    onError();
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA_FOV, 1.7, 0.1, 50);
  camera.position.set(0, 0, CAMERA_Z);
  scene.add(new AmbientLight(0xffffff, 1.1));
  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(2, 3, 5);
  const fill = new DirectionalLight(0xbcc8ff, 0.9);
  fill.position.set(-4, -1, 3);
  scene.add(key, fill);

  let dice: Die[] = [];
  let startedAt = 0;
  let spinMs = 1300;
  let outcome: RollOutcome = null;
  let forced = false;
  let raf = 0;
  let disposed = false;

  const onLost = (e: Event) => { e.preventDefault(); if (!disposed) onError(); };
  canvas.addEventListener('webglcontextlost', onLost);

  const resize = () => {
    const w = canvas.clientWidth || 360;
    const h = canvas.clientHeight || 220;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const clearDice = () => {
    dice.forEach(d => {
      scene.remove(d.mesh);
      d.mesh.material.dispose();
      d.edgeMaterial.dispose();
    });
    dice = [];
  };

  const tmpA = new Quaternion();
  const tmpB = new Quaternion();

  const pose = (d: Die, now: number) => {
    const t = forced ? 1 : Math.min(1, Math.max(0, (now - startedAt - d.delay) / d.duration));
    const spin = 1 - easeOutQuart(t);
    tmpA.setFromAxisAngle(d.axisA, d.angleA * spin);
    tmpB.setFromAxisAngle(d.axisB, d.angleB * spin);
    d.mesh.quaternion.copy(d.rest).multiply(tmpA).multiply(tmpB);
    const eased = easeOutCubic(t);
    const startY = -visibleHeight() * 0.62;
    d.mesh.position.set(
      d.x + d.startX * (1 - eased),
      startY * (1 - eased) + 1.2 * Math.sin(Math.PI * t) * (1 - t),
      1.4 * Math.sin(Math.PI * t),
    );
    d.mesh.scale.setScalar(d.scale * (0.55 + 0.45 * easeOutBack(Math.min(1, t * 1.4))));
    if (t >= 1 && !d.landed) { d.landed = true; d.landedAt = now; }
  };

  const applyOutcome = (d: Die, now: number) => {
    const since = now - d.landedAt;
    const mat = d.mesh.material;
    if (outcome === 'crit') {
      mat.emissive.set('#f0c989');
      mat.emissiveIntensity = 0.3 + 0.22 * Math.sin(now / 150);
    } else if (outcome === 'fumble') {
      mat.color.set('#d28a8a');
      if (since < 450) d.mesh.position.x += Math.sin(since * 0.07) * 0.06 * (1 - since / 450);
    }
  };

  const needsFrames = (now: number) =>
    dice.some(d => !d.landed) || outcome === 'crit' || (outcome === 'fumble' && dice.some(d => now - d.landedAt < 450));

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    dice.forEach(d => { pose(d, now); if (d.landed && outcome) applyOutcome(d, now); });
    renderer.render(scene, camera);
    if (needsFrames(now)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && !disposed) raf = requestAnimationFrame(frame); };

  return {
    play(spec) {
      clearDice();
      outcome = null;
      forced = false;
      resize();
      spinMs = spec.spinMs;
      startedAt = performance.now();
      const color = new Color(spec.color);
      const visW = visibleHeight() * camera.aspect;
      const n = spec.dice.length;
      const scale = diceScale(n, visW);
      const duration = dieDuration(spinMs, n);
      dice = spec.dice.map((spec_, i) => {
        const model = modelFor(spec_.dieType);
        const material = new MeshStandardMaterial({
          map: labelTexture(spec_.dieType, spec_.role, color), roughness: 0.38, metalness: 0.12, flatShading: true,
        });
        const mesh = new Mesh(model.geometry, material);
        const edgeMaterial = new LineBasicMaterial({ color: color.clone().multiplyScalar(0.35), transparent: true, opacity: 0.8 });
        mesh.add(new LineSegments(model.edges, edgeMaterial));
        scene.add(mesh);
        const faceIndex = Math.max(0, faceIndexForValue(spec_.dieType, spec_.role, spec_.value));
        return {
          mesh, edgeMaterial, rest: restingQuaternion(model.faces[faceIndex]),
          axisA: randomAxis(), angleA: randomTurns(), axisB: randomAxis(), angleB: randomTurns(),
          x: diceX(i, n, scale), scale, startX: (Math.random() - 0.5) * 3 * scale,
          delay: i * THROW_STAGGER_MS, duration, landed: false, landedAt: 0,
        };
      });
      kick();
    },
    setOutcome(next) {
      outcome = next;
      kick();
    },
    finish() {
      if (forced || dice.length === 0) return;
      forced = true;
      kick();
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      clearDice();
      renderer.dispose();
      renderer.forceContextLoss(); // phones allow only a few WebGL contexts
    },
  };
}
