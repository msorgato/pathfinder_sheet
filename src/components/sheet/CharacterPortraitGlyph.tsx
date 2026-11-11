import type { CSSProperties } from 'react';
import type { Character } from '../../types';
import { resolvePortraitIcon, portraitIconUrl } from '../../data/portraitIcons';

interface Props {
  char: Pick<Character, 'name' | 'classes' | 'portraitIcon'>;
  iconClassName?: string;
  iconStyle?: CSSProperties;
  initialClassName?: string;
  initialStyle?: CSSProperties;
}

/** Icon tinted through a CSS mask, so it takes the current background colour. */
export function PortraitIconMask({ id, className, style }: { id: string; className?: string; style?: CSSProperties }) {
  const url = `url(${portraitIconUrl(id)})`;
  return (
    <span
      aria-hidden="true"
      className={`portrait-icon-mask ${className ?? ''}`}
      style={{ WebkitMaskImage: url, maskImage: url, ...style }}
    />
  );
}

/** Portrait content: chosen icon → primary class icon → name initial. */
export function CharacterPortraitGlyph({ char, iconClassName, iconStyle, initialClassName, initialStyle }: Props) {
  const icon = resolvePortraitIcon(char);
  if (icon) return <PortraitIconMask id={icon} className={iconClassName} style={iconStyle} />;
  return (
    <div className={initialClassName} style={initialStyle}>
      {char.name?.[0] ?? '?'}
    </div>
  );
}
