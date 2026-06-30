# App Shopee MVP

Website ban hang don gian lay cam hung tu marketplace:

- Nguoi dung khong can dang nhap.
- Xem luoi san pham, chi tiet san pham, chon phan loai, dien thong tin dat hang.
- Thanh toan bang QR do admin upload hoac COD.
- Admin quan ly san pham, don hang, QR thanh toan.
- Tu dong moi 2 tieng tang luot ban ngau nhien 1-10 va giam ton kho theo tung phan loai.

## Cong nghe

- Frontend: ReactJS, Vite, Tailwind CSS, Bootstrap, Ant Design.
- Backend: NodeJS, ExpressJS, Firebase Admin SDK, Firestore.
- Upload: Multer local uploads.
- Scheduler: node-cron.

## Cai dat

```bash
npm run install:all
```

Tao file `server/.env` theo mau `server/.env.example`.

## Firebase setup

1. Vao Firebase Console va tao project.
2. Vao `Build > Firestore Database`, tao database o che do production hoac test.
3. Vao `Project settings > Service accounts`.
4. Bam `Generate new private key` de tai file service account JSON.
5. Co 2 cach cau hinh backend:

Dung duong dan file JSON:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=D:\PROJECT\App_shopee\server\firebase-service-account.json
```

Hoac paste tung field tu file JSON:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Sau do seed du lieu:

```bash
npm run seed
```

Chay dev:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000

## Admin mac dinh

- URL: http://localhost:5173/admin/login
- Email: admin@app.local
- Mat khau: 123456

Co the doi trong `server/.env`.
