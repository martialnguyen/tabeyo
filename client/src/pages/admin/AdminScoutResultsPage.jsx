import { useEffect, useState } from 'react';
import { Button, Select, Space, Table, Tag, message } from 'antd';
import { ExternalLink, RefreshCw, Search } from 'lucide-react';
import { api } from '../../api/client.js';

const date = (value) => value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa chạy';
const money = (value) => `${Number(value || 0).toLocaleString('ja-JP')} ¥`;

export default function AdminScoutResultsPage() {
  const [data, setData] = useState({ results: [], runs: [], state: null });
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const reload = async () => {
    setLoading(true);
    try { setData((await api.get('/scout/results')).data); }
    catch (error) { message.error(error.response?.data?.message || 'Không tải được kết quả.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!running && data.state?.status !== 'running') return undefined;
    const timer = setInterval(async () => {
      try {
        const next = (await api.get('/scout/results')).data;
        setData(next);
        if (next.state?.status !== 'running') setRunning(false);
      } catch { setRunning(false); }
    }, 5000);
    return () => clearInterval(timer);
  }, [running, data.state?.status]);

  const run = async () => {
    setRunning(true);
    try {
      await api.post('/scout/run');
      message.success('Đã bắt đầu tìm máy. Kết quả sẽ tự cập nhật.');
      await reload();
    } catch (error) { message.error(error.response?.data?.message || 'Không chạy được tìm kiếm.'); setRunning(false); }
  };

  const updateStatus = async (id, status) => {
    try { await api.patch(`/scout/results/${id}`, { status }); await reload(); }
    catch (error) { message.error(error.response?.data?.message || 'Không lưu được trạng thái.'); }
  };

  const columns = [
    { title: 'Máy', key: 'machine', width: 280, render: (_, row) => <div className="flex items-center gap-3">{row.imageUrl && <img src={row.imageUrl} alt="" className="h-14 w-14 rounded object-cover" loading="lazy" />}<div><div className="font-semibold">{row.title}</div><div className="text-xs text-slate-500">{row.model} · {row.source}</div></div></div> },
    { title: 'Cấu hình', dataIndex: 'configuration', key: 'configuration', width: 180 },
    { title: 'Giá', dataIndex: 'priceJpy', key: 'priceJpy', width: 120, render: money },
    { title: 'Lỗi / lưu ý', dataIndex: 'defects', key: 'defects', width: 200, render: (value, row) => <div>{value || 'Không thấy lỗi trong mô tả'}<div className="text-xs text-slate-500">{row.reason}</div></div> },
    { title: 'Phát hiện', dataIndex: 'foundAt', key: 'foundAt', width: 160, render: date },
    { title: 'Tin gốc', dataIndex: 'url', key: 'url', width: 100, render: (url) => <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">Xem tin <ExternalLink size={14} /></a> },
    { title: 'Theo dõi', dataIndex: 'status', key: 'status', width: 130, render: (value, row) => <Select value={value} style={{ width: 120 }} onChange={(next) => updateStatus(row._id, next)} options={[{ value: 'new', label: 'Mới' }, { value: 'saved', label: 'Quan tâm' }, { value: 'dismissed', label: 'Bỏ qua' }]} /> }
  ];

  const last = data.runs?.[0];
  return <div className="admin-page space-y-4">
    <div className="admin-page__heading"><div><h1 className="m-0 text-2xl font-semibold">Tin iPad tìm được</h1><p className="m-0 text-gray-500">Kiểm tra giá, tình trạng và khả năng mua trên tin gốc trước khi chốt.</p></div>
      <Space wrap><Button icon={<RefreshCw size={16} />} onClick={reload} loading={loading}>Tải lại</Button><Button type="primary" icon={<Search size={16} />} onClick={run} loading={running}>Tìm ngay</Button></Space>
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm"><Tag color={last?.status === 'completed' ? 'green' : last?.status === 'running' ? 'blue' : 'orange'}>{last?.status || 'Chưa chạy'}</Tag><span>Lần chạy: {date(last?.startedAt)}</span><span>Đã quét: {last?.scanned || 0}</span><span>Tin mới: {last?.found || 0}</span>{last?.errors?.length > 0 && <span className="text-red-600">{last.errors[0]}</span>}</div>
    <div className="rounded-lg bg-white p-3 shadow-sm"><Table rowKey="_id" dataSource={data.results} columns={columns} loading={loading} scroll={{ x: 1250 }} pagination={{ pageSize: 12 }} /></div>
  </div>;
}
