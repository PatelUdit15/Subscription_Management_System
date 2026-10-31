import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminHome from './pages/AdminHome'
import CustomerLayout from './components/CustomerLayout'
import CustomerHome from './pages/CustomerHome'
import ShopProducts from './pages/ShopProducts'
import CustomerProductDetail from './pages/CustomerProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerPortalPage from './pages/CustomerPortalPage'
import MyProfile from './pages/MyProfile'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import CustomerInvoices from './pages/CustomerInvoices'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/share/quotation/:id" element={<CustomerPortalPage />} />

      {/* Admin Routes - Only accessible by admin/internal users */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminHome />
          </ProtectedRoute>
        }
      />

      {/* Customer/Shop Routes - All wrapped in CustomerLayout for consistent UI */}
      <Route path="/shop" element={<CustomerLayout />}>
        <Route index element={
          <ProtectedRoute requiredRole="portal">
            <CustomerHome />
          </ProtectedRoute>
        } />
        <Route path="my-profile" element={
          <ProtectedRoute requiredRole="portal">
            <MyProfile />
          </ProtectedRoute>
        } />
        <Route path="my-orders" element={
          <ProtectedRoute requiredRole="portal">
            <MyOrders />
          </ProtectedRoute>
        } />
        <Route path="order/:orderId" element={
          <ProtectedRoute requiredRole="portal">
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="products" element={
          <ProtectedRoute requiredRole="portal">
            <ShopProducts />
          </ProtectedRoute>
        } />
        <Route path="product/:id" element={
          <ProtectedRoute requiredRole="portal">
            <CustomerProductDetail />
          </ProtectedRoute>
        } />
        <Route path="cart" element={
          <ProtectedRoute requiredRole="portal">
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="checkout" element={
          <ProtectedRoute requiredRole="portal">
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="order-success/:orderId" element={
          <ProtectedRoute requiredRole="portal">
            <OrderSuccess />
          </ProtectedRoute>
        } />
        <Route path="dashboard" element={
          <ProtectedRoute requiredRole="portal">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute requiredRole="portal">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="subscriptions" element={
          <ProtectedRoute requiredRole="portal">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute requiredRole="portal">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="invoices" element={
          <ProtectedRoute requiredRole="portal">
            <CustomerInvoices />
          </ProtectedRoute>
        } />
      </Route>

      {/* Default Route - Redirect based on role or to login */}
      <Route
        path="/"
        element={
          currentUser ? (
            currentUser.role === 'admin' || currentUser.role === 'internal' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/shop" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
