import { Matrix4, Quaternion, Vector3 } from 'three';
import type { LogicalFace } from './geometry';

/**
 * The rotation that turns a face towards the viewer (+Z, the camera looks down −Z),
 * with its "up" along +Y and its "right" along +X, so the number reads upright.
 */
export function restingQuaternion(face: Pick<LogicalFace, 'right' | 'up' | 'normal'>): Quaternion {
  // makeBasis maps X, Y, Z onto right, up, normal; the inverse takes them back to the screen axes.
  const basis = new Matrix4().makeBasis(face.right, face.up, face.normal);
  return new Quaternion().setFromRotationMatrix(basis).invert();
}

/** Where a vector ends up after the die is rotated by `q` (for tests and for aiming effects). */
export const rotated = (v: Vector3, q: Quaternion) => v.clone().applyQuaternion(q);
