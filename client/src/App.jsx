import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import FloatingContact from './components/FloatingContact.jsx';
import ShopFooter from './components/ShopFooter.jsx';
import VisitTracker from './components/VisitTracker.jsx';

const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const SuccessPage = lazy(() => import('./pages/SuccessPage.jsx'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage.jsx'));
const AdminPaymentPage = lazy(() => import('./pages/admin/AdminPaymentPage.jsx'));
const AdminTrafficPage = lazy(() => import('./pages/admin/AdminTrafficPage.jsx'));

function RequireAdmin({ children }) {
  const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [location.pathname, location.search]);

  return null;
}

function AppShell() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTopOnRouteChange />
      <Suspense fallback={<div className="route-loading">Đang tải...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/success/:orderCode" element={<SuccessPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="traffic" element={<AdminTrafficPage />} />
            <Route path="payment" element={<AdminPaymentPage />} />
          </Route>
        </Routes>
      </Suspense>
      {!isAdminPage && <VisitTracker />}
      {!isAdminPage && <ShopFooter />}
      <FloatingContact />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
