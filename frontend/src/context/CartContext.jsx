import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [], subtotal: 0 }); return; }
    try {
      setCartLoading(true);
      const res = await cartAPI.getCart();
      setCart(res.data);
    } catch {
      setCart({ items: [], subtotal: 0 });
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await cartAPI.addItem(productId, quantity);
    setCart(res.data);
    return res.data;
  };

  const updateQuantity = async (productId, quantity) => {
    const res = await cartAPI.updateItem(productId, quantity);
    setCart(res.data);
  };

  const removeFromCart = async (productId) => {
    const res = await cartAPI.removeItem(productId);
    setCart(res.data);
  };

  const clearCart = async () => {
    const res = await cartAPI.clearCart();
    setCart(res.data);
  };

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, cartLoading, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
