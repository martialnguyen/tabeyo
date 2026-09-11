import express from 'express';
import { collection, serializeDoc } from '../utils/firestore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const snapshot = await collection('products').orderBy('createdAt', 'desc').get();
    const products = snapshot.docs.map(serializeDoc).filter((product) => product.isActive);
    res.json({ products });
  } catch (error) {
    console.error('Failed to load products:', error.message);
    res.status(503).json({ message: 'Khong tai duoc san pham. Hay kiem tra ket noi Firebase.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await collection('products').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Product not found' });
    const product = serializeDoc(doc);
    if (!product.isActive) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    console.error(`Failed to load product ${req.params.id}:`, error.message);
    res.status(503).json({ message: 'Khong tai duoc san pham. Hay kiem tra ket noi Firebase.' });
  }
});

export default router;
