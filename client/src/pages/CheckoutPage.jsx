import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Radio, Steps } from 'antd';
import ShopHeader from '../components/ShopHeader.jsx';
import { api, assetUrl } from '../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CheckoutPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [payment, setPayment] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    addressType: 'after_merge',
    address: '',
    note: '',
    paymentMethod: 'cod'
  });

  const variantId = searchParams.get('variant');
  const quantity = Number(searchParams.get('qty') || 1);

  useEffect(() => {
    Promise.all([api.get(`/products/${id}`), api.get('/payment-settings/active')])
      .then(([productRes, paymentRes]) => {
        setProduct(productRes.data.product);
        setPayment(paymentRes.data.paymentSetting);
      })
      .catch(() => setError('Không tải được thông tin thanh toán.'));
  }, [id]);

  const variant = useMemo(() => product?.variants?.find((item) => item._id === variantId), [product, variantId]);
  const total = (product?.price || 0) * quantity;

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const nextStep = (event) => {
    event.preventDefault();
    if (!form.customerName || !form.phone || !form.address) {
      setError('Vui lòng nhập đủ tên, số điện thoại và địa chỉ.');
      return;
    }
    setError('');
    setStep(1);
  };

  const createOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/orders', {
        ...form,
        items: [
          {
            productId: product._id,
            productName: product.name,
            variantId: variant._id,
            variantLabel: variant.label,
            quantity,
            price: product.price
          }
        ]
      });
      navigate(`/success/${res.data.order.orderCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo đơn hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ShopHeader />
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="bg-white p-4">
          <Steps current={step} items={[{ title: 'Thông tin đặt hàng' }, { title: 'Thanh toán' }]} />
        </div>
        {error && <Alert type="error" message={error} className="mt-4" />}
        {product && variant && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
            <section className="bg-white p-4">
              {step === 0 ? (
                <form onSubmit={nextStep} className="space-y-4">
                  <h1 className="text-xl font-semibold">Thông tin người nhận</h1>
                  <input
                    value={form.customerName}
                    onChange={(event) => updateForm('customerName', event.target.value)}
                    placeholder="Họ tên"
                    className="w-full rounded-sm border border-gray-300 px-3 py-2 outline-brand-500"
                  />
                  <input
                    value={form.phone}
                    onChange={(event) => updateForm('phone', event.target.value)}
                    placeholder="Số điện thoại"
                    className="w-full rounded-sm border border-gray-300 px-3 py-2 outline-brand-500"
                  />
                  <Radio.Group value={form.addressType} onChange={(event) => updateForm('addressType', event.target.value)}>
                    <Radio value="before_merge">Địa chỉ trước sáp nhập</Radio>
                    <Radio value="after_merge">Địa chỉ sau sáp nhập</Radio>
                  </Radio.Group>
                  <textarea
                    value={form.address}
                    onChange={(event) => updateForm('address', event.target.value)}
                    placeholder="Địa chỉ chi tiết"
                    rows={4}
                    className="w-full rounded-sm border border-gray-300 px-3 py-2 outline-brand-500"
                  />
                  <textarea
                    value={form.note}
                    onChange={(event) => updateForm('note', event.target.value)}
                    placeholder="Ghi chú đơn hàng"
                    rows={3}
                    className="w-full rounded-sm border border-gray-300 px-3 py-2 outline-brand-500"
                  />
                  <button className="rounded-sm bg-brand-500 px-6 py-3 font-semibold text-white">Tiếp tục thanh toán</button>
                </form>
              ) : (
                <div className="space-y-4">
                  <h1 className="text-xl font-semibold">Chọn phương thức thanh toán</h1>
                  <Radio.Group value={form.paymentMethod} onChange={(event) => updateForm('paymentMethod', event.target.value)}>
                    <div className="space-y-3">
                      <Radio value="cod">Thanh toán khi nhận hàng - COD</Radio>
                      <Radio value="qr">Thanh toán ngay bằng QR</Radio>
                    </div>
                  </Radio.Group>
                  {form.paymentMethod === 'qr' && payment && (
                    <div className="rounded-sm border border-brand-100 bg-brand-50 p-4">
                      {payment.qrImage && (
                        <img src={assetUrl(payment.qrImage)} alt="QR thanh toán" className="mb-3 h-56 w-56 object-contain" />
                      )}
                      <p className="m-0 font-semibold">{payment.bankName}</p>
                      <p className="m-0">STK: {payment.accountNumber}</p>
                      <p className="m-0">Chủ TK: {payment.accountHolder}</p>
                      <p className="mt-2 text-sm text-gray-600">Nội dung: DH - {form.phone}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="rounded-sm border border-gray-300 px-6 py-3">
                      Quay lại
                    </button>
                    <button
                      onClick={createOrder}
                      disabled={submitting}
                      className="rounded-sm bg-brand-500 px-6 py-3 font-semibold text-white disabled:bg-gray-300"
                    >
                      {form.paymentMethod === 'qr' ? 'Tôi đã thanh toán' : 'Đặt hàng COD'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <aside className="h-fit bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Đơn hàng</h2>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-500">Phân loại: {variant.label}</p>
              <p className="text-sm text-gray-500">Số lượng: {quantity}</p>
              <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
                <span>Tổng tiền</span>
                <span className="text-brand-500">{money.format(total)}</span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
