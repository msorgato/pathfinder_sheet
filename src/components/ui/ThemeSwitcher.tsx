import { THEMES } from '../../themes';
import { useThemeStore } from '../../store/themeStore';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1.5" title="Seleziona tema">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: theme === t.id
              ? '2px solid var(--theme-text)'
              : '2px solid transparent',
            background: `linear-gradient(135deg, ${t.swatch1} 40%, ${t.swatch2} 100%)`,
            cursor: 'pointer',
            outline: theme === t.id ? '1px solid var(--theme-accent)' : 'none',
            outlineOffset: '1px',
            transition: 'all 0.15s',
            transform: theme === t.id ? 'scale(1.2)' : 'scale(1)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
