import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
  const method = (config.method || 'get').toLowerCase();
  const url = String(config.url || '');
  const isPublicProductGet = method === 'get' && !token && /^\/?products(\/.*)?$/.test(url);
  config.headers = config.headers || {};

  if (method === 'get' && !isPublicProductGet) {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
    config.params = {
      ...(config.params || {}),
      _ts: Date.now()
    };
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function buildCloudinaryTransform(options = {}) {
  const resize = [];
  const delivery = [];
  const crop = options.crop || (options.width || options.height ? 'fill' : '');

  if (crop) resize.push(`c_${crop}`);
  if (options.gravity) resize.push(`g_${options.gravity}`);
  if (options.width) resize.push(`w_${options.width}`);
  if (options.height) resize.push(`h_${options.height}`);
  if (options.dpr) resize.push(`dpr_${options.dpr}`);
  if (options.format !== false) delivery.push(`f_${options.format || 'auto'}`);
  if (options.quality !== false) delivery.push(`q_${options.quality || 'auto'}`);

  return [resize.join(','), ...delivery].filter(Boolean).join('/');
}

function optimizeCloudinaryUrl(url, options) {
  if (!options || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;

  const transform = buildCloudinaryTransform(options);
  if (!transform) return url;

  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}

export const assetUrl = (path, options) => {
  if (!path) return '';
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  return optimizeCloudinaryUrl(url, options);
};
