import admin from 'firebase-admin';
import fs from 'fs';

let firestore = null;

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
    return JSON.parse(raw);
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  return null;
}

export function connectFirebase() {
  if (firestore) return firestore;

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in server/.env.'
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined
    });
  }

  firestore = admin.firestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  console.log('Firebase Firestore connected');
  return firestore;
}

export function getDB() {
  return connectFirebase();
}
