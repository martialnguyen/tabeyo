import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { Boxes, CreditCard, LayoutDashboard, LogOut, PackageCheck } from 'lucide-react';

const { Header, Content, Sider } = Layout;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const selectedKey = location.pathname.includes('/admin/products')
    ? 'products'
    : location.pathname.includes('/admin/orders')
      ? 'orders'
      : location.pathname.includes('/admin/payment')
        ? 'payment'
        : 'dashboard';

  return (
    <Layout className="admin-shell min-h-screen">
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="px-4 py-4 text-lg font-bold text-white">Shop Admin</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: <Link to="/admin">Dashboard</Link> },
            { key: 'products', icon: <Boxes size={18} />, label: <Link to="/admin/products">San pham</Link> },
            { key: 'orders', icon: <PackageCheck size={18} />, label: <Link to="/admin/orders">Don hang</Link> },
            { key: 'payment', icon: <CreditCard size={18} />, label: <Link to="/admin/payment">QR thanh toan</Link> }
          ]}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between bg-white px-4 shadow-sm">
          <span className="font-semibold">Quan tri he thong</span>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-sm border border-gray-300 px-3 py-2 text-sm">
            <LogOut size={16} />
            Dang xuat
          </button>
        </Header>
        <Content className="p-4">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
