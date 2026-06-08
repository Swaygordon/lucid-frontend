import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        showNotification('New notification received!', 'info');
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/lucid/signin');
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showNotification('Notification deleted', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (title) => {
    if (title?.includes('Approved')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (title?.includes('Rejected')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (title?.includes('Revision')) {
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
    return <Bell className="w-5 h-5 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-[#1e293b] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Notifications</h1>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {notifications.filter(n => !n.is_read).length} new
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-[#1a1f2e] rounded-lg shadow-sm border-l-4 ${
                  !notification.is_read 
                    ? 'border-blue-500' 
                    : 'border-gray-200 dark:border-[#1e293b]'
                } hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.title)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* Action buttons for verification notifications */}
                  {notification.type === 'verification' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1e293b] flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/lucid/account/profile');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View Profile
                      </button>
                      {notification.title?.includes('Revision') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/lucid/account/profile/edit');
                          }}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;