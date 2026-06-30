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
    message.success('Da luu cau hinh QR');
    loadPayment();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="bg-white p-4">
        <h1 className="mb-4 text-2xl font-semibold">Cau hinh QR thanh toan</h1>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="bankName" label="Ngan hang">
            <Input />
          </Form.Item>
          <Form.Item name="accountNumber" label="So tai khoan">
            <Input />
          </Form.Item>
          <Form.Item name="accountHolder" label="Chu tai khoan">
            <Input />
          </Form.Item>
          <Form.Item name="transferContentTemplate" label="Noi dung chuyen khoan mau">
            <Input placeholder="DH-{orderCode}-{phone}" />
          </Form.Item>
          <Form.Item name="isActive" label="Kich hoat QR" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="qrImageFile" label="Upload anh QR">
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadCloud size={16} />}>Chon anh QR</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit">Luu cau hinh</Button>
        </Form>
      </section>
      <aside className="h-fit bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">QR hien tai</h2>
        {payment?.qrImage ? (
          <img src={assetUrl(payment.qrImage)} alt="QR hien tai" className="h-72 w-full object-contain" />
        ) : (
          <p className="text-gray-500">Chua upload QR.</p>
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
