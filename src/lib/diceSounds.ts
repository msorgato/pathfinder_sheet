/**
 * Sounds of the dice reveal, synthesized with Web Audio (no audio files to download).
 * Everything starts from the user's roll, which is a gesture, so browsers allow it.
 */

const VOLUME = 0.25;
const HITS = 8;

/** Times (ms from the start) of the clacks of a rolling die: close together at first, then slower. */
export function rollHitTimes(totalMs: number, hits = HITS): number[] {
  return Array.from({ length: hits }, (_, i) => 0.92 * totalMs * Math.pow(i / (hits - 1), 1.6));
}

interface AudioKit { ctx: AudioContext; master: GainNode; noise: AudioBuffer }
let kit: AudioKit | null | undefined;

function audio(): AudioKit | null {
  if (kit !== undefined) {
    if (kit?.ctx.state === 'suspended') void kit.ctx.resume();
    return kit;
  }
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) { kit = null; return null; }
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    kit = { ctx, master, noise };
    return kit;
  } catch {
    kit = null;
    return null;
  }
}

/** A short burst of filtered noise (a clack or a thud). */
function burst(k: AudioKit, at: number, seconds: number, freq: number, type: BiquadFilterType, gain: number) {
  const src = k.ctx.createBufferSource();
  src.buffer = k.noise;
  const filter = k.ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  const env = k.ctx.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.001, at + seconds);
  src.connect(filter).connect(env).connect(k.master);
  src.start(at, Math.random() * 0.2, seconds + 0.02);
  return src;
}

function tone(k: AudioKit, at: number, seconds: number, from: number, to: number, type: OscillatorType, gain: number) {
  const osc = k.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + seconds);
  const env = k.ctx.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.001, at + seconds);
  osc.connect(env).connect(k.master);
  osc.start(at);
  osc.stop(at + seconds + 0.02);
}

/** Dice clattering for `totalMs`; the returned function silences what has not played yet. */
export function playRoll(totalMs: number): () => void {
  const k = audio();
  if (!k) return () => {};
  const now = k.ctx.currentTime;
  const sources = rollHitTimes(totalMs).map((ms, i) =>
    burst(k, now + ms / 1000, 0.045, 1600 + Math.random() * 1800, 'bandpass', 0.7 - i * 0.05));
  return () => sources.forEach(s => { try { s.stop(); } catch { /* already finished */ } });
}

/** The die coming to rest. */
export function playLand(): void {
  const k = audio();
  if (!k) return;
  const now = k.ctx.currentTime;
  tone(k, now, 0.2, 150, 55, 'sine', 0.6);
  burst(k, now, 0.07, 700, 'lowpass', 0.5);
}

/** A bright flourish for a critical, a falling tone for a fumble. */
export function playOutcome(kind: 'crit' | 'fumble'): void {
  const k = audio();
  if (!k) return;
  const now = k.ctx.currentTime + 0.05;
  if (kind === 'crit') {
    [660, 880, 1100, 1320].forEach((f, i) => tone(k, now + i * 0.07, 0.4, f, f, 'triangle', 0.22));
  } else {
    tone(k, now, 0.5, 330, 110, 'sawtooth', 0.16);
  }
}
