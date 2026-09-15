import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'antd';
import { api } from '../../api/client.js';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/admin/login', form);
      sessionStorage.setItem('adminToken', res.data.token);
      localStorage.removeItem('adminToken');
      navigate('/admin');
    } catch {
      setError('Sai tài khoản hoặc mật khẩu admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">Anipad Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Đăng nhập quản trị</h1>
        </div>
        {error && <Alert type="error" message={error} className="mb-4" />}
        <div className="space-y-3">
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Email admin"
            type="email"
            autoComplete="username"
            required
          />
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Mật khẩu"
            type="password"
            autoComplete="current-password"
            required
          />
          <button
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </main>
  );
}
