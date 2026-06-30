import 'dotenv/config';
import { connectFirebase } from '../config/firebase.js';
import { collection } from '../utils/firestore.js';

connectFirebase();

const snapshot = await collection('products').get();
let updated = 0;

for (const doc of snapshot.docs) {
  const product = doc.data();
  const reviews = product.reviews || [];
  const nextReviews = reviews.map((review) => ({
    ...review,
    avatarUrl: review.avatarUrl || `https://i.pravatar.cc/96?u=${encodeURIComponent(review.customerName || review._id || doc.id)}`
  }));

  const changed = reviews.some((review, index) => review.avatarUrl !== nextReviews[index].avatarUrl);
  if (changed) {
    await doc.ref.update({
      reviews: nextReviews,
      updatedAt: new Date()
    });
    updated += 1;
  }
}

console.log(`Review avatars updated for ${updated} products.`);
