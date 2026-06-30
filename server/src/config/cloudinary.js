import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

let configured = false;

function ensureCloudinaryConfig() {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Missing Cloudinary config. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
  configured = true;
}

export function uploadBufferToCloudinary(file, folder = 'tabeyo') {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const publicId = `${Date.now()}-${randomUUID()}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
}

export async function uploadFilesToCloudinary(files = [], folder = 'tabeyo') {
  return Promise.all(files.map((file) => uploadBufferToCloudinary(file, folder)));
}
