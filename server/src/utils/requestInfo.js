const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function firstHeaderValue(value = '') {
  return String(value).split(',')[0].trim();
}

export function getVietnamDateKey(date = new Date()) {
  return new Date(date.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}

export function getVietnamDayStart(date = new Date()) {
  return new Date(`${getVietnamDateKey(date)}T00:00:00+07:00`);
}

export function normalizeIp(value = '') {
  const ip = firstHeaderValue(value).replace(/^::ffff:/, '');
  if (!ip || ip === '::1') return '127.0.0.1';
  return ip;
}

export function getClientIp(req) {
  return normalizeIp(
    req.headers['cf-connecting-ip'] ||
      req.headers['true-client-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.socket?.remoteAddress ||
      ''
  );
}

export function getDeviceType(userAgent = '') {
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export function getBrowser(userAgent = '') {
  if (/zalo/i.test(userAgent)) return 'Zalo';
  if (/fbav|fban|facebook/i.test(userAgent)) return 'Facebook';
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome|crios/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox';
  return 'Khac';
}

export function getOS(userAgent = '') {
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac os|macintosh/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Khac';
}

export function getRequestInfo(req) {
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
  return {
    ip: getClientIp(req),
    userAgent,
    deviceType: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
    os: getOS(userAgent)
  };
}

export function safeText(value, maxLength = 300) {
  return String(value || '').trim().slice(0, maxLength);
}
