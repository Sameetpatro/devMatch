import { useState, useEffect, useRef } from 'react';
import { X, Send, User2, Circle } from 'lucide-react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/auth.jsx';
import Spinner from './Spinner.jsx';

export default function ChatModal({ match, matchId: propMatchId, partnerName, currentUser: propUser, onClose }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser || {};

  const matchId = match?.matchId || match?.id || propMatchId;
  const partner = match?.user || {
    id: match?.userId || null,
    name: partnerName || match?.partnerName || 'Connected Match',
    isOnline: match?.user?.isOnline ?? true,
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(partner?.isOnline || false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 1. Fetch Chat History via REST
    api
      .get(`/matches/${matchId}/messages`)
      .then((res) => {
        setMessages(res.data.data || []);
      })
      .catch((err) => console.warn('Could not fetch message history:', err))
      .finally(() => setLoading(false));

    // 2. Initialize WebSocket Connection
    const socket = getSocket();
    if (socket) {
      socket.emit('join_match', { matchId });

      const onReceiveMessage = (msg) => {
        if (msg.matchId === matchId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      };

      const onUserTyping = (data) => {
        if (data.matchId === matchId && data.userId !== currentUser.id) {
          setIsTyping(true);
        }
      };

      const onUserStopTyping = (data) => {
        if (data.matchId === matchId && data.userId !== currentUser.id) {
          setIsTyping(false);
        }
      };

      const onPresenceChange = (data) => {
        if (data.userId === partner.id) {
          setPartnerOnline(data.isOnline);
        }
      };

      socket.on('receive_message', onReceiveMessage);
      socket.on('user_typing', onUserTyping);
      socket.on('user_stop_typing', onUserStopTyping);
      socket.on('presence_change', onPresenceChange);

      return () => {
        socket.emit('leave_match', { matchId });
        socket.off('receive_message', onReceiveMessage);
        socket.off('user_typing', onUserTyping);
        socket.off('user_stop_typing', onUserStopTyping);
        socket.off('presence_change', onPresenceChange);
      };
    }
  }, [matchId, partner.id, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing_start', { matchId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { matchId });
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput('');

    const socket = getSocket();
    if (socket) {
      socket.emit('typing_stop', { matchId });
      socket.emit('send_message', { matchId, content }, (res) => {
        if (res?.status === 'ok') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === res.data.id)) return prev;
            return [...prev, res.data];
          });
        }
      });
    } else {
      // Fallback to REST API
      try {
        const { data } = await api.post(`/matches/${matchId}/messages`, { content });
        setMessages((prev) => [...prev, data.data]);
      } catch (err) {
        console.error('Failed to send message via REST fallback:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl h-[600px] flex flex-col bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100/80 bg-gradient-to-r from-pink-50/50 via-white to-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center text-lg shadow-sm">
                {partner.name?.[0]?.toUpperCase() || <User2 size={20} />}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
                title={partnerOnline ? 'Online now' : 'Offline'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 leading-none">{partner.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  {partner.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <span className={partnerOnline ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                  {partnerOnline ? 'Active in Real-time' : 'Offline (Notified via Email/Queue)'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <div className="w-14 h-14 rounded-2xl bg-pink-100/60 text-pink-500 flex items-center justify-center mb-3">
                <Send size={24} />
              </div>
              <h4 className="font-bold text-gray-800 text-base">You matched with {partner.name}!</h4>
              <p className="text-sm max-w-sm mt-1">
                Say hello, discuss project collaboration, or schedule an interview.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === currentUser.id;
              const formattedTime = new Date(m.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                      isMine
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none'
                        : 'bg-white border border-pink-100/80 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isMine ? 'text-pink-100' : 'text-gray-400'
                      }`}
                    >
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-pink-600 italic">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>{partner.name} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-pink-100 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={`Message ${partner.name}...`}
            className="flex-1 bg-gray-50 border border-pink-200/60 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

