import { useEffect, useState } from 'react';
import { Button, Drawer, Select, Space, Table, Tag, message } from 'antd';
import { api } from '../../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const statusOptions = [
  { value: 'pending', label: 'Cho xac nhan' },
  { value: 'confirmed', label: 'Da xac nhan' },
  { value: 'shipping', label: 'Dang giao' },
  { value: 'completed', label: 'Hoan thanh' },
  { value: 'cancelled', label: 'Da huy' }
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = () => api.get('/admin/orders').then((res) => setOrders(res.data.orders));

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id, orderStatus) => {
    await api.patch(`/admin/orders/${id}/status`, { orderStatus });
    message.success('Da cap nhat trang thai');
    loadOrders();
  };

  return (
    <div className="space-y-4">
      <h1 className="m-0 text-2xl font-semibold">Quan ly don hang</h1>
      <Table
        rowKey="_id"
        dataSource={orders}
        scroll={{ x: 1000 }}
        columns={[
          { title: 'Ma don', dataIndex: 'orderCode' },
          { title: 'Khach hang', dataIndex: 'customerName' },
          { title: 'SDT', dataIndex: 'phone' },
          {
            title: 'Dia chi',
            render: (_, record) => (
              <span>{record.addressType === 'before_merge' ? 'Truoc sap nhap' : 'Sau sap nhap'}</span>
            )
          },
          { title: 'Thanh toan', dataIndex: 'paymentMethod', render: (value) => <Tag>{value.toUpperCase()}</Tag> },
          { title: 'Tong tien', dataIndex: 'totalAmount', render: (value) => money.format(value) },
          {
            title: 'Trang thai',
            dataIndex: 'orderStatus',
            render: (value, record) => (
              <Select
                value={value}
                options={statusOptions}
                className="w-36"
                onChange={(nextStatus) => updateStatus(record._id, nextStatus)}
              />
            )
          },
          {
            title: 'Thao tac',
            render: (_, record) => (
              <Space>
                <Button onClick={() => setSelectedOrder(record)}>Chi tiet</Button>
              </Space>
            )
          }
        ]}
      />

      <Drawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Chi tiet don hang" width={520}>
        {selectedOrder && (
          <div className="space-y-3">
            <p><b>Ma don:</b> {selectedOrder.orderCode}</p>
            <p><b>Khach:</b> {selectedOrder.customerName}</p>
            <p><b>SDT:</b> {selectedOrder.phone}</p>
            <p><b>Loai dia chi:</b> {selectedOrder.addressType === 'before_merge' ? 'Truoc sap nhap' : 'Sau sap nhap'}</p>
            <p><b>Dia chi:</b> {selectedOrder.address}</p>
            <p><b>Ghi chu:</b> {selectedOrder.note || 'Khong co'}</p>
            <div>
              <b>San pham:</b>
              {selectedOrder.items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="mt-2 rounded-sm border border-gray-200 p-3">
                  <p className="m-0 font-medium">{item.productName}</p>
                  <p className="m-0 text-sm text-gray-600">Phan loai: {item.variantLabel}</p>
                  <p className="m-0 text-sm text-gray-600">SL: {item.quantity} x {money.format(item.price)}</p>
                </div>
              ))}
            </div>
            <p><b>Tong tien:</b> <span className="text-brand-500">{money.format(selectedOrder.totalAmount)}</span></p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
