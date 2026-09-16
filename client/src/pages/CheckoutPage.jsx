import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Radio, Steps } from 'antd';
import { ArrowLeft, CreditCard, Home, MapPin, MessageSquareText, PackageCheck, Phone, ShieldCheck, Truck, UserRound } from 'lucide-react';
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
  const productImage = variant?.image || product?.images?.[0];

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
    <div className="min-h-screen bg-slate-100">
      <ShopHeader />
      <main className="checkout-page mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="checkout-steps rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <Steps current={step} items={[{ title: 'Thông tin đặt hàng' }, { title: 'Thanh toán' }]} />
        </div>
        {error && <Alert type="error" message={error} className="mt-4" />}
        {product && variant && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
            <section className="checkout-card">
              {step === 0 ? (
                <form onSubmit={nextStep} className="space-y-4">
                  <div>
                    <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase text-brand-600">
                      <ShieldCheck size={14} />
                      Thông tin bảo mật
                    </p>
                    <h1 className="m-0 text-xl font-bold text-slate-950 sm:text-2xl">Thông tin người nhận</h1>
                    <p className="mt-2 text-sm text-slate-500">Điền đúng thông tin để shop xác nhận và giao máy nhanh hơn.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="checkout-field">
                      <UserRound size={18} />
                      <input
                        value={form.customerName}
                        onChange={(event) => updateForm('customerName', event.target.value)}
                        placeholder="Họ tên"
                      />
                    </label>
                    <label className="checkout-field">
                      <Phone size={18} />
                      <input
                        value={form.phone}
                        onChange={(event) => updateForm('phone', event.target.value)}
                        placeholder="Số điện thoại"
                      />
                    </label>
                  </div>

                  <Radio.Group
                    value={form.addressType}
                    onChange={(event) => updateForm('addressType', event.target.value)}
                    className="grid w-full gap-3 sm:grid-cols-2"
                  >
                    <label className={`checkout-choice ${form.addressType === 'before_merge' ? 'checkout-choice--active' : ''}`}>
                      <Radio value="before_merge">Địa chỉ trước sáp nhập</Radio>
                      <span>Dùng địa chỉ theo tên phường/xã cũ.</span>
                    </label>
                    <label className={`checkout-choice ${form.addressType === 'after_merge' ? 'checkout-choice--active' : ''}`}>
                      <Radio value="after_merge">Địa chỉ sau sáp nhập</Radio>
                      <span>Dùng địa chỉ hành chính mới.</span>
                    </label>
                  </Radio.Group>

                  <label className="checkout-field checkout-field--textarea">
                    <MapPin size={18} />
                    <textarea
                      value={form.address}
                      onChange={(event) => updateForm('address', event.target.value)}
                      placeholder="Địa chỉ chi tiết"
                      rows={4}
                    />
                  </label>
                  <label className="checkout-field checkout-field--textarea">
                    <MessageSquareText size={18} />
                    <textarea
                      value={form.note}
                      onChange={(event) => updateForm('note', event.target.value)}
                      placeholder="Ghi chú đơn hàng"
                      rows={3}
                    />
                  </label>
                  <button className="checkout-primary-button">
                    Tiếp tục thanh toán
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase text-brand-600">
                      <CreditCard size={14} />
                      Thanh toán linh hoạt
                    </p>
                    <h1 className="m-0 text-xl font-bold text-slate-950 sm:text-2xl">Chọn phương thức thanh toán</h1>
                    <p className="mt-2 text-sm text-slate-500">Bạn có thể nhận hàng kiểm tra rồi thanh toán hoặc chuyển khoản QR trước.</p>
                  </div>
                  <Radio.Group
                    value={form.paymentMethod}
                    onChange={(event) => updateForm('paymentMethod', event.target.value)}
                    className="grid w-full gap-3 sm:grid-cols-2"
                  >
                    <label className={`checkout-choice ${form.paymentMethod === 'cod' ? 'checkout-choice--active' : ''}`}>
                      <Radio value="cod">Thanh toán khi nhận hàng</Radio>
                      <span>COD, nhận máy rồi thanh toán.</span>
                    </label>
                    <label className={`checkout-choice ${form.paymentMethod === 'qr' ? 'checkout-choice--active' : ''}`}>
                      <Radio value="qr">Thanh toán ngay bằng QR</Radio>
                      <span>Chuyển khoản nhanh theo mã QR.</span>
                    </label>
                  </Radio.Group>
                  {form.paymentMethod === 'qr' && payment && (
                    <div className="rounded-lg border border-brand-100 bg-brand-50/80 p-4">
                      {payment.qrImage && (
                        <img src={assetUrl(payment.qrImage)} alt="QR thanh toán" className="mx-auto mb-3 h-56 w-56 rounded-lg bg-white object-contain p-2 shadow-sm" />
                      )}
                      <p className="m-0 font-semibold">{payment.bankName}</p>
                      <p className="m-0">STK: {payment.accountNumber}</p>
                      <p className="m-0">Chủ TK: {payment.accountHolder}</p>
                      <p className="mt-2 text-sm text-gray-600">Nội dung: DH - {form.phone}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button onClick={() => setStep(0)} className="checkout-secondary-button">
                      <ArrowLeft size={18} />
                      Quay lại
                    </button>
                    <button
                      onClick={createOrder}
                      disabled={submitting}
                      className="checkout-primary-button disabled:bg-gray-300"
                    >
                      {form.paymentMethod === 'qr' ? 'Tôi đã thanh toán' : 'Đặt hàng COD'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <aside className="checkout-summary h-fit">
              <div className="mb-4 flex items-center gap-2">
                <PackageCheck size={20} className="text-brand-500" />
                <h2 className="m-0 text-lg font-bold text-slate-950">Đơn hàng</h2>
              </div>
              <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                  {productImage ? (
                    <img src={assetUrl(productImage)} alt={product.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="m-0 line-clamp-2 font-semibold text-slate-950">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-500">Phân loại: {variant.label}</p>
                  <p className="m-0 text-sm text-slate-500">Số lượng: {quantity}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <Truck size={17} />
                Shop sẽ liên hệ xác nhận trước khi giao.
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-bold">
                <span>Tổng tiền</span>
                <span className="text-lg text-brand-600">{money.format(total)}</span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
