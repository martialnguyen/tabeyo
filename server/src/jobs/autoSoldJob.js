import cron from 'node-cron';
import { collection, serializeDoc, sumVariantStock } from '../utils/firestore.js';
import { randomInt } from '../utils/numbers.js';

export async function runAutoSoldOnce() {
  const now = new Date();
  const snapshot = await collection('products').get();
  const products = snapshot.docs
    .map((doc) => ({ doc, product: serializeDoc(doc) }))
    .filter(({ product }) => product.isActive && product.autoSoldEnabled);
  const results = [];

  for (const { doc, product } of products) {
    const intervalMs = Number(product.autoSoldIntervalHours || 2) * 60 * 60 * 1000;
    const lastAutoSoldAt = product.lastAutoSoldAt ? new Date(product.lastAutoSoldAt) : null;
    if (lastAutoSoldAt && now.getTime() - lastAutoSoldAt.getTime() < intervalMs) {
      continue;
    }

    const availableVariants = product.variants.filter((variant) => Number(variant.stock || 0) > 0);
    if (availableVariants.length === 0) {
      continue;
    }

    const variant = availableVariants[randomInt(0, availableVariants.length - 1)];
    const wantedSold = randomInt(product.autoSoldMin, product.autoSoldMax);
    const actualSold = product.autoReduceStock ? Math.min(wantedSold, variant.stock) : wantedSold;

    if (actualSold <= 0) {
      continue;
    }

    variant.soldCount += actualSold;
    if (product.autoReduceStock) {
      variant.stock -= actualSold;
    }
    product.soldCount += actualSold;
    product.stock = sumVariantStock(product.variants);
    product.lastAutoSoldAt = now;
    product.updatedAt = now;
    await doc.ref.update({
      variants: product.variants,
      soldCount: product.soldCount,
      stock: product.stock,
      lastAutoSoldAt: now,
      updatedAt: now
    });

    results.push({
      productId: product._id,
      productName: product.name,
      variantId: variant._id,
      variantLabel: variant.label,
      soldAdded: actualSold,
      variantStock: variant.stock,
      productStock: product.stock
    });
  }

  return results;
}

export function startAutoSoldJob() {
  if (process.env.ENABLE_AUTO_SOLD === 'false') {
    return;
  }

  cron.schedule('0 */2 * * *', async () => {
    try {
      const results = await runAutoSoldOnce();
      console.log(`Auto sold job finished: ${results.length} products updated`);
    } catch (error) {
      console.error('Auto sold job failed', error);
    }
  });
}
