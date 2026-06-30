import express from 'express';
import { runAutoSoldOnce } from '../jobs/autoSoldJob.js';

const router = express.Router();

router.post('/auto-sold', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
    return res.status(401).json({ message: 'Invalid cron secret' });
  }

  const results = await runAutoSoldOnce();
  res.json({ updated: results.length, results });
});

export default router;
