import { useEffect, useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import {
  loadCustomClasses,
  saveCustomClass,
  deleteCustomClass,
  publishCustomClass,
  withdrawCustomClass,
} from '../../lib/firestoreSync';
import { CustomClassEditor } from './CustomClassEditor';
import type { CustomClassDefinition } from '../../types';
import { EMPTY_20 } from '../../data/classPresets';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newEmptyClass(): CustomClassDefinition {
  const now = Date.now();
  return {
    id: `cls_${genId()}`,
    name: '',
    description: '',
    hitDie: 8,
    status: 'draft',
    armorProficiencies: [],
    weaponProficiencies: '',
    skillsPerLevel: 2,
    classSkills: [],
    bab: [...EMPTY_20],
    saves: { fort: [...EMPTY_20], ref: [...EMPTY_20], will: [...EMPTY_20] },
    features: [],
    createdAt: now,
    updatedAt: now,
  };
}

function statusBadge(cls: CustomClassDefinition): { label: string; color: string; bg: string } {
  if (cls.status === 'draft') {
    return { label: 'Bozza', color: 'var(--theme-text-muted)', bg: 'var(--theme-bg)' };
  }
  const hasUnpublished = cls.publishedAt != null && cls.updatedAt > cls.publishedAt;
  if (hasUnpublished) {
    return { label: 'Modifiche non pubblicate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  }
  return { label: 'Pubblicata', color: 'var(--theme-hp-high)', bg: 'rgba(34,197,94,0.12)' };
}

export function CustomClassList() {
  const user = useAuthStore(s => s.user);
  const customClasses = useDataStore(s => s.customClasses);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadCustomClasses(user.uid)
      .then(cls => useDataStore.getState().setCustomClasses(cls))
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function handleAdd() {
    if (!user) return;
    const cls = newEmptyClass();
    setBusy(cls.id);
    try {
      await saveCustomClass(user.uid, cls);
      useDataStore.getState().upsertCustomClass(cls);
      setExpanded(cls.id);
    } catch (e) {
      console.error('[CustomClassList] add failed:', e);
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(updated: CustomClassDefinition) {
    if (!user) return;
    setBusy(updated.id);
    try {
      await saveCustomClass(user.uid, updated);
      useDataStore.getState().upsertCustomClass(updated);
    } catch (e) {
      console.error('[CustomClassList] save failed:', e);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(cls: CustomClassDefinition) {
    if (!user) return;
    const name = cls.name || 'senza nome';
    const confirmed = window.confirm(
      `Eliminare la classe "${name}"? Questa azione non è reversibile.`
    );
    if (!confirmed) return;
    setBusy(cls.id);
    try {
      await deleteCustomClass(user.uid, cls.id);
      useDataStore.getState().removeCustomClass(cls.id);
      setExpanded(null);
    } catch (e) {
      console.error('[CustomClassList] delete failed:', e);
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish(cls: CustomClassDefinition) {
    if (!user) return;
    setBusy(cls.id);
    try {
      await publishCustomClass(user.uid, cls);
      const now = Date.now();
      useDataStore.getState().upsertCustomClass({ ...cls, status: 'published', publishedAt: now, updatedAt: now });
    } catch (e) {
      console.error('[CustomClassList] publish failed:', e);
    } finally {
      setBusy(null);
    }
  }

  async function handleWithdraw(cls: CustomClassDefinition) {
    if (!user) return;
    setBusy(cls.id);
    try {
      await withdrawCustomClass(user.uid, cls.id);
      useDataStore.getState().upsertCustomClass({ ...cls, status: 'draft', updatedAt: Date.now() });
    } catch (e) {
      console.error('[CustomClassList] withdraw failed:', e);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="anim-spin text-3xl" style={{ color: 'var(--theme-accent)' }}>✦</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          {customClasses.length} {customClasses.length === 1 ? 'classe' : 'classi'}
        </span>
        <button className="pf-btn pf-btn-gold text-sm px-4" onClick={handleAdd} disabled={!!busy}>
          + Aggiungi Classe
        </button>
      </div>

      {customClasses.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--theme-text-faint)' }}>
          Nessuna classe custom. Clicca "+ Aggiungi Classe" per iniziare.
        </div>
      )}

      <div className="space-y-2">
        {customClasses.map(cls => {
          const badge = statusBadge(cls);
          const isOpen = expanded === cls.id;
          const isBusy = busy === cls.id;
          return (
            <div key={cls.id}>
              <button
                className="w-full text-left pf-panel px-4 py-2.5 flex items-center justify-between transition-all"
                style={{
                  borderColor: isOpen ? 'var(--theme-accent)' : undefined,
                  opacity: isBusy ? 0.6 : 1,
                }}
                onClick={() => !isBusy && setExpanded(isOpen ? null : cls.id)}
                disabled={isBusy}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>
                    {cls.name || <em style={{ color: 'var(--theme-text-faint)' }}>senza nome</em>}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: badge.bg, color: badge.color, border: '1px solid currentColor', borderColor: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {isBusy && <span className="text-xs shrink-0" style={{ color: 'var(--theme-text-faint)' }}>…</span>}
                </div>
                <span style={{ color: 'var(--theme-text-faint)' }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="mt-1 pf-panel p-4">
                  <CustomClassEditor
                    key={cls.updatedAt}
                    cls={cls}
                    onSave={handleSave}
                    onDelete={() => handleDelete(cls)}
                    onPublish={() => handlePublish(cls)}
                    onWithdraw={() => handleWithdraw(cls)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
