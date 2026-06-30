import express from 'express';
import { collection, serializeDoc } from '../utils/firestore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const snapshot = await collection('products').orderBy('createdAt', 'desc').get();
  const products = snapshot.docs.map(serializeDoc).filter((product) => product.isActive);
  res.json({ products });
});

router.get('/:id', async (req, res) => {
  const doc = await collection('products').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ message: 'Product not found' });
  const product = serializeDoc(doc);
  if (!product.isActive) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

export default router;
