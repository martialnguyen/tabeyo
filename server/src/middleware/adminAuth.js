export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token || token !== (process.env.ADMIN_TOKEN || 'dev-admin-token-change-me')) {
    return res.status(401).json({ message: 'Unauthorized admin request' });
  }

  next();
}
