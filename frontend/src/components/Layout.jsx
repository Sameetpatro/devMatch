import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Users, LogOut, User2, Search } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import Logo from './Logo.jsx';

const navItems = [
  { to: '/dashboard', label: 'Profile', icon: User2 },
  { to: '/swipe', label: 'Find devs', icon: Search },
  { to: '/connections', label: 'Connections', icon: Users },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
          isActive
            ? 'bg-brand-50 text-brand-600'
            : 'text-gray-600 hover:bg-pink-50 hover:text-brand-600'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-pink-100 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/dashboard">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 border border-brand-100">
                <div className="h-7 w-7 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center text-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-700">{user.name}</span>
              </div>
            )}
            <button onClick={handleLogout} className="btn-ghost" title="Logout">
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-pink-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-around gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        DevMatch &copy; {new Date().getFullYear()} — Find your dev collaborator.
      </footer>
    </div>
  );
}
