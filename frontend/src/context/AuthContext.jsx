import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we had an endpoint to fetch user profile using the token, we would do it here.
    // For now we will rely on what is returned during login/register.
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('https://hospital-management-backend-1e7k.onrender.com/api/auth/login', { email, password });
      const { token, ...userData } = res.data;
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role, phone) => {
    setLoading(true);
    try {
      await axios.post('https://hospital-management-backend-1e7k.onrender.com/api/auth/register', { name, email, password, role, phone });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
