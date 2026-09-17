import { useEffect, useState } from 'react';
import { Button, Form, Input, Switch, Upload, message } from 'antd';
import { UploadCloud } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';

export default function AdminPaymentPage() {
  const [form] = Form.useForm();
  const [payment, setPayment] = useState(null);

  const loadPayment = () => {
    api.get('/admin/payment-settings').then((res) => {
      setPayment(res.data.paymentSetting);
      form.setFieldsValue(res.data.paymentSetting || { isActive: true });
    });
  };

  useEffect(() => {
    loadPayment();
  }, []);

  const save = async (values) => {
    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'qrImageFile') payload.append(key, value ?? '');
    });
    const file = values.qrImageFile?.fileList?.[0]?.originFileObj;
    if (file) payload.append('qrImage', file);
    await api.put('/admin/payment-settings', payload);
    message.success('Đã lưu cấu hình QR');
    loadPayment();
  };

  return (
    <div className="admin-page grid gap-4 xl:grid-cols-[1fr_340px]">
      <section className="admin-detail-card">
        <div className="mb-4">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-brand-600">Thanh toán</p>
          <h1 className="m-0 text-2xl font-bold text-slate-950">Cấu hình QR thanh toán</h1>
          <p className="m-0 text-sm text-slate-500">Ảnh QR này sẽ hiển thị khi khách chọn thanh toán ngay.</p>
        </div>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="bankName" label="Ngân hàng">
            <Input />
          </Form.Item>
          <Form.Item name="accountNumber" label="Số tài khoản">
            <Input />
          </Form.Item>
          <Form.Item name="accountHolder" label="Chủ tài khoản">
            <Input />
          </Form.Item>
          <Form.Item name="transferContentTemplate" label="Nội dung chuyển khoản mẫu">
            <Input placeholder="DH-{orderCode}-{phone}" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt QR" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="qrImageFile" label="Upload ảnh QR">
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadCloud size={16} />}>Chọn ảnh QR</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" className="admin-mobile-full">
            Lưu cấu hình
          </Button>
        </Form>
      </section>
      <aside className="admin-detail-card h-fit">
        <h2 className="mb-3 text-lg font-semibold">QR hiện tại</h2>
        {payment?.qrImage ? (
          <img src={assetUrl(payment.qrImage)} alt="QR hiện tại" className="h-72 w-full rounded-2xl bg-slate-50 object-contain p-3" />
        ) : (
          <p className="text-gray-500">Chưa upload QR.</p>
        )}
        <div className="mt-3 text-sm text-gray-600">
          <p className="m-0">{payment?.bankName}</p>
          <p className="m-0">{payment?.accountNumber}</p>
          <p className="m-0">{payment?.accountHolder}</p>
        </div>
      </aside>
    </div>
  );
}
