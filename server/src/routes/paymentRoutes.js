import express from 'express';
import { collection, serializeDoc } from '../utils/firestore.js';

const router = express.Router();

router.get('/active', async (_req, res) => {
  const snapshot = await collection('paymentSettings').orderBy('updatedAt', 'desc').limit(10).get();
  const paymentSetting = snapshot.docs.map(serializeDoc).find((item) => item.isActive) || null;
  res.json({ paymentSetting });
});

export default router;
