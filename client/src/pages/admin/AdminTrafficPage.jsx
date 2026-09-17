import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Space, Statistic, Table, Tag } from 'antd';
import { RefreshCw } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false
  });
}

function deviceLabel(value) {
  if (value === 'mobile') return 'Điện thoại';
  if (value === 'tablet') return 'Máy tính bảng';
  if (value === 'desktop') return 'Máy tính';
  return value || 'Khác';
}

function renderVisitPage(record) {
  if (record.productId) {
    return (
      <div className="flex min-w-64 items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {record.productImage ? (
            <img src={assetUrl(record.productImage)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="line-clamp-2 font-medium text-gray-900">{record.productName}</div>
          <div className="mt-1 break-all text-xs text-gray-500">{record.path}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-medium text-gray-900">{record.displayPath || record.path}</div>
      {record.path !== '/' && <div className="mt-1 break-all text-xs text-gray-500">{record.path}</div>}
    </div>
  );
}

export default function AdminTrafficPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTraffic = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/traffic');
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTraffic();
  }, []);

  const visits = data?.visits || [];

  return (
    <div className="admin-page space-y-4">
      <div className="admin-page__heading">
        <div>
          <h1 className="m-0 text-2xl font-semibold">Lưu lượng truy cập</h1>
          <p className="m-0 text-gray-500">Chỉ hiển thị dữ liệu trong ngày {data?.dateKey || ''}. Dữ liệu cũ sẽ tự động xoá.</p>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={loadTraffic} loading={loading} className="admin-mobile-full">
          Tải lại
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="admin-stat-card">
            <Statistic title="Lượt truy cập hôm nay" value={data?.totalVisits || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-stat-card">
            <Statistic title="IP khác nhau" value={data?.uniqueIps || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-stat-card">
            <Statistic title="Trang được xem" value={data?.paths?.length || 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Trang được xem nhiều" className="admin-stat-card">
            <Space wrap>
              {(data?.paths || []).map((item) => (
                <Tag key={item.name} color="blue">
                  {item.name}: {item.count}
                </Tag>
              ))}
              {!data?.paths?.length && <span className="text-gray-500">Chưa có dữ liệu</span>}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Thiết bị và trình duyệt" className="admin-stat-card">
            <div className="space-y-3">
              <Space wrap>
                {(data?.devices || []).map((item) => (
                  <Tag key={item.name} color="green">
                    {deviceLabel(item.name)}: {item.count}
                  </Tag>
                ))}
              </Space>
              <Space wrap>
                {(data?.browsers || []).map((item) => (
                  <Tag key={item.name} color="purple">
                    {item.name}: {item.count}
                  </Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết truy cập trong ngày" className="admin-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={visits}
          scroll={{ x: 1180 }}
          columns={[
            { title: 'Thời gian', dataIndex: 'createdAt', width: 180, render: formatDateTime },
            { title: 'IP', dataIndex: 'ip', width: 150, render: (value) => <Tag color="geekblue">{value || 'Không rõ'}</Tag> },
            { title: 'Trang / Sản phẩm', dataIndex: 'displayPath', width: 360, render: (_, record) => renderVisitPage(record) },
            { title: 'Thiết bị', dataIndex: 'deviceType', width: 130, render: (value) => deviceLabel(value) },
            { title: 'Trình duyệt', dataIndex: 'browser', width: 130 },
            { title: 'Hệ điều hành', dataIndex: 'os', width: 130 },
            { title: 'Màn hình', dataIndex: 'screen', width: 120 },
            {
              title: 'Nguồn vào',
              dataIndex: 'referrer',
              ellipsis: true,
              render: (value) => value || 'Truy cập trực tiếp'
            }
          ]}
        />
      </Card>
    </div>
  );
}
