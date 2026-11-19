import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** True when the referenced element is at least `minWidth` px wide. Initial/server value: false. */
export function useContainerWide(ref: RefObject<HTMLElement | null>, minWidth: number): boolean {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => setWide(el.getBoundingClientRect().width >= minWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, minWidth]);

  return wide;
}
