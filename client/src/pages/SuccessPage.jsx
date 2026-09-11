import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import ShopHeader from '../components/ShopHeader.jsx';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function SuccessPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/code/${orderCode}`).then((res) => setOrder(res.data.order));
  }, [orderCode]);

  return (
    <div className="min-h-screen bg-gray-100">
      <ShopHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="bg-white p-8 text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4 text-green-600" />
          <h1 className="text-2xl font-semibold">Đặt hàng thành công</h1>
          <p className="text-gray-600">Mã đơn hàng: <b>{orderCode}</b></p>
          {order && (
            <div className="mt-6 text-left">
              <p><b>Người nhận:</b> {order.customerName}</p>
              <p><b>Số điện thoại:</b> {order.phone}</p>
              <p><b>Địa chỉ:</b> {order.address}</p>
              <p><b>Thanh toán:</b> {order.paymentMethod === 'qr' ? 'QR' : 'COD'}</p>
              <p><b>Trạng thái:</b> {order.orderStatus}</p>
              <p><b>Tổng tiền:</b> <span className="text-brand-500">{money.format(order.totalAmount)}</span></p>
            </div>
          )}
          <Link to="/" className="mt-6 inline-block rounded-sm bg-brand-500 px-6 py-3 font-semibold text-white no-underline">
            Tiếp tục mua hàng
          </Link>
        </section>
      </main>
    </div>
  );
}
