import express from 'express';
import { collection } from '../utils/firestore.js';
import { getRequestInfo, getVietnamDateKey, getVietnamDayStart, safeText } from '../utils/requestInfo.js';

const router = express.Router();
let lastPruneAt = 0;

export async function pruneOldVisits(force = false) {
  const now = Date.now();
  if (!force && now - lastPruneAt < 5 * 60 * 1000) return;
  lastPruneAt = now;

  const todayStart = getVietnamDayStart();
  let snapshot = await collection('visits').where('createdAt', '<', todayStart).limit(450).get();

  while (!snapshot.empty) {
    const batch = collection('visits').firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    snapshot = await collection('visits').where('createdAt', '<', todayStart).limit(450).get();
  }
}

router.post('/', async (req, res) => {
  try {
    await pruneOldVisits();

    const requestInfo = getRequestInfo(req);
    const visit = {
      path: safeText(req.body.path, 300) || '/',
      title: safeText(req.body.title, 160),
      referrer: safeText(req.body.referrer, 500),
      screen: safeText(req.body.screen, 60),
      sessionId: safeText(req.body.sessionId, 120),
      dateKey: getVietnamDateKey(),
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      deviceType: requestInfo.deviceType,
      browser: requestInfo.browser,
      os: requestInfo.os,
      createdAt: new Date()
    };

    const visitRef = collection('visits').doc();
    await visitRef.set(visit);
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Failed to track visit:', error.message);
    res.status(202).json({ ok: false });
  }
});

export default router;
