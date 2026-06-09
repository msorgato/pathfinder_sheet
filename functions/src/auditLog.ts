import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export type AuditAction =
  | 'library.created'
  | 'library.updated'
  | 'library.deleted'
  | 'account.deleted';

export interface AuditEntry {
  action: AuditAction;
  performedBy: string;
  targetId: string;
  targetCollection?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: FieldValue;
}

export async function writeAuditLog(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
  await db.collection('audit_log').add({
    ...entry,
    timestamp: FieldValue.serverTimestamp(),
  });
}

export const auditLog = onDocumentWritten(
  'library/{type}/entries/{entryId}',
  async (event) => {
    const before = event.data?.before?.data() ?? null;
    const after = event.data?.after?.data() ?? null;
    const { type, entryId } = event.params;

    let action: AuditAction;
    let performedBy: string;

    if (!before && after) {
      action = 'library.created';
      performedBy = (after.publishedBy as string) ?? 'unknown';
    } else if (before && !after) {
      action = 'library.deleted';
      performedBy = (before.publishedBy as string) ?? 'unknown';
    } else {
      action = 'library.updated';
      performedBy = (after?.publishedBy as string) ?? 'unknown';
    }

    await writeAuditLog({
      action,
      performedBy,
      targetId: entryId,
      targetCollection: type,
      before,
      after,
    });
  },
);
