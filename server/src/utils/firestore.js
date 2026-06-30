import { getDB } from '../config/firebase.js';

export function collection(name) {
  return getDB().collection(name);
}

export function serializeValue(value) {
  if (!value) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, childValue]) => [key, serializeValue(childValue)]));
  }
  return value;
}

export function serializeDoc(doc) {
  return {
    _id: doc.id,
    ...serializeValue(doc.data())
  };
}

export function sumVariantStock(variants = []) {
  return variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
}
