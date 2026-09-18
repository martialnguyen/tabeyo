import express from 'express';
import { collection, serializeDoc } from '../utils/firestore.js';

const router = express.Router();
const PRODUCT_FRESH_TTL = 30 * 1000;
const PRODUCT_STALE_TTL = 10 * 60 * 1000;

let productsCache = {
  data: null,
  updatedAt: 0,
  pending: null
};

export function invalidateProductsCache() {
  productsCache = {
    data: null,
    updatedAt: 0,
    pending: null
  };
}

function setPublicProductCacheHeaders(res) {
  res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  res.set('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
}

async function loadActiveProducts() {
  const snapshot = await collection('products').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(serializeDoc).filter((product) => product.isActive);
}

async function refreshProductsCache() {
  if (productsCache.pending) return productsCache.pending;

  productsCache.pending = loadActiveProducts()
    .then((products) => {
      productsCache = {
        data: products,
        updatedAt: Date.now(),
        pending: null
      };
      return products;
    })
    .finally(() => {
      productsCache.pending = null;
    });

  return productsCache.pending;
}

function refreshProductsCacheInBackground() {
  refreshProductsCache().catch((error) => {
    console.error('Background product cache refresh failed:', error.message);
  });
}

router.get('/', async (_req, res) => {
  setPublicProductCacheHeaders(res);

  const now = Date.now();
  const cacheAge = now - productsCache.updatedAt;
  const hasCache = Array.isArray(productsCache.data);

  if (hasCache && cacheAge < PRODUCT_FRESH_TTL) {
    res.set('X-Products-Cache', 'hit');
    return res.json({ products: productsCache.data, cached: true });
  }

  if (hasCache && cacheAge < PRODUCT_STALE_TTL) {
    res.set('X-Products-Cache', 'stale');
    refreshProductsCacheInBackground();
    return res.json({ products: productsCache.data, cached: true, stale: true });
  }

  try {
    const products = await refreshProductsCache();
    res.set('X-Products-Cache', 'miss');
    res.json({ products, cached: false });
  } catch (error) {
    console.error('Failed to load products:', error.message);
    if (hasCache) {
      res.set('X-Products-Cache', 'stale-error');
      return res.json({ products: productsCache.data, cached: true, stale: true });
    }
    res.status(503).json({ message: 'Không tải được sản phẩm. Hãy kiểm tra kết nối Firebase.' });
  }
});

router.get('/:id', async (req, res) => {
  setPublicProductCacheHeaders(res);
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
