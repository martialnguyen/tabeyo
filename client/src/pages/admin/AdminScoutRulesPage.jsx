import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, Upload, message } from 'antd';
import { FileSpreadsheet, Plus, Pencil, Trash2 } from 'lucide-react';
import readXlsxFile from 'read-excel-file/browser';
import { api } from '../../api/client.js';

const money = (value) => `${Number(value || 0).toLocaleString('ja-JP')} ¥`;

function rowsToRules(rows) {
  const headers = rows[0].map((cell) => String(cell || '').trim().toLowerCase());
  const column = (names) => headers.findIndex((header) => names.includes(header));
  const modelIndex = column(['mã máy', 'tên máy', 'model', 'model code']);
  const queryIndex = column(['từ khóa', 'từ khóa tìm', 'query', 'search query']);
  const defectsIndex = column(['lỗi cần tránh', 'avoid defects', 'defects']);
  const priceIndex = column(['giá tối đa jpy', 'giá tối đa', 'max price jpy', 'max price']);
  if (modelIndex < 0 || priceIndex < 0) throw new Error('Excel cần cột "Mã máy" và "Giá tối đa JPY".');
  return rows.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== '')).map((row) => ({
    model: String(row[modelIndex] || '').trim(),
    query: queryIndex < 0 ? String(row[modelIndex] || '').trim() : String(row[queryIndex] || '').trim(),
    avoidDefects: defectsIndex < 0 ? '' : String(row[defectsIndex] || '').trim(),
    maxPriceJpy: Number(String(row[priceIndex] || '').replace(/[¥,\s]/g, '')),
    active: true
  }));
}

export default function AdminScoutRulesPage() {
  const [form] = Form.useForm();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    try { setRules((await api.get('/scout/rules')).data.rules); }
    catch (error) { message.error(error.response?.data?.message || 'Không tải được tiêu chí.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const showForm = (rule) => {
    setEditing(rule || null);
    form.setFieldsValue(rule || { model: '', query: '', avoidDefects: '', maxPriceJpy: null, active: true });
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) await api.put(`/scout/rules/${editing._id}`, values);
      else await api.post('/scout/rules', values);
      setOpen(false);
      message.success('Đã lưu tiêu chí.');
      await reload();
    } catch (error) {
      if (!error.errorFields) message.error(error.response?.data?.message || 'Không lưu được tiêu chí.');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/scout/rules/${id}`); message.success('Đã xóa.'); await reload(); }
    catch (error) { message.error(error.response?.data?.message || 'Không xóa được.'); }
  };

  const importExcel = async (file) => {
    try {
      const rows = await readXlsxFile(file);
      const parsed = rowsToRules(rows);
      if (!parsed.length) throw new Error('File Excel không có dòng dữ liệu.');
      const result = await api.post('/scout/rules/import', { rules: parsed });
      message.success(`Đã nhập ${result.data.imported} tiêu chí.`);
      await reload();
    } catch (error) { message.error(error.response?.data?.message || error.message || 'Không đọc được file Excel.'); }
    return false;
  };

  const columns = [
    { title: 'Máy cần tìm', dataIndex: 'model', key: 'model', render: (value, row) => <div><strong>{value}</strong><div className="text-xs text-slate-500">{row.query}</div></div> },
    { title: 'Lỗi cần tránh', dataIndex: 'avoidDefects', key: 'avoidDefects', render: (value) => value || 'Chưa đặt' },
    { title: 'Giá mua tối đa', dataIndex: 'maxPriceJpy', key: 'maxPriceJpy', render: money },
    { title: 'Trạng thái', dataIndex: 'active', key: 'active', render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Đang tìm' : 'Tạm dừng'}</Tag> },
    { title: 'Thao tác', key: 'actions', render: (_, row) => <Space><Button icon={<Pencil size={15} />} aria-label="Sửa" title="Sửa" onClick={() => showForm(row)} /><Popconfirm title="Xóa tiêu chí này?" onConfirm={() => remove(row._id)}><Button danger icon={<Trash2 size={15} />} aria-label="Xóa" title="Xóa" /></Popconfirm></Space> }
  ];

  return <div className="admin-page space-y-4">
    <div className="admin-page__heading"><div><h1 className="m-0 text-2xl font-semibold">Máy cần tìm</h1><p className="m-0 text-gray-500">Tìm trên Rakuten công khai. Giá tính bằng JPY; chỉ tiêu chí đang bật mới được quét.</p></div>
      <Space wrap><Upload accept=".xlsx" showUploadList={false} beforeUpload={importExcel}><Button icon={<FileSpreadsheet size={16} />}>Nhập Excel</Button></Upload><Button type="primary" icon={<Plus size={16} />} onClick={() => showForm(null)}>Thêm máy</Button></Space>
    </div>
    <div className="rounded-lg bg-white p-3 shadow-sm"><Table rowKey="_id" columns={columns} dataSource={rules} loading={loading} scroll={{ x: 760 }} pagination={{ pageSize: 10 }} /></div>
    <Modal title={editing ? 'Sửa tiêu chí' : 'Thêm máy cần tìm'} open={open} onCancel={() => setOpen(false)} onOk={save} confirmLoading={saving} okText="Lưu" cancelText="Hủy" destroyOnClose>
      <Form form={form} layout="vertical" className="pt-3">
        <Form.Item name="model" label="Tên hoặc mã máy" rules={[{ required: true, message: 'Nhập tên máy.' }]}><Input placeholder="iPad mini 6 64GB WiFi" maxLength={120} /></Form.Item>
        <Form.Item name="query" label="Từ khóa tìm trên Yahoo Nhật"><Input placeholder="iPad mini 6 64GB 中古" maxLength={160} /></Form.Item>
        <Form.Item name="avoidDefects" label="Lỗi cần tránh"><Input.TextArea rows={3} placeholder="Ví dụ: màn vỡ, khóa iCloud, pin phồng, không lên nguồn" maxLength={600} /></Form.Item>
        <Form.Item name="maxPriceJpy" label="Giá mua tối đa (JPY)" rules={[{ required: true, message: 'Nhập giá tối đa.' }]}><InputNumber min={1} max={10000000} precision={0} className="w-full" formatter={(value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/,/g, '')} /></Form.Item>
        <Form.Item name="active" label="Đang tìm" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  </div>;
}
