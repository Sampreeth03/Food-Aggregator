import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);

  // Restore cart from localStorage on load
  useEffect(() => {
    const storedCart = localStorage.getItem('cartItems');
    const storedRest = localStorage.getItem('cartRestaurant');

    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    if (storedRest) {
      setCartRestaurant(JSON.parse(storedRest));
    }
  }, []);

  const saveCart = (items, restaurant) => {
    setCartItems(items);
    setCartRestaurant(restaurant);
    localStorage.setItem('cartItems', JSON.stringify(items));
    if (restaurant) {
      localStorage.setItem('cartRestaurant', JSON.stringify(restaurant));
    } else {
      localStorage.removeItem('cartRestaurant');
    }
  };

  const addToCart = (restaurant, item) => {
    // If the cart is not empty and the restaurant ID is different
    if (cartRestaurant && cartRestaurant._id !== restaurant._id) {
      return { error: 'You can only order from one restaurant at a time.' };
    }

    const existingIndex = cartItems.findIndex((cartItem) => cartItem.menuItemId === item._id);
    let updatedItems = [...cartItems];

    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({
        menuItemId: item._id,
        name: item.name,
        quantity: 1,
        price: item.price
      });
    }

    saveCart(updatedItems, restaurant);
    return { success: true };
  };

  const removeFromCart = (menuItemId) => {
    const updatedItems = cartItems.filter((item) => item.menuItemId !== menuItemId);
    const newRestaurant = updatedItems.length === 0 ? null : cartRestaurant;
    saveCart(updatedItems, newRestaurant);
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    const updatedItems = cartItems.map((item) => {
      if (item.menuItemId === menuItemId) {
        return { ...item, quantity };
      }
      return item;
    });

    saveCart(updatedItems, cartRestaurant);
  };

  const clearCart = () => {
    saveCart([], null);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartRestaurant,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
