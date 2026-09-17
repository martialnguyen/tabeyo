import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { Boxes, CreditCard, LayoutDashboard, LogOut, PackageCheck, RadioTower } from 'lucide-react';

const { Header, Content, Sider } = Layout;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const logout = () => {
    sessionStorage.removeItem('adminToken');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const selectedKey = location.pathname.includes('/admin/products')
    ? 'products'
    : location.pathname.includes('/admin/orders')
      ? 'orders'
      : location.pathname.includes('/admin/traffic')
        ? 'traffic'
        : location.pathname.includes('/admin/payment')
          ? 'payment'
          : 'dashboard';

  return (
    <Layout className="admin-shell min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={224}
        collapsed={collapsed}
        onBreakpoint={(broken) => {
          setMobileMenu(broken);
          setCollapsed(broken);
        }}
        onCollapse={(nextCollapsed) => setCollapsed(nextCollapsed)}
      >
        <div className="admin-brand">
          <div className="admin-brand__mark">A</div>
          <div>
            <p className="m-0 text-base font-bold text-white">Anipad</p>
            <p className="m-0 text-xs text-slate-400">Store Admin</p>
          </div>
        </div>
        <div className="admin-sidebar-nav">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={() => {
              if (mobileMenu) setCollapsed(true);
            }}
            items={[
              { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: <Link to="/admin">Dashboard</Link> },
              { key: 'products', icon: <Boxes size={18} />, label: <Link to="/admin/products">Sản phẩm</Link> },
              { key: 'orders', icon: <PackageCheck size={18} />, label: <Link to="/admin/orders">Đơn hàng</Link> },
              { key: 'traffic', icon: <RadioTower size={18} />, label: <Link to="/admin/traffic">Lưu lượng</Link> },
              { key: 'payment', icon: <CreditCard size={18} />, label: <Link to="/admin/payment">QR thanh toán</Link> }
            ]}
          />
        </div>
        <div className="admin-sidebar-footer">
          <button onClick={logout} className="admin-sidebar-logout" aria-label="Đăng xuất" title="Đăng xuất">
            <LogOut size={17} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </Sider>
      <Layout>
        <Header className="admin-header">
          <span className="font-semibold text-slate-900">Quản trị hệ thống</span>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
