import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, Mail, Phone, Send, Search, Star, MessageCircle, Check, X, Clock, CheckCircle2, UserCheck
} from 'lucide-react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/auth.jsx';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner.jsx';
import ChatModal from '../components/ChatModal.jsx';
import { GithubIcon, LinkedinIcon } from '../components/icons.jsx';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function ContactRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  const content = (
    <span className="flex items-center gap-2 text-sm">
      <Icon size={14} className="text-pink-500 shrink-0" />
      <span className="text-gray-600 shrink-0">{label}:</span>
      <span className="font-semibold text-gray-900 truncate">{value}</span>
    </span>
  );
  return href ? (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="block py-1.5 hover:text-pink-600 transition-colors"
    >
      {content}
    </a>
  ) : (
    <div className="py-1.5">{content}</div>
  );
}

export default function Connections() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('connections'); // 'connections' | 'invitations'
  const [connections, setConnections] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const fetchConnections = async () => {
    try {
      const res = await api.get('/matches');
      setConnections(res.data);
    } catch {
      setConnections({ data: [], total: 0 });
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/swipes/received');
      // Only show pending invitations (where no match has been established yet)
      const list = (res.data.data || []).filter((r) => r.status === 'PENDING');
      setInvitations(list);
    } catch {
      setInvitations([]);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchInvitations();

    const socket = getSocket();
    if (socket) {
      const handleLiveUpdate = () => {
        fetchConnections();
        fetchInvitations();
      };
      socket.on('new_notification', handleLiveUpdate);
      socket.on('new_match', handleLiveUpdate);

      return () => {
        socket.off('new_notification', handleLiveUpdate);
        socket.off('new_match', handleLiveUpdate);
      };
    }
  }, []);

  const handleAcceptInvite = async (fromUserId) => {
    try {
      const res = await api.post('/swipes', {
        toUserId: fromUserId,
        direction: 'LIKE',
      });
      toast.success("It's a Connection! You can now chat.");
      fetchConnections();
      fetchInvitations();

      if (res.data.match?.id) {
        setActiveChat({
          matchId: res.data.match.id,
          user: { name: 'New Connection', isOnline: true },
        });
      }
    } catch (err) {
      toast.error('Could not accept collaboration request');
    }
  };

  const handleDeclineInvite = async (fromUserId) => {
    try {
      await api.post('/swipes', {
        toUserId: fromUserId,
        direction: 'PASS',
      });
      toast('Request declined', { icon: 'ℹ️' });
      fetchInvitations();
    } catch {
      // ignore
    }
  };

  if (!connections) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Connections & Collaboration Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Chat with your mutual matches or accept incoming requests from recruiters and developers.
          </p>
        </div>
        <Link to="/swipe" className="btn-primary">
          <Search size={16} />
          Find More
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pink-100 gap-6">
        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'connections'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users size={16} />
          My Connections ({connections.total})
        </button>
        <button
          onClick={() => {
            setActiveTab('invitations');
            fetchInvitations();
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'invitations'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserCheck size={16} />
          Collaboration Requests Received ({invitations.length})
          {invitations.length > 0 && (
            <span className="h-5 w-5 rounded-full bg-pink-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
              {invitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Connections */}
      {activeTab === 'connections' && (
        <>
          {connections.total === 0 ? (
            <div className="card p-10 text-center border-amber-200">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-50 to-amber-50 flex items-center justify-center border border-pink-100 shadow-soft">
                <Users size={28} className="text-pink-500" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">No mutual connections yet</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                Explore the developer search feed or apply to open roles. Once both sides express interest, contact details unlock and you can chat live!
              </p>
              <Link to="/swipe" className="btn-primary mt-5 inline-flex">
                <Search size={16} />
                Find developers
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {connections.data.map((c) => {
                const u = c.user;
                return (
                  <div
                    key={c.matchId}
                    className="card overflow-hidden border-pink-100 hover:border-pink-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-24 bg-brand-gradient relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_60%)]" />
                      </div>
                      <div className="px-6 pb-4 -mt-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="relative">
                            <div className="h-20 w-20 rounded-2xl bg-white shadow-card flex items-center justify-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-amber-500 border-4 border-white">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span
                              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                                u.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                              title={u.isOnline ? 'Online now' : 'Offline'}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200 mt-3 shadow-sm">
                            <Star size={14} className="text-amber-500 fill-amber-400" />
                            <span className="text-sm font-bold text-amber-800">
                              {Number(u.rating ?? 0).toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">{u.name}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                u.isOnline
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {u.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Briefcase size={13} className="text-amber-600" />
                            {u.role || (u.userType === 'RECRUITER' ? 'Recruiter' : 'Developer')}
                            <span className="mx-1.5 text-gray-300">•</span>
                            {u.experienceYears} yr{u.experienceYears === 1 ? '' : 's'} exp
                          </p>
                        </div>

                        {u.bio && (
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{u.bio}</p>
                        )}

                        {u.skills?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {u.skills.slice(0, 6).map((s, idx) => (
                              <span key={s} className={idx % 2 === 0 ? 'chip' : 'chip-yellow'}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Contact reveal */}
                        <div className="mt-4 pt-3 border-t border-pink-100">
                          <div className="text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-amber-600 mb-2">
                            Unlocked Contact Info
                          </div>
                          <ContactRow icon={Phone} label="Phone" value={u.phone} href={`tel:${u.phone}`} />
                          <ContactRow icon={Mail} label="Email" value={u.email} href={`mailto:${u.email}`} />
                          <ContactRow icon={LinkedinIcon} label="LinkedIn" value={u.linkedin} href={u.linkedin} />
                          <ContactRow icon={GithubIcon} label="GitHub" value={u.github} href={u.github} />
                          <ContactRow
                            icon={Send}
                            label="Telegram"
                            value={u.telegram}
                            href={
                              u.telegram?.startsWith('@')
                                ? `https://t.me/${u.telegram.slice(1)}`
                                : u.telegram?.startsWith('http')
                                ? u.telegram
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Live Chat CTA */}
                    <div className="px-6 py-4 bg-pink-50/40 border-t border-pink-100/80 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Connected on {formatDate(c.matchedAt)}
                      </span>
                      <button
                        onClick={() => setActiveChat(c)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all"
                      >
                        <MessageCircle size={16} />
                        Live Chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Collaboration Invitations Received */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          {invitations.length === 0 ? (
            <div className="card p-10 text-center border-dashed border-pink-200">
              <UserCheck size={36} className="mx-auto text-pink-400 mb-2 opacity-50" />
              <h3 className="text-lg font-bold text-gray-800">No pending requests</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                When recruiters or developers send you collaboration requests, they will appear here so you can accept and chat!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {invitations.map((inv) => {
                const requester = inv.fromUser || {};
                const isRecruiter = requester.userType === 'RECRUITER';

                return (
                  <div
                    key={inv.id}
                    className="card p-6 border-pink-100 hover:border-pink-300 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-amber-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                            {requester.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900">{requester.name}</h4>
                            <p className="text-xs font-semibold text-pink-600">
                              {requester.companyName ? `🏢 ${requester.companyName}` : requester.role || 'Project Lead'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 uppercase tracking-wider">
                          {isRecruiter ? 'Recruiter' : 'Developer'}
                        </span>
                      </div>

                      {requester.bio && (
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                          "{requester.bio}"
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {(requester.skills || []).map((s) => (
                          <span key={s} className="chip text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        Received {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptInvite(requester.id)}
                          className="btn-primary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-soft"
                        >
                          <Check size={14} /> Accept & Connect
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(requester.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-semibold"
                        >
                          <X size={14} /> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Real-time WebSocket Chat Modal */}
      {activeChat && (
        <ChatModal
          match={activeChat}
          currentUser={currentUser}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
