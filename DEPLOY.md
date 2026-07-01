# Deploy Free

## 1. Backend on Render

Create a new Render Blueprint from this repository, or create a Web Service manually:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Plan: Free

Required environment variables:

```env
CLIENT_URL=https://your-vercel-domain.vercel.app
ADMIN_EMAIL=admin@app.local
ADMIN_PASSWORD=change-this-password
ADMIN_TOKEN=change-this-long-random-token
CRON_SECRET=change-this-long-random-secret
ENABLE_AUTO_SOLD=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Do not use `FIREBASE_SERVICE_ACCOUNT_PATH` on Render. Use the individual Firebase fields above.

## 2. Frontend on Vercel

Create a Vercel project from the same repository:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

Required environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com
```

## 3. Auto Sold Cron

GitHub Actions can trigger the auto-sold job every 2 hours.

Add repository secrets:

```env
API_BASE_URL=https://your-render-service.onrender.com
CRON_SECRET=same-value-as-render-cron-secret
```

The workflow file is `.github/workflows/auto-sold.yml`.

## Image Uploads

Product images, variant images, and payment QR images upload to Cloudinary. Firestore stores only the returned Cloudinary URLs.

Create a free Cloudinary account, then copy the three values from Cloudinary Dashboard:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Discord New Order Notifications

In Discord, open your channel settings, create an Incoming Webhook, copy its Webhook URL, then set this Render environment variable:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

When a new order is created, the backend sends an embed with order code, customer, phone, payment method, total amount, address, note, and line items.
