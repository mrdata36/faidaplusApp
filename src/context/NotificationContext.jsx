import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [syncKey, setSyncKey] = useState(0);
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/notifications');
      const list = res.data.notifications || [];
      setNotifications(list);
      const count = list.filter(n => !n.is_read && n.is_read !== 1).length;
      setUnreadCount(count);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Error fetching notifications:', err);
      } else {
        console.warn('Unauthorized notifications fetch');
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, syncKey, fetchUnreadCount]);

  const notifyNewNotification = useCallback(() => {
    setSyncKey(prev => prev + 1);
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setSyncKey(prev => prev + 1);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setSyncKey(prev => prev + 1);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setSyncKey(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications/clear-all');
      setSyncKey(prev => prev + 1);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      syncKey,
      fetchUnreadCount,
      notifyNewNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
