import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Briefcase, Mail, Flame } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner.jsx';

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

export default function Matches() {
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    api
      .get('/matches')
      .then((r) => setMatches(r.data))
      .catch(() => setMatches({ data: [], total: 0 }));
  }, []);

  if (!matches) {
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
            Your matches
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {matches.total} {matches.total === 1 ? 'match' : 'matches'} so far
          </p>
        </div>
        <Link to="/swipe" className="btn-primary">
          <Flame size={16} />
          Keep swiping
        </Link>
      </div>

      {matches.total === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Heart size={28} className="text-brand-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No matches yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Swipe right on developers you'd like to collaborate with.
          </p>
          <Link to="/swipe" className="btn-primary mt-5 inline-flex">
            <Flame size={16} />
            Start swiping
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.data.map((m) => (
            <div key={m.matchId} className="card overflow-hidden">
              <div className="h-20 bg-brand-gradient relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
              </div>
              <div className="px-5 pb-5 -mt-8">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-card flex items-center justify-center text-2xl font-extrabold text-brand-500 border-4 border-white">
                  {m.user.name?.[0]?.toUpperCase()}
                </div>
                <h3 className="mt-3 font-bold text-gray-900 text-lg">{m.user.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Briefcase size={13} />
                  {m.user.role}
                </p>

                <a
                  href={`mailto:${m.user.email}`}
                  className="mt-2 text-sm text-brand-600 hover:underline flex items-center gap-1.5 truncate"
                >
                  <Mail size={13} />
                  {m.user.email}
                </a>

                {m.user.bio && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{m.user.bio}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(m.user.skills ?? []).slice(0, 6).map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-pink-100 text-xs text-gray-400">
                  Matched on {formatDate(m.matchedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
