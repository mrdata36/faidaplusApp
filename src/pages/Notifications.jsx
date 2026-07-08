import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, CheckCircle2, X, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

const getSeverityStyles = (type) => {
  switch (type) {
    case 'danger':
      return {
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50 dark:bg-red-900/20',
        ring: 'ring-red-500/20',
        text: 'text-red-800 dark:text-red-200',
        badge: 'bg-red-500'
      };
    case 'warning':
      return {
        border: 'border-yellow-200 dark:border-yellow-800',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        ring: 'ring-yellow-500/20',
        text: 'text-yellow-800 dark:text-yellow-200',
        badge: 'bg-yellow-500'
      };
    case 'success':
      return {
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50 dark:bg-green-900/20',
        ring: 'ring-green-500/20',
        text: 'text-green-800 dark:text-green-200',
        badge: 'bg-green-500'
      };
    case 'info':
    default:
      return {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        ring: 'ring-blue-500/20',
        text: 'text-blue-800 dark:text-blue-200',
        badge: 'bg-blue-500'
      };
  }
};

const Notifications = () => {
  const { notifications, syncKey, fetchUnreadCount } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const { t } = useLanguage();

  useEffect(() => {
    fetchUnreadCount();
  }, [syncKey, fetchUnreadCount]);

  const markAsRead = async (id) => {
    setLoading(true);
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      await fetchUnreadCount();
    } catch (err) {
      setError(t('unable_to_update') || 'Unable to update notification');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = (id) => {
    setConfirmConfig({
      title: t('confirm_delete_title') || 'Confirm Deletion',
      message: t('confirm_delete_msg') || 'Are you absolutely sure you want to delete this item? This action is irreversible.',
      onConfirm: async () => {
        setConfirmOpen(false);
        setLoading(true);
        try {
          await axios.delete(`/api/notifications/${id}`);
          await fetchUnreadCount();
        } catch (err) {
          setError(t('unable_to_delete') || 'Unable to delete notification');
        } finally {
          setLoading(false);
        }
      }
    });
    setConfirmOpen(true);
  };

  const clearNotifications = () => {
    setConfirmConfig({
      title: t('confirm_clear_all_title') || 'Clear All Notifications',
      message: t('confirm_clear_all_msg') || 'Are you sure you want to clear all your notifications? This cannot be undone.',
      onConfirm: async () => {
        setConfirmOpen(false);
        setLoading(true);
        try {
          await axios.put('/api/notifications/read-all');
          await fetchUnreadCount();
        } catch (err) {
          setError(t('unable_to_clear') || 'Unable to clear notifications');
        } finally {
          setLoading(false);
        }
      }
    });
    setConfirmOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-picton rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
                {t('notification_center')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('notification_desc')}
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow text-sm font-semibold w-full md:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              {t('clear_all')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bluecola"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 card p-8 bg-[var(--surface)] border border-[var(--border)]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('no_notifications')}
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const styles = getSeverityStyles(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-6 border ${styles.border} rounded-xl ${styles.bg} shadow-sm hover:shadow-md transition-shadow ${
                    !notification.is_read ? `ring-2 ${styles.ring} border-opacity-50` : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${styles.badge} text-white`}>
                          {t(notification.type) || notification.type}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2.5 h-2.5 bg-brand-picton rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t(notification.title) || notification.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${styles.text}`}>
                        {t(notification.message) || notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto md:flex-col lg:flex-row justify-end shrink-0 pt-2 md:pt-0">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center justify-center gap-2 bg-brand-bluecola text-white px-4 py-2.5 rounded-lg hover:bg-brand-trueblue transition-colors text-xs sm:text-sm font-semibold cursor-pointer shadow-sm flex-1 md:flex-none"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('mark_read') || 'Mark Read'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-semibold cursor-pointer shadow-sm flex-1 md:flex-none"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t('delete') || 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
};

export default Notifications;
