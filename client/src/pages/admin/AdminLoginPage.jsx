import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'antd';
import { api } from '../../api/client.js';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@app.local', password: '123456' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const res = await api.post('/admin/login', form);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin');
    } catch {
      setError('Sai tai khoan hoac mat khau admin.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Dang nhap admin</h1>
        {error && <Alert type="error" message={error} className="mb-4" />}
        <div className="space-y-3">
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-sm border border-gray-300 px-3 py-2"
            placeholder="Email"
          />
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-sm border border-gray-300 px-3 py-2"
            placeholder="Mat khau"
            type="password"
          />
          <button className="w-full rounded-sm bg-brand-500 px-4 py-2 font-semibold text-white">Dang nhap</button>
        </div>
      </form>
    </main>
  );
}
