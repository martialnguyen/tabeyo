import express from 'express';
import { randomUUID } from 'crypto';
import { collection, serializeDoc, sumVariantStock } from '../utils/firestore.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { upload } from '../middleware/upload.js';
import { uploadBufferToCloudinary, uploadFilesToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

function parseBoolean(value) {
  return value === true || value === 'true' || value === 'on';
}

async function normalizeProductPayload(body, files = []) {
  const productImageFiles = files.images || [];
  const variantImageFiles = files.variantImages || [];
  const hasExistingImages = Object.prototype.hasOwnProperty.call(body, 'existingImages');
  const existingImages = hasExistingImages
    ? JSON.parse(body.existingImages || '[]').filter((image) => typeof image === 'string' && image.trim())
    : null;
  const imageOrder = body.imageOrder ? JSON.parse(body.imageOrder || '[]') : null;
  const newImageIds = JSON.parse(body.newImageIds || '[]');
  const variantGroups = JSON.parse(body.variantGroups || '[]').map((group) => ({
    _id: group._id || randomUUID(),
    name: group.name,
    values: (group.values || []).map((value) => ({
      _id: value._id || randomUUID(),
      value: value.value || value
    }))
  }));
  const newVariantImageIds = JSON.parse(body.newVariantImageIds || '[]');
  const [productImageUrls, variantImageUrls] = await Promise.all([
    uploadFilesToCloudinary(productImageFiles, 'tabeyo/products'),
    uploadFilesToCloudinary(variantImageFiles, 'tabeyo/variants')
  ]);
  const variantImageMap = new Map(
    variantImageUrls.map((url, index) => [newVariantImageIds[index], url])
  );
  const variants = JSON.parse(body.variants || '[]').map((variant) => ({
    _id: variant._id || randomUUID(),
    label: variant.label,
    optionValues: variant.optionValues || {},
    image: variantImageMap.get(variant._id) || variant.image || '',
    sku: variant.sku || '',
    stock: Number(variant.stock || 0),
    soldCount: Number(variant.soldCount || 0)
  }));

  const reviews = JSON.parse(body.reviews || '[]').map((review) => ({
    _id: review._id || randomUUID(),
    customerName: review.customerName,
    avatarUrl: review.avatarUrl || '',
    rating: Number(review.rating || 5),
    content: review.content || '',
    images: review.images || [],
    isVisible: review.isVisible !== false,
    reviewDate: review.reviewDate || new Date()
  }));

  return {
    name: body.name,
    category: body.category || '',
    description: body.description || '',
    price: Number(body.price || 0),
    originalPrice: Number(body.originalPrice || 0),
    soldCount: Number(body.soldCount || 0),
    ratingAverage: Number(body.ratingAverage || 0),
    ratingCount: Number(body.ratingCount || reviews.length),
    variantGroups,
    variants,
    reviews,
    isActive: parseBoolean(body.isActive),
    autoSoldEnabled: parseBoolean(body.autoSoldEnabled),
    autoSoldMin: Number(body.autoSoldMin || 1),
    autoSoldMax: Number(body.autoSoldMax || 10),
    autoSoldIntervalHours: Number(body.autoSoldIntervalHours || 2),
    autoReduceStock: parseBoolean(body.autoReduceStock),
    existingImages,
    imageOrder,
    updatedAt: new Date(),
    newImages: productImageUrls.map((url, index) => ({
      id: newImageIds[index] || `new-${index}`,
      url
    }))
  };
}

function resolveProductImages(payload, fallbackImages = []) {
  const existingImages = payload.existingImages ?? fallbackImages;
  const existingSet = new Set(existingImages);
  const newImageMap = new Map(payload.newImages.map((image) => [image.id, image.url]));

  if (Array.isArray(payload.imageOrder) && payload.imageOrder.length > 0) {
    return payload.imageOrder
      .map((item) => {
        if (item.type === 'existing') return existingSet.has(item.value) ? item.value : null;
        if (item.type === 'new') return newImageMap.get(item.value) || null;
        return null;
      })
      .filter(Boolean);
  }

  return [...existingImages, ...payload.newImages.map((image) => image.url)];
}

router.post('/login', (req, res) => {
  const email = process.env.ADMIN_EMAIL || 'admin@app.local';
  const password = process.env.ADMIN_PASSWORD || '123456';
  const token = process.env.ADMIN_TOKEN || 'dev-admin-token-change-me';

  if (req.body.email === email && req.body.password === password) {
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

router.use(adminAuth);

router.get('/dashboard', async (_req, res) => {
  const ordersSnapshot = await collection('orders').orderBy('createdAt', 'desc').get();
  const orders = ordersSnapshot.docs.map(serializeDoc);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.orderStatus === 'pending').length;
  const codOrders = orders.filter((order) => order.paymentMethod === 'cod').length;
  const latestOrders = orders.slice(0, 8);
  const completedOrders = orders.filter((order) => order.orderStatus !== 'cancelled');

  const revenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  res.json({ totalOrders, pendingOrders, codOrders, latestOrders, revenue });
});

router.get('/products', async (_req, res) => {
  const snapshot = await collection('products').orderBy('createdAt', 'desc').get();
  const products = snapshot.docs.map(serializeDoc);
  res.json({ products });
});

const productUpload = upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'variantImages', maxCount: 80 }
]);

