import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { api } from '../../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setData(res.data));
  }, []);

  return (
    <div className="admin-page space-y-4">
      <div className="admin-page__heading">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-brand-600">Anipad Admin</p>
          <h1 className="m-0 text-2xl font-bold text-slate-950">Tổng quan cửa hàng</h1>
          <p className="m-0 text-sm text-slate-500">Theo dõi đơn hàng, COD và doanh thu ước tính trong hệ thống.</p>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="admin-stat-card"><Statistic title="Tổng đơn" value={data?.totalOrders || 0} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="admin-stat-card"><Statistic title="Chờ xác nhận" value={data?.pendingOrders || 0} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="admin-stat-card"><Statistic title="Đơn COD" value={data?.codOrders || 0} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="admin-stat-card"><Statistic title="Doanh thu ước tính" value={data?.revenue || 0} formatter={(value) => money.format(value)} /></Card>
        </Col>
      </Row>
      <Card title="Đơn mới nhất" className="admin-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="_id"
          dataSource={data?.latestOrders || []}
          pagination={false}
          scroll={{ x: 760 }}
          columns={[
            { title: 'Mã đơn', dataIndex: 'orderCode', width: 150 },
            { title: 'Khách hàng', dataIndex: 'customerName', width: 180 },
            { title: 'SĐT', dataIndex: 'phone', width: 140 },
            { title: 'Thanh toán', dataIndex: 'paymentMethod', width: 130, render: (value) => <Tag>{value.toUpperCase()}</Tag> },
            { title: 'Tổng tiền', dataIndex: 'totalAmount', width: 160, render: (value) => money.format(value) }
          ]}
        />
      </Card>
    </div>
  );
}
