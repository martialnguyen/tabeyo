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

## Important Upload Note

The current upload implementation stores files in `server/uploads`. This works locally, but free hosting may not keep uploaded files forever after restarts or redeploys. For a real public deployment, move product/QR uploads to Firebase Storage or Cloudinary.