router.post('/products', productUpload, async (req, res) => {
  try {
    const payload = await normalizeProductPayload(req.body, req.files);
    const existingImages = payload.existingImages || [];
    const productRef = collection('products').doc();
    const product = {
      ...payload,
      images: resolveProductImages(payload, existingImages),
      stock: sumVariantStock(payload.variants),
      createdAt: new Date()
    };
    delete product.newImages;
    delete product.existingImages;
    delete product.imageOrder;
    await productRef.set(product);
    res.status(201).json({ product: { _id: productRef.id, ...product } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/products/:id', productUpload, async (req, res) => {
  try {
    const productRef = collection('products').doc(req.params.id);
    const productDoc = await productRef.get();
    if (!productDoc.exists) return res.status(404).json({ message: 'Product not found' });

    const payload = await normalizeProductPayload(req.body, req.files);
    const currentProduct = productDoc.data();
    const existingImages = payload.existingImages ?? currentProduct.images ?? [];
    const nextProduct = {
      ...payload,
      images: resolveProductImages(payload, existingImages),
      stock: sumVariantStock(payload.variants),
      createdAt: currentProduct.createdAt || new Date()
    };
    delete nextProduct.newImages;
    delete nextProduct.existingImages;
    delete nextProduct.imageOrder;
    await productRef.set(nextProduct, { merge: true });
    res.json({ product: { _id: productRef.id, ...nextProduct } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  await collection('products').doc(req.params.id).delete();
  res.json({ ok: true });
});

router.get('/orders', async (_req, res) => {
  const snapshot = await collection('orders').orderBy('createdAt', 'desc').get();
  const orders = snapshot.docs.map(serializeDoc);
  res.json({ orders });
});

router.patch('/orders/:id/status', async (req, res) => {
  const orderRef = collection('orders').doc(req.params.id);
  await orderRef.update({ orderStatus: req.body.orderStatus, updatedAt: new Date() });
  const order = serializeDoc(await orderRef.get());
  res.json({ order });
});

router.get('/payment-settings', async (_req, res) => {
  const snapshot = await collection('paymentSettings').orderBy('updatedAt', 'desc').limit(1).get();
  const paymentSetting = snapshot.empty ? null : serializeDoc(snapshot.docs[0]);
  res.json({ paymentSetting });
});

router.put('/payment-settings', upload.single('qrImage'), async (req, res) => {
  const payload = {
    bankName: req.body.bankName || '',
    accountNumber: req.body.accountNumber || '',
    accountHolder: req.body.accountHolder || '',
    transferContentTemplate: req.body.transferContentTemplate || 'DH-{orderCode}-{phone}',
    isActive: parseBoolean(req.body.isActive)
  };
  if (req.file) payload.qrImage = await uploadBufferToCloudinary(req.file, 'tabeyo/payment');

  const snapshot = await collection('paymentSettings').orderBy('updatedAt', 'desc').limit(1).get();
  const paymentRef = snapshot.empty ? collection('paymentSettings').doc() : snapshot.docs[0].ref;
  const currentPayment = snapshot.empty ? {} : snapshot.docs[0].data();
  const paymentSetting = {
    ...currentPayment,
    ...payload,
    updatedAt: new Date(),
    createdAt: currentPayment.createdAt || new Date()
  };
  await paymentRef.set(paymentSetting, { merge: true });

  res.json({ paymentSetting: { _id: paymentRef.id, ...paymentSetting } });
});

export default router;
