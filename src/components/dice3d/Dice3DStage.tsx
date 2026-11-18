import { useEffect, useRef } from 'react';
import type { RollOutcome } from '../../utils/rollReveal';
import { meshSpecs } from './values';
import { disableDice3D, getDiceSceneModule } from './loader';
import type { DiceScene } from './scene';

/** CSS colour of the character's accent, falling back to the app's gold. */
function accentColor(el: HTMLElement): string {
  const style = getComputedStyle(el);
  return style.getPropertyValue('--char-accent').trim() || style.getPropertyValue('--gold').trim() || '#d4a574';
}

/**
 * The 3D dice of a roll, drawn on a transparent canvas. Same props as the 2D `DiceStage`:
 * it is swapped in by `RollReveal` when the 3D scene is ready. `onFail` lets the reveal fall back to 2D.
 */
export function Dice3DStage({ dice, dieType, spinning, outcome, spinMs, onFail }: {
  dice: number[];
  dieType: number;
  spinning: boolean;
  outcome: RollOutcome;
  spinMs: number;
  onFail: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DiceScene | null>(null);
  const onFailRef = useRef(onFail);
  useEffect(() => { onFailRef.current = onFail; });

  // One scene per mount; the dice and their result are fixed for the life of the reveal.
  // Each scene gets a fresh canvas: a canvas whose WebGL context was released cannot be reused (StrictMode remounts).
  useEffect(() => {
    const host = hostRef.current;
    const mod = getDiceSceneModule();
    if (!host || !mod) { onFailRef.current(); return; }
    const canvas = document.createElement('canvas');
    canvas.className = 'dice-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const fail = () => { disableDice3D(); onFailRef.current(); };
    const scene = mod.createDiceScene(canvas, fail);
    if (!scene) { canvas.remove(); return; }
    sceneRef.current = scene;
    try {
      scene.play({ dice: meshSpecs(dice, dieType), color: accentColor(canvas), spinMs });
    } catch {
      fail();
    }
    return () => { scene.dispose(); sceneRef.current = null; canvas.remove(); };
  // the reveal is remounted for each roll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The step after the spin (or a skip) lands the dice at once.
  useEffect(() => { if (!spinning) sceneRef.current?.finish(); }, [spinning]);
  useEffect(() => { sceneRef.current?.setOutcome(outcome); }, [outcome]);

  return <div ref={hostRef} className="dice-host" aria-hidden="true" />;
}
