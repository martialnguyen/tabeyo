import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Drawer, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { Clock3, CreditCard, Eye, MapPin, PackageCheck, Phone, Trash2, UserRound } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const statusOptions = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã huỷ' }
];

const statusColor = {
  pending: 'gold',
  confirmed: 'blue',
  shipping: 'cyan',
  completed: 'green',
  cancelled: 'red'
};

function getAddressTypeLabel(value) {
  return value === 'before_merge' ? 'Trước sáp nhập' : 'Sau sáp nhập';
}

function getPrimaryItem(order = {}) {
  return order.items?.[0] || {};
}

function ProductThumb({ item, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14';

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm`}>
      {item?.productImage ? (
        <img src={assetUrl(item.productImage)} alt={item.productName || ''} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-400">No image</div>
      )}
    </div>
  );
}

function OrderProductsPreview({ order }) {
  const item = getPrimaryItem(order);
  const extraCount = Math.max((order.items?.length || 0) - 1, 0);

  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <ProductThumb item={item} />
      <div className="min-w-0">
        <div className="line-clamp-2 font-semibold text-slate-900">{item.productName || 'Chưa có sản phẩm'}</div>
        <div className="mt-1 text-xs text-slate-500">
          {item.variantLabel || 'Không có phân loại'} · SL {item.quantity || 0}
          {extraCount > 0 && <span className="ml-1 font-semibold text-brand-600">+{extraCount} sản phẩm</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.orderStatus === 'pending').length;
    const shipping = orders.filter((order) => order.orderStatus === 'shipping').length;
    const revenue = orders
      .filter((order) => order.orderStatus !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return { total: orders.length, pending, shipping, revenue };
  }, [orders]);

  const updateStatus = async (id, orderStatus) => {
    await api.patch(`/admin/orders/${id}/status`, { orderStatus });
    message.success('Đã cập nhật trạng thái');
    loadOrders();
  };

  const deleteOrder = async (id) => {
    await api.delete(`/admin/orders/${id}`);
    message.success('Đã xoá đơn hàng');
    if (selectedOrder?._id === id) setSelectedOrder(null);
    loadOrders();
  };

  return (
    <div className="admin-page space-y-5">
      <div className="admin-page__heading">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-brand-600">Anipad Admin</p>
          <h1 className="m-0 text-2xl font-bold text-slate-950">Quản lý đơn hàng</h1>
          <p className="m-0 text-sm text-slate-500">Theo dõi đơn mới, sản phẩm khách đặt và dấu hiệu spam theo IP.</p>
        </div>
        <Button onClick={loadOrders} loading={loading}>
          Làm mới
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="admin-stat-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-slate-500">Tổng đơn</p>
              <p className="m-0 text-2xl font-bold text-slate-950">{stats.total}</p>
            </div>
            <PackageCheck className="text-brand-500" size={28} />
          </div>
        </Card>
        <Card className="admin-stat-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-slate-500">Chờ xác nhận</p>
              <p className="m-0 text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <Clock3 className="text-amber-500" size={28} />
          </div>
        </Card>
        <Card className="admin-stat-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-slate-500">Đang giao</p>
              <p className="m-0 text-2xl font-bold text-cyan-600">{stats.shipping}</p>
            </div>
            <MapPin className="text-cyan-500" size={28} />
          </div>
        </Card>
        <Card className="admin-stat-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-slate-500">Doanh thu ước tính</p>
              <p className="m-0 text-xl font-bold text-emerald-600">{money.format(stats.revenue)}</p>
            </div>
            <CreditCard className="text-emerald-500" size={28} />
          </div>
        </Card>
      </div>

      <Card className="admin-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={orders}
          scroll={{ x: 1240 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: 'Mã đơn',
              dataIndex: 'orderCode',
              width: 150,
              render: (value) => <span className="font-semibold text-slate-950">{value}</span>
            },
            {
              title: 'Sản phẩm',
              width: 330,
              render: (_, record) => <OrderProductsPreview order={record} />
            },
            {
              title: 'Khách hàng',
              width: 190,
              render: (_, record) => (
                <div>
                  <div className="font-semibold text-slate-900">{record.customerName}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Phone size={12} />
                    {record.phone}
                  </div>
                </div>
              )
            },
            {
              title: 'Địa chỉ',
              width: 260,
              render: (_, record) => (
                <div className="max-w-72">
                  <div className="line-clamp-2 font-medium text-slate-900">{record.address || 'Chưa có địa chỉ'}</div>
                  <div className="mt-1 text-xs text-slate-500">{getAddressTypeLabel(record.addressType)}</div>
                </div>
              )
            },
            {
              title: 'IP',
              dataIndex: 'customerIp',
              width: 140,
              render: (value) => <Tag color="geekblue">{value || 'Chưa có'}</Tag>
            },
            {
              title: 'Thanh toán',
              dataIndex: 'paymentMethod',
              width: 120,
              render: (value) => <Tag className="admin-soft-tag">{String(value || '').toUpperCase()}</Tag>
            },
            {
              title: 'Tổng tiền',
              dataIndex: 'totalAmount',
              width: 140,
              render: (value) => <span className="font-bold text-brand-600">{money.format(value || 0)}</span>
            },
            {
              title: 'Trạng thái',
              dataIndex: 'orderStatus',
              width: 170,
              render: (value, record) => (
                <Select
                  value={value}
                  options={statusOptions}
                  className="w-40"
                  onChange={(nextStatus) => updateStatus(record._id, nextStatus)}
                />
              )
            },
            {
              title: 'Thao tác',
              width: 180,
              render: (_, record) => (
                <Space>
                  <Button icon={<Eye size={15} />} onClick={() => setSelectedOrder(record)}>
                    Chi tiết
                  </Button>
                  <Popconfirm
                    title="Xoá đơn hàng?"
                    description="Đơn hàng sẽ bị xoá khỏi hệ thống."
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => deleteOrder(record._id)}
                  >
                    <Button danger icon={<Trash2 size={15} />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Drawer
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Chi tiết đơn hàng"
        width="min(620px, 100vw)"
        className="admin-order-drawer"
        rootClassName="admin-order-drawer-root"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="admin-detail-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-wide text-slate-500">Mã đơn</p>
                  <h2 className="m-0 text-xl font-bold text-slate-950">{selectedOrder.orderCode}</h2>
                </div>
                <Tag color={statusColor[selectedOrder.orderStatus] || 'default'}>
                  {statusOptions.find((item) => item.value === selectedOrder.orderStatus)?.label || selectedOrder.orderStatus}
                </Tag>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="admin-detail-card">
                <p className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                  <UserRound size={16} />
                  Khách hàng
                </p>
                <p className="m-0">{selectedOrder.customerName}</p>
                <p className="m-0 text-sm text-slate-500">{selectedOrder.phone}</p>
              </div>
              <div className="admin-detail-card">
                <p className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin size={16} />
                  Giao hàng
                </p>
                <p className="m-0">{selectedOrder.address}</p>
                <p className="m-0 text-sm text-slate-500">{getAddressTypeLabel(selectedOrder.addressType)}</p>
              </div>
            </div>

            <div className="admin-detail-card">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="m-0"><b>IP đặt hàng:</b> {selectedOrder.customerIp || 'Chưa có'}</p>
                <p className="m-0">
                  <b>Thiết bị:</b>{' '}
                  {[selectedOrder.customerDevice, selectedOrder.customerBrowser, selectedOrder.customerOs].filter(Boolean).join(' / ') || 'Chưa có'}
                </p>
                <p className="m-0 sm:col-span-2"><b>Ghi chú:</b> {selectedOrder.note || 'Không có'}</p>
              </div>
            </div>

            <div className="admin-detail-card">
              <p className="mb-3 font-semibold text-slate-950">Sản phẩm trong đơn</p>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="order-item-card">
                    <ProductThumb item={item} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 line-clamp-2 font-semibold text-slate-950">{item.productName}</p>
                      <p className="m-0 text-sm text-slate-500">Phân loại: {item.variantLabel}</p>
                      <p className="m-0 text-sm text-slate-500">SL: {item.quantity} x {money.format(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-detail-total">
              <span>Tổng tiền</span>
              <b>{money.format(selectedOrder.totalAmount)}</b>
            </div>

            <Popconfirm
              title="Xoá đơn hàng?"
              description="Đơn hàng sẽ bị xoá khỏi hệ thống."
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteOrder(selectedOrder._id)}
            >
              <Button danger block icon={<Trash2 size={16} />}>
                Xoá đơn hàng
              </Button>
            </Popconfirm>
          </div>
        )}
      </Drawer>
    </div>
  );
}
