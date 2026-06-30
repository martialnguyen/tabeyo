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
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card><Statistic title="Tong don" value={data?.totalOrders || 0} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="Cho xac nhan" value={data?.pendingOrders || 0} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="Don COD" value={data?.codOrders || 0} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="Doanh thu uoc tinh" value={data?.revenue || 0} formatter={(value) => money.format(value)} /></Card>
        </Col>
      </Row>
      <Card title="Don moi nhat">
        <Table
          rowKey="_id"
          dataSource={data?.latestOrders || []}
          pagination={false}
          columns={[
            { title: 'Ma don', dataIndex: 'orderCode' },
            { title: 'Khach hang', dataIndex: 'customerName' },
            { title: 'SDT', dataIndex: 'phone' },
            { title: 'Thanh toan', dataIndex: 'paymentMethod', render: (value) => <Tag>{value.toUpperCase()}</Tag> },
            { title: 'Tong tien', dataIndex: 'totalAmount', render: (value) => money.format(value) }
          ]}
        />
      </Card>
    </div>
  );
}
