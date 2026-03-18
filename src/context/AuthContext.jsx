import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { initializeNotifications } from '../utils/notifications';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Load user on app load and token change
  useEffect(() => {
    const loadUser = async () => {
      const API = import.meta.env.VITE_API_URL;
      
      if (!API) {
        console.error("API URL not defined");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Set axios default header immediately for subsequent calls
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const res = await axios.get(`${API}/auth/me`);
        if (res.data && res.data.success && res.data.user) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (error) {
        console.error('Failed to load user:', error.message);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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
    const API = import.meta.env.VITE_API_URL;
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
      
      // Initialize notifications after successful login
      initializeNotifications();
      
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const register = async (name, email, password, location) => {
    const API = import.meta.env.VITE_API_URL;
    try {
      const res = await axios.post(`${API}/auth/register`, {
        name,
        email,
        password,
        location
      });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
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
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};