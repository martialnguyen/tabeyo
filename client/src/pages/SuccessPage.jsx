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
          <h1 className="text-2xl font-semibold">Dat hang thanh cong</h1>
          <p className="text-gray-600">Ma don hang: <b>{orderCode}</b></p>
          {order && (
            <div className="mt-6 text-left">
              <p><b>Nguoi nhan:</b> {order.customerName}</p>
              <p><b>So dien thoai:</b> {order.phone}</p>
              <p><b>Dia chi:</b> {order.address}</p>
              <p><b>Thanh toan:</b> {order.paymentMethod === 'qr' ? 'QR' : 'COD'}</p>
              <p><b>Trang thai:</b> {order.orderStatus}</p>
              <p><b>Tong tien:</b> <span className="text-brand-500">{money.format(order.totalAmount)}</span></p>
            </div>
          )}
          <Link to="/" className="mt-6 inline-block rounded-sm bg-brand-500 px-6 py-3 font-semibold text-white no-underline">
            Tiep tuc mua hang
          </Link>
        </section>
      </main>
    </div>
  );
}
