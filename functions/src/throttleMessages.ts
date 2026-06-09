import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

const WINDOW_MS = 60_000;
const MAX_MESSAGES = 10;

interface RateLimitDoc {
  count: number;
  windowStart: number;
}

export const throttleMessages = onDocumentCreated(
  'lobbies/{lobbyId}/messages/{msgId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const senderId: string | undefined = data.senderId;
    if (!senderId) return;

    const rateLimitRef = db.doc(`users/${senderId}/rateLimits/messages`);
    const now = Date.now();

    const snap = await rateLimitRef.get();

    if (snap.exists) {
      const { count, windowStart } = snap.data() as RateLimitDoc;
      const withinWindow = now - windowStart < WINDOW_MS;

      if (withinWindow && count >= MAX_MESSAGES) {
        await event.data?.ref.delete();
        return;
      }

      if (withinWindow) {
        await rateLimitRef.update({ count: FieldValue.increment(1) });
      } else {
        await rateLimitRef.set({ count: 1, windowStart: now });
      }
    } else {
      await rateLimitRef.set({ count: 1, windowStart: now });
    }
  },
);
