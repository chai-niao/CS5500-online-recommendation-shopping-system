import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import FestivalSpecialsPage from './pages/FestivalSpecialsPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import MyListsPage from './pages/MyListsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="search" element={<SearchResultsPage />} />
              <Route path="festival-specials" element={<FestivalSpecialsPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="recommendations" element={<AIRecommendationsPage />} />
                <Route path="my-lists" element={<MyListsPage />} />
                <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
