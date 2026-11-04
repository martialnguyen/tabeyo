import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { collection, serializeDoc } from '../utils/firestore.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { normalizeScoutRule, notifyNewFinds, runIpadScout } from '../jobs/ipadScout.js';
import { insertScoutFindings, normalizeScoutFinding } from '../jobs/scoutIngest.js';

const router = express.Router();

function validIngestSecret(value) {
  const secret = process.env.SCOUT_INGEST_SECRET;
  if (!secret || typeof value !== 'string') return false;
  const supplied = Buffer.from(value);
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

router.post('/ingest', async (req, res) => {
  if (!validIngestSecret(req.headers['x-scout-ingest-secret'])) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  let items;
  try {
    const raw = Array.isArray(req.body?.items) ? req.body.items : [req.body];
    if (raw.length < 1 || raw.length > 20) {
      return res.status(400).json({ message: 'Mỗi lần gửi cần từ 1 đến 20 tin đăng.' });
    }
    items = raw.map(normalizeScoutFinding);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const { created, duplicates, notification } = await insertScoutFindings(items, collection('ipadScoutResults'), notifyNewFinds);
    return res.status(created.length ? 201 : 200).json({
      inserted: created.length,
      duplicates,
      results: created.map(({ _id, url }) => ({ _id, url })),
      discord: notification
    });
  } catch (error) {
    console.error('Scout ingest:', error);
    return res.status(500).json({ message: 'Không lưu được tin đăng.' });
  }
});

router.post('/schedule', async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  runIpadScout('external-schedule').catch((error) => console.error('iPad scout:', error));
  res.status(202).json({ started: true });
});

router.use(adminAuth);

router.get('/rules', async (_req, res) => {
  const snapshot = await collection('ipadScoutRules').get();
  res.json({ rules: snapshot.docs.map(serializeDoc).sort((a, b) => a.model.localeCompare(b.model)) });
});

router.post('/rules', async (req, res) => {
  try {
    const rule = normalizeScoutRule(req.body);
    const ref = collection('ipadScoutRules').doc();
    await ref.set({ ...rule, createdAt: new Date(), updatedAt: new Date() });
    res.status(201).json({ rule: serializeDoc(await ref.get()) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/rules/import', async (req, res) => {
  try {
    if (!Array.isArray(req.body.rules) || req.body.rules.length < 1 || req.body.rules.length > 200) {
      throw new Error('File cần có từ 1 đến 200 dòng dữ liệu.');
    }
    const rules = req.body.rules.map(normalizeScoutRule);
    const batch = collection('ipadScoutRules').firestore.batch();
    for (const rule of rules) {
      batch.set(collection('ipadScoutRules').doc(), { ...rule, createdAt: new Date(), updatedAt: new Date() });
    }
    await batch.commit();
    res.status(201).json({ imported: rules.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/rules/:id', async (req, res) => {
  try {
    const ref = collection('ipadScoutRules').doc(req.params.id);
    if (!(await ref.get()).exists) return res.status(404).json({ message: 'Không tìm thấy tiêu chí.' });
    await ref.update({ ...normalizeScoutRule(req.body), updatedAt: new Date() });
    res.json({ rule: serializeDoc(await ref.get()) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/rules/:id', async (req, res) => {
  await collection('ipadScoutRules').doc(req.params.id).delete();
  res.json({ ok: true });
});

router.get('/results', async (_req, res) => {
  const [results, runs, state] = await Promise.all([
    collection('ipadScoutResults').orderBy('foundAt', 'desc').limit(200).get(),
    collection('ipadScoutRuns').orderBy('startedAt', 'desc').limit(10).get(),
    collection('ipadScoutState').doc('current').get()
  ]);
  res.json({ results: results.docs.map(serializeDoc), runs: runs.docs.map(serializeDoc), state: state.exists ? serializeDoc(state) : null });
});

router.patch('/results/:id', async (req, res) => {
  if (!['new', 'needs_review', 'saved', 'dismissed'].includes(req.body.status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  const ref = collection('ipadScoutResults').doc(req.params.id);
  if (!(await ref.get()).exists) return res.status(404).json({ message: 'Không tìm thấy tin.' });
  await ref.update({ status: req.body.status, updatedAt: new Date() });
  res.json({ result: serializeDoc(await ref.get()) });
});

router.post('/run', async (_req, res) => {
  runIpadScout('manual').catch((error) => console.error('iPad scout:', error));
  res.status(202).json({ started: true });
});

export default router;
