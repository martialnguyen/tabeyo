import 'dotenv/config';
import { randomUUID } from 'crypto';
import { connectFirebase } from '../config/firebase.js';
import { collection } from '../utils/firestore.js';

connectFirebase();

function makeGroup(name, values) {
  return {
    _id: randomUUID(),
    name,
    values: [...new Set(values.filter(Boolean))].map((value) => ({
      _id: randomUUID(),
      value
    }))
  };
}

const sizeValues = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '1m6', '1m8', '30ml', '50ml']);
const snapshot = await collection('products').get();
let updated = 0;

for (const doc of snapshot.docs) {
  const product = doc.data();
  if (product.variantGroups?.length) continue;

  const variants = product.variants || [];
  const parts = variants.map((variant) => String(variant.label || '').split('/').map((part) => part.trim()).filter(Boolean));
  const maxParts = Math.max(...parts.map((item) => item.length), 0);

  if (!variants.length || maxParts === 0) continue;

  let variantGroups = [];
  let nextVariants = variants;

  if (maxParts === 1) {
    variantGroups = [makeGroup('Phan loai', parts.map((item) => item[0]))];
    nextVariants = variants.map((variant, index) => ({
      ...variant,
      optionValues: {
        'Phan loai': parts[index]?.[0] || variant.label
      },
      image: variant.image || product.images?.[index % (product.images?.length || 1)] || ''
    }));
  } else {
    const firstValues = parts.map((item) => item[0]);
    const secondValues = parts.map((item) => item[1]);
    const secondLooksLikeSize = secondValues.some((value) => sizeValues.has(value));
    const groupNames = secondLooksLikeSize ? ['Mau sac', 'Kich co'] : ['Lua chon 1', 'Lua chon 2'];
    variantGroups = [makeGroup(groupNames[0], firstValues), makeGroup(groupNames[1], secondValues)];
    nextVariants = variants.map((variant, index) => ({
      ...variant,
      optionValues: {
        [groupNames[0]]: parts[index]?.[0] || '',
        [groupNames[1]]: parts[index]?.[1] || ''
      },
      image: variant.image || product.images?.[index % (product.images?.length || 1)] || ''
    }));
  }

  await doc.ref.update({
    variantGroups,
    variants: nextVariants,
    updatedAt: new Date()
  });
  updated += 1;
}

console.log(`Variant groups upgraded for ${updated} products.`);
