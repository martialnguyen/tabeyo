import express from 'express';
import { collection, serializeDoc } from '../utils/firestore.js';

const router = express.Router();
const PRODUCT_CACHE_TTL = 8 * 1000;
const PRODUCT_STALE_TTL = 90 * 1000;

let productsCache = {
  data: null,
  updatedAt: 0
};

export function invalidateProductsCache() {
  productsCache = {
    data: null,
    updatedAt: 0
  };
}

function setNoStoreHeaders(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
}

async function loadActiveProducts() {
  const snapshot = await collection('products').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(serializeDoc).filter((product) => product.isActive);
}

router.get('/', async (req, res) => {
  setNoStoreHeaders(res);
  const now = Date.now();
  const cacheAge = now - productsCache.updatedAt;

  if (productsCache.data && cacheAge < PRODUCT_CACHE_TTL) {
    return res.json({ products: productsCache.data, cached: true });
  }

  try {
    const products = await loadActiveProducts();
    productsCache = {
      data: products,
      updatedAt: now
    };
    res.json({ products, cached: false });
  } catch (error) {
    console.error('Failed to load products:', error.message);
    if (productsCache.data && cacheAge < PRODUCT_STALE_TTL) {
      return res.json({ products: productsCache.data, cached: true, stale: true });
    }
    res.status(503).json({ message: 'Không tải được sản phẩm. Hãy kiểm tra kết nối Firebase.' });
  }
});

router.get('/:id', async (req, res) => {
  setNoStoreHeaders(res);
  try {
    const doc = await collection('products').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Product not found' });
    const product = serializeDoc(doc);
    if (!product.isActive) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    console.error(`Failed to load product ${req.params.id}:`, error.message);
    res.status(503).json({ message: 'Không tải được sản phẩm. Hãy kiểm tra kết nối Firebase.' });
  }
});

export default router;
