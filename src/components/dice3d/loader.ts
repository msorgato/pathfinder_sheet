/**
 * Loads the 3D scene on demand: three.js is a separate chunk, fetched when the first animated roll is likely,
 * so the app starts exactly as before. Nothing here imports three statically.
 */
type SceneModule = typeof import('./scene');

let loaded: SceneModule | null = null;
let scheduled = false;
let disabled = false;
let webgl: boolean | undefined;

/** Whether the browser can create a WebGL context (checked once). */
export function webglAvailable(): boolean {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement('canvas');
      webgl = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** Starts downloading the 3D scene when the browser is idle (no-op if unsupported, disabled or already loading). */
export function preloadDice3D(): void {
  if (typeof document === 'undefined' || scheduled || disabled || !webglAvailable()) return;
  scheduled = true;
  const start = () => {
    import('./scene')
      .then(m => { loaded = m; })
      .catch(() => { disabled = true; });
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 500);
}

/** True once the scene is downloaded and the device can show it. */
export const dice3DReady = () => !!loaded && !disabled && webglAvailable();

export const getDiceSceneModule = () => loaded;

/** Turns the 3D dice off for the rest of the session (e.g. after a lost WebGL context). */
export function disableDice3D(): void {
  disabled = true;
}
