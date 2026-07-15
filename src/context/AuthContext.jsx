import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user || res.data);
    } catch (err) {
      if (err.response?.status !== 401 && err.response?.status !== 404) {
        console.error('Error fetching user:', err);
      } else {
        console.warn('Session expired or user not found');
      }
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user || null);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server. Please check the backend or network connection.' };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed';
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      if (res.data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user || null);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server. Please check the backend or network connection.' };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          config.headers['Authorization'] = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
