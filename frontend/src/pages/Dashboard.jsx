import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Flame, Sparkles, Star, Briefcase } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import Spinner from '../components/Spinner.jsx';

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

export default function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    api
      .get('/matches')
      .then((r) => setMatches(r.data))
      .catch(() => setMatches({ data: [], total: 0 }));
  }, []);

  const skillsList = (user?.skills ?? []).map((s) =>
    typeof s === 'string' ? s : s.skill?.name
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-brand-gradient relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
        </div>
        <div className="px-6 sm:px-8 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            <div className="h-24 w-24 rounded-2xl bg-white shadow-card flex items-center justify-center text-4xl font-extrabold text-brand-500 border-4 border-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
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

            <div className="flex gap-2">
              <Link to="/swipe" className="btn-primary">
                <Flame size={16} />
                Start swiping
              </Link>
            </div>
          </div>

          {user?.bio && (
            <p className="mt-5 text-gray-700 leading-relaxed">{user.bio}</p>
          )}

          {skillsList.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {skillsList.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Heart}
          label="Total matches"
          value={matches ? matches.total : <Spinner size={18} />}
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

      {/* Recent matches teaser */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent matches</h2>
          <Link to="/matches" className="text-sm font-semibold text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {!matches ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : matches.total === 0 ? (
          <div className="py-10 text-center">
            <Heart className="mx-auto text-brand-300" size={36} />
            <p className="mt-2 text-gray-500">No matches yet — go swipe!</p>
            <Link to="/swipe" className="btn-primary mt-4 inline-flex">
              <Flame size={16} />
              Start swiping
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.data.slice(0, 4).map((m) => (
              <div
                key={m.matchId}
                className="flex items-center gap-3 p-3 rounded-xl border border-pink-100 hover:bg-pink-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-gradient text-white font-bold flex items-center justify-center">
                  {m.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{m.user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{m.user.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
