import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, Sparkles, Star, Briefcase, Phone, Mail, Send,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import Spinner from '../components/Spinner.jsx';
import { GithubIcon, LinkedinIcon } from '../components/icons.jsx';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function ContactPill({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2 border border-pink-100 text-sm">
      <Icon size={14} className="text-brand-500 shrink-0" />
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-semibold text-gray-900 truncate">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [connections, setConnections] = useState(null);

  useEffect(() => {
    api
      .get('/matches')
      .then((r) => setConnections(r.data))
      .catch(() => setConnections({ data: [], total: 0 }));
  }, []);

  const skillsList = (user?.skills ?? []).map((s) =>
    typeof s === 'string' ? s : s.skill?.name
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="h-24 sm:h-28 bg-brand-gradient relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
        </div>

        <div className="px-6 sm:px-8 pb-6">
          {/* Avatar overlaps banner; "Find devs" button sits on the right */}
          <div className="flex items-end justify-between gap-3 -mt-10 mb-4">
            <div className="h-20 w-20 rounded-2xl bg-brand-gradient text-white shadow-card flex items-center justify-center text-3xl font-extrabold border-4 border-white shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <Link to="/swipe" className="btn-primary mb-1">
              <Search size={16} />
              <span className="hidden sm:inline">Find devs</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {user?.name}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <Briefcase size={14} />
              {user?.role}
              <span className="mx-2 text-gray-300">•</span>
              {user?.experienceYears} yr{user?.experienceYears === 1 ? '' : 's'} exp
            </p>
          </div>

          {user?.bio && <p className="mt-4 text-gray-700 leading-relaxed">{user.bio}</p>}

          {skillsList.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {skillsList.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Your contact (only visible to you and your connections) */}
      {user && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">Your contact</h2>
            <span className="chip">Visible to your connections only</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            These details are unlocked once another developer also asks to collaborate with you.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ContactPill icon={Phone} label="Phone" value={user.phone} />
            <ContactPill icon={Mail} label="Email" value={user.email} />
            <ContactPill icon={LinkedinIcon} label="LinkedIn" value={user.linkedin} />
            <ContactPill icon={GithubIcon} label="GitHub" value={user.github} />
            <ContactPill icon={Send} label="Telegram" value={user.telegram} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Connections"
          value={connections ? connections.total : <Spinner size={18} />}
          accent="bg-brand-gradient"
        />
        <StatCard
          icon={Star}
          label="Your rating"
          value={Number(user?.rating ?? 0).toFixed(1)}
          accent="bg-rose-400"
        />
        <StatCard
          icon={Sparkles}
          label="Skills"
          value={skillsList.length}
          accent="bg-pink-400"
        />
      </div>

      {/* Recent connections */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent connections</h2>
          <Link to="/connections" className="text-sm font-semibold text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {!connections ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : connections.total === 0 ? (
          <div className="py-10 text-center">
            <Users className="mx-auto text-brand-300" size={36} />
            <p className="mt-2 text-gray-500">No connections yet — start searching!</p>
            <Link to="/swipe" className="btn-primary mt-4 inline-flex">
              <Search size={16} />
              Find devs
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {connections.data.slice(0, 4).map((c) => (
              <div
                key={c.matchId}
                className="flex items-center gap-3 p-3 rounded-xl border border-pink-100 hover:bg-pink-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-gradient text-white font-bold flex items-center justify-center">
                  {c.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{c.user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{c.user.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
