import {
  BoxGeometry, BufferGeometry, DodecahedronGeometry, Float32BufferAttribute, IcosahedronGeometry, OctahedronGeometry,
  TetrahedronGeometry, Vector3,
} from 'three';
import { dieSides } from './values';

// Pure geometry of the dice: solids and their logical faces (a pentagon is one face, not three triangles).

/**
 * Pentagonal trapezohedron (the d10): two apexes and two staggered rings of five vertices, ten kite faces.
 * The apex/ring heights are the ones that make each kite planar: b = a (1 + cos 36°) / (1 − cos 36°).
 */
function trapezohedron(): BufferGeometry {
  const c = Math.cos(Math.PI / 5);
  const b = 1;
  const a = b * (1 - c) / (1 + c);
  const T = new Vector3(0, 0, b);
  const B = new Vector3(0, 0, -b);
  const ring = (deg: number, z: number) => new Vector3(Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180), z);
  const U = (k: number) => ring(72 * k, a);
  const L = (k: number) => ring(72 * k + 36, -a);

  const positions: number[] = [];
  const quad = (p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3) => {
    const centroid = new Vector3().add(p0).add(p1).add(p2).add(p3).multiplyScalar(0.25);
    const normal = new Vector3().crossVectors(p1.clone().sub(p0), p2.clone().sub(p0));
    // outward-facing winding
    const tris = normal.dot(centroid) >= 0 ? [[p0, p1, p2], [p0, p2, p3]] : [[p0, p2, p1], [p0, p3, p2]];
    tris.forEach(t => t.forEach(p => positions.push(p.x, p.y, p.z)));
  };
  for (let k = 0; k < 5; k++) {
    quad(T, U(k), L(k), U(k + 1));
    quad(B, L(k), U(k + 1), L(k + 1));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** The solid of a die type, with circumradius 1 and centered on the origin. */
export function dieGeometry(dieType: number): BufferGeometry {
  switch (dieSides(dieType)) {
    case 4: return new TetrahedronGeometry(1);
    case 6: return new BoxGeometry(2 / Math.sqrt(3), 2 / Math.sqrt(3), 2 / Math.sqrt(3));
    case 8: return new OctahedronGeometry(1);
    case 10: return trapezohedron();
    case 12: return new DodecahedronGeometry(1);
    default: return new IcosahedronGeometry(1);
  }
}

export interface LogicalFace {
  /** Centroid of the face. */
  center: Vector3;
  /** Outward unit normal. */
  normal: Vector3;
  /** Unit direction in the face plane that points "up" for the number printed on it. */
  up: Vector3;
  /** `up × normal`: with the face towards the viewer, this points to the right. */
  right: Vector3;
  /** Distance from the centroid to the farthest vertex. */
  radius: number;
  /** Indices of the triangles (in draw order) that make the face. */
  triangles: number[];
}

interface Tri { a: Vector3; b: Vector3; c: Vector3; normal: Vector3; area: number; centroid: Vector3 }

function trianglesOf(geometry: BufferGeometry): Tri[] {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const out: Tri[] = [];
  for (let i = 0; i + 2 < pos.count; i += 3) {
    const a = new Vector3().fromBufferAttribute(pos, i);
    const b = new Vector3().fromBufferAttribute(pos, i + 1);
    const c = new Vector3().fromBufferAttribute(pos, i + 2);
    const cross = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    const area = cross.length() / 2;
    out.push({ a, b, c, normal: cross.normalize(), area, centroid: new Vector3().add(a).add(b).add(c).divideScalar(3) });
  }
  return out;
}

const key = (v: Vector3) => `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`;

/** Candidate "up" directions of a face: edge midpoints for a square, vertices otherwise. */
function upCandidates(center: Vector3, vertices: Vector3[]): Vector3[] {
  if (vertices.length === 4) {
    const side = Math.min(...vertices.flatMap((p, i) => vertices.slice(i + 1).map(q => p.distanceTo(q))));
    const diagonal = Math.max(...vertices.flatMap((p, i) => vertices.slice(i + 1).map(q => p.distanceTo(q))));
    if (Math.abs(diagonal - side * Math.SQRT2) < 1e-3) { // a square: use the midpoints of its edges
      const mids: Vector3[] = [];
      vertices.forEach((p, i) => vertices.slice(i + 1).forEach(q => {
        if (Math.abs(p.distanceTo(q) - side) < 1e-3) mids.push(p.clone().add(q).multiplyScalar(0.5));
      }));
      return mids.map(m => m.sub(center));
    }
  }
  if (vertices.length === 4) {
    // a kite (d10): up towards the farthest vertex, the apex
    const far = vertices.reduce((best, p) => (p.distanceTo(center) > best.distanceTo(center) + 1e-6 ? p : best));
    return [far.clone().sub(center)];
  }
  return vertices.map(p => p.clone().sub(center));
}

/** Groups the triangles of a convex solid into its flat faces. */
export function logicalFaces(geometry: BufferGeometry): LogicalFace[] {
  const tris = trianglesOf(geometry);
  const groups: { normal: Vector3; tris: number[] }[] = [];
  tris.forEach((t, i) => {
    const g = groups.find(x => x.normal.dot(t.normal) > 0.999);
    if (g) g.tris.push(i); else groups.push({ normal: t.normal.clone(), tris: [i] });
  });

  return groups.map(g => {
    const members = g.tris.map(i => tris[i]);
    const area = members.reduce((s, t) => s + t.area, 0);
    const center = members.reduce((c, t) => c.add(t.centroid.clone().multiplyScalar(t.area)), new Vector3()).divideScalar(area);
    const normal = members.reduce((n, t) => n.add(t.normal), new Vector3()).normalize();
    if (normal.dot(center) < 0) normal.negate();
    const unique = new Map<string, Vector3>();
    members.forEach(t => [t.a, t.b, t.c].forEach(p => unique.set(key(p), p)));
    const vertices = [...unique.values()];
    // Candidate "up" directions, projected onto the face plane; take the one pointing most upward in world space.
    const candidates = upCandidates(center, vertices).map(d => d.sub(normal.clone().multiplyScalar(d.dot(normal))).normalize());
    const up = candidates.reduce((best, d) => (d.y > best.y + 1e-6 ? d : best));
    const right = new Vector3().crossVectors(up, normal).normalize();
    const radius = Math.max(...vertices.map(p => p.distanceTo(center)));
    return { center, normal, up, right, radius, triangles: g.tris };
  });
}

export interface AtlasLayout { cols: number; rows: number }

/** Grid of cells (one per face) of the label texture. */
export const atlasLayout = (faceCount: number): AtlasLayout => {
  const cols = Math.ceil(Math.sqrt(faceCount));
  return { cols, rows: Math.ceil(faceCount / cols) };
};

/**
 * Non-indexed copy of the die with a UV map: each face points at its own cell of the label atlas,
 * centered, with the face's `up` as the top of the cell.
 */
export function atlasGeometry(geometry: BufferGeometry, faces: LogicalFace[]): BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const pos = g.getAttribute('position');
  const { cols, rows } = atlasLayout(faces.length);
  const uv = new Float32Array(pos.count * 2);
  faces.forEach((face, faceIndex) => {
    const col = faceIndex % cols;
    const row = Math.floor(faceIndex / cols);
    face.triangles.forEach(t => {
      for (let k = 0; k < 3; k++) {
        const i = t * 3 + k;
        const local = new Vector3().fromBufferAttribute(pos, i).sub(face.center);
        const u = local.dot(face.right) / (2 * face.radius) + 0.5;
        const v = local.dot(face.up) / (2 * face.radius) + 0.5;
        uv[i * 2] = (col + u) / cols;
        uv[i * 2 + 1] = 1 - (row + 1 - v) / rows; // canvas rows grow downward
      }
    });
  });
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
