"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttleMessages = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
const WINDOW_MS = 60000;
const MAX_MESSAGES = 10;
exports.throttleMessages = (0, firestore_1.onDocumentCreated)('lobbies/{lobbyId}/messages/{msgId}', async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const senderId = data.senderId;
    if (!senderId)
        return;
    const rateLimitRef = db.doc(`users/${senderId}/rateLimits/messages`);
    const now = Date.now();
    const snap = await rateLimitRef.get();
    if (snap.exists) {
        const { count, windowStart } = snap.data();
        const withinWindow = now - windowStart < WINDOW_MS;
        if (withinWindow && count >= MAX_MESSAGES) {
            await ((_b = event.data) === null || _b === void 0 ? void 0 : _b.ref.delete());
            return;
        }
        if (withinWindow) {
            await rateLimitRef.update({ count: firestore_2.FieldValue.increment(1) });
        }
        else {
            await rateLimitRef.set({ count: 1, windowStart: now });
        }
    }
    else {
        await rateLimitRef.set({ count: 1, windowStart: now });
    }
});
//# sourceMappingURL=throttleMessages.js.map