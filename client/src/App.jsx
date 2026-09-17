import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminPaymentPage from './pages/admin/AdminPaymentPage.jsx';
import AdminTrafficPage from './pages/admin/AdminTrafficPage.jsx';
import FloatingContact from './components/FloatingContact.jsx';
import ShopFooter from './components/ShopFooter.jsx';
import VisitTracker from './components/VisitTracker.jsx';

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
