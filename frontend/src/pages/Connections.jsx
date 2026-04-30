import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, Mail, Phone, Send, Search, Star,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner.jsx';
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
      <Icon size={14} className="text-brand-500 shrink-0" />
      <span className="text-gray-600 shrink-0">{label}</span>
      <span className="font-semibold text-gray-900 truncate">{value}</span>
    </span>
  );
  return href ? (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="block py-1.5 hover:text-brand-600 transition-colors"
    >
      {content}
    </a>
  ) : (
    <div className="py-1.5">{content}</div>
  );
}

export default function Connections() {
  const [connections, setConnections] = useState(null);

  useEffect(() => {
    api
      .get('/matches')
      .then((r) => setConnections(r.data))
      .catch(() => setConnections({ data: [], total: 0 }));
  }, []);

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
            Your connections
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {connections.total} {connections.total === 1 ? 'developer' : 'developers'} ready to
            collaborate
          </p>
        </div>
        <Link to="/swipe" className="btn-primary">
          <Search size={16} />
          Find more
        </Link>
      </div>

      {connections.total === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Users size={28} className="text-brand-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No connections yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Search for developers and ask them to collaborate. When they ask back, you're
            connected.
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
              <div key={c.matchId} className="card overflow-hidden">
                <div className="h-24 bg-brand-gradient relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
                </div>
                <div className="px-6 pb-6 -mt-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-20 w-20 rounded-2xl bg-white shadow-card flex items-center justify-center text-3xl font-extrabold text-brand-500 border-4 border-white">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-pink-50 px-2 py-1 border border-pink-100 mt-3">
                      <Star size={14} className="text-brand-500 fill-brand-500" />
                      <span className="text-sm font-semibold text-brand-600">
                        {Number(u.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-xl font-bold text-gray-900">{u.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Briefcase size={13} />
                      {u.role}
                      <span className="mx-1.5 text-gray-300">•</span>
                      {u.experienceYears} yr{u.experienceYears === 1 ? '' : 's'} exp
                    </p>
                  </div>

                  {u.bio && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">{u.bio}</p>
                  )}

                  {u.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {u.skills.slice(0, 8).map((s) => (
                        <span key={s} className="chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* --- Contact reveal: visible only because they're connected --- */}
                  <div className="mt-5 pt-4 border-t border-pink-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                      Contact
                    </div>
                    <ContactRow
                      icon={Phone}
                      label="Phone"
                      value={u.phone}
                      href={`tel:${u.phone}`}
                    />
                    <ContactRow
                      icon={Mail}
                      label="Email"
                      value={u.email}
                      href={`mailto:${u.email}`}
                    />
                    <ContactRow
                      icon={LinkedinIcon}
                      label="LinkedIn"
                      value={u.linkedin}
                      href={u.linkedin}
                    />
                    <ContactRow
                      icon={GithubIcon}
                      label="GitHub"
                      value={u.github}
                      href={u.github}
                    />
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

                  <div className="mt-4 pt-3 border-t border-pink-100 text-xs text-gray-400">
                    Connected on {formatDate(c.matchedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
