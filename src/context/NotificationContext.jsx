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
      console.error('Error fetching notifications:', err);
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

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      syncKey,
      fetchUnreadCount,
      notifyNewNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
