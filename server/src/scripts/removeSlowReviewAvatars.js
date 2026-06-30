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
    avatarUrl: review.avatarUrl?.includes('i.pravatar.cc') ? '' : review.avatarUrl || ''
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

console.log(`Slow remote review avatars removed for ${updated} products.`);
