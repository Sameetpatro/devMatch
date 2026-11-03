import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Users, LogOut, User2, Search, Briefcase, Sparkles, FileText } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { getSocket } from '../lib/socket';
import Logo from './Logo.jsx';
import NotificationCenter from './NotificationCenter.jsx';
import ChatModal from './ChatModal.jsx';

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
          isActive
            ? 'bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 text-pink-600 border border-pink-200/70 shadow-soft'
            : 'text-gray-600 hover:bg-pink-50/60 hover:text-pink-600'
        }`
      }
    >
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [directChatMatchId, setDirectChatMatchId] = useState(null);
  const [directChatPartnerName, setDirectChatPartnerName] = useState(null);

  // Initialize and keep live WebSocket connection active while user is authenticated
  useEffect(() => {
    if (user) {
      getSocket();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isRecruiter = user?.userType === 'RECRUITER';

  const navItems = isRecruiter
    ? [
        { to: '/recruiter', label: 'Manage Roles', icon: Briefcase },
        { to: '/swipe', label: 'Find Devs', icon: Search },
        { to: '/connections', label: 'Connections & Chat', icon: Users },
        { to: '/dashboard', label: 'Profile', icon: User2 },
      ]
    : [
        { to: '/roles', label: 'Jobs Feed', icon: Sparkles },
        { to: '/applications', label: 'My Applications', icon: FileText },
        { to: '/swipe', label: 'Find Devs', icon: Search },
        { to: '/connections', label: 'Connections & Chat', icon: Users },
        { to: '/dashboard', label: 'Profile', icon: User2 },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-pink-100/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to={isRecruiter ? '/recruiter' : '/roles'}>
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Notification Center */}
            <NotificationCenter
              onOpenChat={(mId, pName) => {
                setDirectChatMatchId(mId);
                setDirectChatPartnerName(pName || 'Connected Match');
              }}
            />

            {user && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-50 to-amber-50 px-3 py-1.5 border border-pink-200/60 shadow-soft">
                <div className="h-7 w-7 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</span>
                  <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">
                    {isRecruiter ? 'Recruiter' : 'Developer'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-pink-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-colors shadow-soft"
              title="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-pink-100 bg-white/95 backdrop-blur-md px-1 py-2 flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Direct Chat Modal triggered from notification */}
      {directChatMatchId && (
        <ChatModal
          matchId={directChatMatchId}
          partnerName={directChatPartnerName || "Connected Match"}
          isOpen={true}
          onClose={() => {
            setDirectChatMatchId(null);
            setDirectChatPartnerName(null);
          }}
        />
      )}
    </div>
  );
}
