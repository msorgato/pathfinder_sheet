import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { atlasGeometry, atlasLayout, dieGeometry, logicalFaces } from '../components/dice3d/geometry';
import { dieSides, faceIndexForValue, faceLabels, meshSpecs, splitPercentile } from '../components/dice3d/values';
import { restingQuaternion, rotated } from '../components/dice3d/orientation';

const DICE = [4, 6, 8, 10, 12, 20, 100];
const near = (a: Vector3, b: Vector3, eps = 1e-6) => a.distanceTo(b) < eps;
const sgn = (x: number) => (Math.abs(x) < 1e-6 ? 0 : Math.sign(x));

describe('dice geometry', () => {
  it.each([[4, 4], [6, 6], [8, 8], [10, 10], [12, 12], [20, 20], [100, 10]])('d%i has %i logical faces', (die, faces) => {
    expect(dieSides(die)).toBe(faces);
    expect(logicalFaces(dieGeometry(die))).toHaveLength(faces);
  });

  it('normals are unit and outward, "up" is in the face plane, right completes the basis', () => {
    DICE.forEach(die => {
      logicalFaces(dieGeometry(die)).forEach(f => {
        expect(f.normal.length()).toBeCloseTo(1, 6);
        expect(f.normal.dot(f.center)).toBeGreaterThan(0);
        expect(f.up.length()).toBeCloseTo(1, 6);
        expect(f.up.dot(f.normal)).toBeCloseTo(0, 6);
        expect(f.right.dot(f.up)).toBeCloseTo(0, 6);
        expect(f.right.dot(f.normal)).toBeCloseTo(0, 6);
        expect(f.radius).toBeGreaterThan(0);
      });
    });
  });

  it('the d10 kites are planar (every triangle of a face shares its normal) and cover the whole solid', () => {
    const g = dieGeometry(10);
    const faces = logicalFaces(g);
    const total = faces.reduce((n, f) => n + f.triangles.length, 0);
    expect(total).toBe(g.getAttribute('position').count / 3);
    expect(total).toBe(20);
  });
});

describe('labels', () => {
  it('normal dice are numbered 1..N', () => {
    expect(faceLabels(20)).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1)));
    expect(faceLabels(10)).toHaveLength(10);
    expect(faceLabels(10)[9]).toBe('10');
  });
  it('the d100 uses a tens die 00–90 and a units die 0–9', () => {
    expect(faceLabels(100, 'tens')).toEqual(['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']);
    expect(faceLabels(100, 'units')).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });
  it('finds the face of a value', () => {
    expect(faceIndexForValue(20, 'normal', 17)).toBe(16);
    expect(faceIndexForValue(100, 'tens', 40)).toBe(4);
    expect(faceIndexForValue(100, 'tens', 0)).toBe(0);
    expect(faceIndexForValue(100, 'units', 7)).toBe(7);
  });
  it('splits a percentile roll', () => {
    expect(splitPercentile(47)).toEqual({ tens: 40, units: 7 });
    expect(splitPercentile(100)).toEqual({ tens: 0, units: 0 });
    expect(splitPercentile(5)).toEqual({ tens: 0, units: 5 });
    expect(splitPercentile(40)).toEqual({ tens: 40, units: 0 });
    expect(splitPercentile(99)).toEqual({ tens: 90, units: 9 });
  });
});

describe('mesh specs', () => {
  it('one mesh per die, two for each d100', () => {
    expect(meshSpecs([3, 5], 6)).toEqual([
      { dieType: 6, role: 'normal', value: 3 }, { dieType: 6, role: 'normal', value: 5 },
    ]);
    expect(meshSpecs([47], 100)).toEqual([
      { dieType: 100, role: 'tens', value: 40 }, { dieType: 100, role: 'units', value: 7 },
    ]);
  });
});

describe('orientation', () => {
  it('the resting rotation turns every face towards +Z with its up along +Y and right along +X', () => {
    DICE.forEach(die => {
      logicalFaces(dieGeometry(die)).forEach(f => {
        const q = restingQuaternion(f);
        expect(near(rotated(f.normal, q), new Vector3(0, 0, 1))).toBe(true);
        expect(near(rotated(f.up, q), new Vector3(0, 1, 0))).toBe(true);
        expect(near(rotated(f.right, q), new Vector3(1, 0, 0))).toBe(true);
      });
    });
  });
});

describe('label atlas', () => {
  it('lays out one cell per face', () => {
    expect(atlasLayout(20)).toEqual({ cols: 5, rows: 4 });
    expect(atlasLayout(4)).toEqual({ cols: 2, rows: 2 });
    expect(atlasLayout(10)).toEqual({ cols: 4, rows: 3 });
  });

  it('the center of a face maps to the center of its cell, and "up" to increasing v', () => {
    DICE.forEach(die => {
      const base = dieGeometry(die);
      const faces = logicalFaces(base);
      const g = atlasGeometry(base, faces);
      const uv = g.getAttribute('uv');
      const pos = g.getAttribute('position');
      const { cols, rows } = atlasLayout(faces.length);
      faces.forEach((f, faceIndex) => {
        const cellU = ((faceIndex % cols) + 0.5) / cols;
        const cellV = 1 - (Math.floor(faceIndex / cols) + 0.5) / rows;
        const probe = (dir: Vector3) => {
          // a point of the face displaced along `dir`: its uv relative to the cell center
          const t = f.triangles[0] * 3;
          const p = new Vector3().fromBufferAttribute(pos, t);
          const local = p.clone().sub(f.center);
          return { u: local.dot(dir), uvu: uv.getX(t) - cellU, uvv: uv.getY(t) - cellV };
        };
        const r = probe(f.right);
        const up = probe(f.up);
        // u grows with `right`, v grows with `up`
        expect(sgn(r.u)).toBe(sgn(r.uvu));
        expect(sgn(up.u)).toBe(sgn(up.uvv));
        // every vertex of the face stays inside its cell
        f.triangles.forEach(tri => {
          for (let k = 0; k < 3; k++) {
            const i = tri * 3 + k;
            const local = new Vector3().fromBufferAttribute(pos, i).sub(f.center);
            expect((uv.getX(i) - cellU) * cols).toBeCloseTo(local.dot(f.right) / (2 * f.radius), 5);
            expect((uv.getY(i) - cellV) * rows).toBeCloseTo(local.dot(f.up) / (2 * f.radius), 5);
            expect(Math.abs(uv.getX(i) - cellU)).toBeLessThanOrEqual(0.5 / cols + 1e-6);
            expect(Math.abs(uv.getY(i) - cellV)).toBeLessThanOrEqual(0.5 / rows + 1e-6);
          }
        });
      });
    });
  });
});
