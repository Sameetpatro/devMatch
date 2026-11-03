import { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, MessageCircle, X, ExternalLink, Briefcase, Info, UserCheck, UserX } from 'lucide-react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export default function NotificationCenter({ onOpenChat }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const list = res.data.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.warn('Could not fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 1. Polling fallback every 15s
    const interval = setInterval(fetchNotifications, 15000);

    // 2. Real-time WebSocket listener
    const socket = getSocket();
    if (socket) {
      const onNewNotification = (notif) => {
        console.log('[devMatch WS] Received live notification:', notif);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        // Display immediate toast popup
        toast(
          (t) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs text-pink-600">{notif.title}</span>
              <span className="text-xs text-gray-700">{notif.body}</span>
            </div>
          ),
          {
            id: `notif-${notif.id || Date.now()}`,
            icon: '🔔',
            duration: 6000,
          }
        );
      };

      const onNewMatch = (data) => {
        console.log('[devMatch WS] Received live match:', data);
        toast.success("It's a Connection! You can now chat.");
        fetchNotifications();
      };

      socket.on('new_notification', onNewNotification);
      socket.on('new_match', onNewMatch);

      return () => {
        clearInterval(interval);
        socket.off('new_notification', onNewNotification);
        socket.off('new_match', onNewMatch);
      };
    }

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Error marking notification read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Error marking all read', err);
    }
  };

  const handleAcceptRequest = async (notif) => {
    const fromId = notif.data?.fromUserId;
    if (!fromId) return;

    try {
      const res = await api.post('/swipes', {
        toUserId: fromId,
        direction: 'LIKE',
      });
      toast.success("It's a Connection! You can now chat.");
      await markAsRead(notif.id);
      fetchNotifications();
      if (res.data.match?.id && onOpenChat) {
        setIsOpen(false);
        onOpenChat(res.data.match.id, notif.data?.senderName);
      }
    } catch (err) {
      toast.error('Could not accept collaboration request');
    }
  };

  const handleDeclineRequest = async (notif) => {
    const fromId = notif.data?.fromUserId;
    if (!fromId) return;

    try {
      await api.post('/swipes', {
        toUserId: fromId,
        direction: 'PASS',
      });
      toast('Request declined', { icon: 'ℹ️' });
      await markAsRead(notif.id);
      fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl border border-pink-200/70 bg-white text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-colors shadow-soft"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-extrabold text-white animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2.5 w-96 max-w-[92vw] z-50 rounded-2xl bg-white shadow-2xl border border-pink-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-pink-100/80 bg-gradient-to-r from-pink-50/70 via-rose-50/50 to-amber-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-pink-500" />
                <h3 className="font-bold text-gray-900 text-sm">Notifications & Requests</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-pink-600 hover:text-pink-700 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-pink-50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-30 text-pink-400" />
                  <p className="text-xs font-medium">No new notifications.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isMatch = notif.type === 'MATCH';
                  const isRequest = notif.type === 'REQUEST';
                  const isAppUpdate = notif.type === 'APPLICATION_STATUS';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={`p-4 transition-all hover:bg-pink-50/30 ${
                        notif.isRead ? 'bg-white opacity-85' : 'bg-pink-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                            isMatch
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : isRequest
                              ? 'bg-pink-50 text-pink-600 border border-pink-200'
                              : isAppUpdate
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}
                        >
                          {isMatch ? (
                            <MessageCircle size={16} />
                          ) : isRequest ? (
                            <UserCheck size={16} />
                          ) : isAppUpdate ? (
                            <Briefcase size={16} />
                          ) : (
                            <Sparkles size={16} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatTime(notif.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed">
                            {notif.body}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-2.5">
                            {isMatch && notif.data?.matchId && onOpenChat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsOpen(false);
                                  onOpenChat(notif.data.matchId, notif.data?.partnerName);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold shadow-xs transition-colors"
                              >
                                <MessageCircle size={12} />
                                Start Live Chat
                              </button>
                            )}

                            {isRequest && notif.data?.fromUserId && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptRequest(notif);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold shadow-xs transition-colors"
                                >
                                  <Check size={13} />
                                  Accept & Connect
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeclineRequest(notif);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 text-[11px] font-semibold transition-colors"
                                >
                                  <X size={12} />
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
