import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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

function RequireAdmin({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="payment" element={<AdminPaymentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
