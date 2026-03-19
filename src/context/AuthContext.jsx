import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { initializeNotifications } from '../utils/notifications';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Debug Log
  console.log("API HUB:", import.meta.env.VITE_API_URL);
  console.log("PERSISTED TOKEN:", token ? "Exists" : "Null");

  // Load user on app load and token change
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('auth/me');
        if (res.data && res.data.success && res.data.user) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid user');
        }
      } catch (error) {
        console.error('VERIFICATION ERROR:', error.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
      initializeNotifications();
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const register = async (name, email, password, location) => {
    try {
      const res = await api.post('auth/register', { name, email, password, location });
      const { token: newToken, user: newUser } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      toast.success('Registered successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out');
  };

  const value = { user, loading, login, register, logout, isAuthenticated };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};