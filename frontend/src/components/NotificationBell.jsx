import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCircle2, AlertTriangle, ShieldAlert,
  Scale, Check, X
} from 'lucide-react';
import { notificationAPI } from '../services/api';

export default function NotificationBell({ activeUser }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!activeUser) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        notificationAPI.getNotifications(activeUser.id, activeUser.role),
        notificationAPI.getUnreadCount(activeUser.id, activeUser.role)
      ]);
      setNotifications(notifsRes.data || []);
      setUnreadCount(countRes.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s live polling
    return () => clearInterval(interval);
  }, [activeUser?.id, activeUser?.role]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!activeUser) return;
    try {
      await notificationAPI.markAllAsRead(activeUser.id, activeUser.role);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveNotification = async (notif, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.removeNotification(notif.id, activeUser?.id, activeUser?.role);
      setNotifications(prev => prev.filter(item => item.id !== notif.id));
      if (!notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to remove notification:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'ACTION_REQUIRED':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'REJECTION':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'SUCCESS':
      case 'DISBURSEMENT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'APPEAL':
        return <Scale className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-[#00142f] hover:bg-slate-100 rounded-xl transition flex items-center justify-center"
        title="Notifications & Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3 bg-[#00142f] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-sm tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center"
              >
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No notifications in this view</p>
                <p className="text-[11px]">All platform updates and action alerts will appear here</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 hover:bg-[#f8f9ff] transition cursor-pointer flex items-start space-x-3 text-xs ${
                    !notif.read ? 'bg-amber-50/20 font-medium' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 mt-0.5 shrink-0 border border-slate-200/60">
                    {getIconForType(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-[#00142f] text-xs leading-tight truncate">{notif.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-red-500" title="Unread"></span>}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveNotification(notif, e)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Remove notification"
                          aria-label={`Remove notification: ${notif.title}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
