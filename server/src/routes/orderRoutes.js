import express from 'express';
import { collection, serializeDoc, sumVariantStock } from '../utils/firestore.js';
import { createOrderCode } from '../utils/numbers.js';
import { notifyDiscordNewOrder } from '../utils/discord.js';
import { getRequestInfo } from '../utils/requestInfo.js';
import { invalidateProductsCache } from './productRoutes.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { customerName, phone, addressType, address, note, paymentMethod, items } = req.body;
  const requestInfo = getRequestInfo(req);

  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Missing order information' });
  }

  try {
    const orderRef = collection('orders').doc();
    let createdOrder = null;

    await collection('orders').firestore.runTransaction(async (transaction) => {
      let totalAmount = 0;
      const normalizedItems = [];
      const productReads = [];

      for (const item of items) {
        const productRef = collection('products').doc(item.productId);
        const productDoc = await transaction.get(productRef);
        productReads.push({ item, productRef, productDoc });
      }

      for (const { item, productRef, productDoc } of productReads) {
        if (!productDoc.exists) throw new Error('Product not available');
        const product = productDoc.data();
        if (!product || !product.isActive) throw new Error('Product not available');

        const variants = product.variants || [];
        const variantIndex = variants.findIndex((variant) => variant._id === item.variantId);
        const variant = variants[variantIndex];
        if (!variant) throw new Error('Variant not found');

        const quantity = Number(item.quantity || 1);
        if (variant.stock < quantity) throw new Error(`Variant ${variant.label} is out of stock`);

        variant.stock -= quantity;
        variant.soldCount += quantity;
        variants[variantIndex] = variant;
        const soldCount = Number(product.soldCount || 0) + quantity;
        const stock = sumVariantStock(variants);

        transaction.update(productRef, {
          variants,
          soldCount,
          stock,
          updatedAt: new Date()
        });

        totalAmount += product.price * quantity;
        normalizedItems.push({
          productId: productDoc.id,
          productName: product.name,
          productImage: variant.image || product.images?.[0] || '',
          variantId: variant._id,
          variantLabel: variant.label,
          variantImage: variant.image || '',
          quantity,
          price: product.price
        });
      }

      createdOrder = {
        orderCode: createOrderCode(),
        customerName,
        phone,
        addressType,
        address,
        note,
        items: normalizedItems,
        totalAmount,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        customerIp: requestInfo.ip,
        customerDevice: requestInfo.deviceType,
        customerBrowser: requestInfo.browser,
        customerOs: requestInfo.os,
        customerUserAgent: requestInfo.userAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      transaction.set(orderRef, createdOrder);
    });

    const order = { _id: orderRef.id, ...createdOrder };
    invalidateProductsCache();
    await notifyDiscordNewOrder(order);
    res.status(201).json({ order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/code/:orderCode', async (req, res) => {
  const snapshot = await collection('orders').where('orderCode', '==', req.params.orderCode).limit(1).get();
  if (snapshot.empty) return res.status(404).json({ message: 'Order not found' });
  const order = serializeDoc(snapshot.docs[0]);
  res.json({ order });
});

export default router;
