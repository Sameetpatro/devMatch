import { useEffect, useRef, useState, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import toast from 'react-hot-toast';
import {
  Search, X, RefreshCw, Sparkles, Handshake, Filter, ArrowLeft,
} from 'lucide-react';
import api from '../lib/api';
import DevCard from '../components/DevCard.jsx';
import Spinner from '../components/Spinner.jsx';
import MatchPopup from '../components/MatchPopup.jsx';

const ROLE_QUICK_PICKS = [
  'Frontend',
  'Backend',
  'Fullstack',
  'Android',
  'iOS',
  'Machine Learning',
  'DevOps',
  'Data',
];

const POPULAR_SKILLS = [
  'React', 'Node', 'TypeScript', 'Python', 'Next.js', 'Postgres', 'Kotlin',
];

function SearchHero({ initial, onSearch }) {
  const [role, setRole] = useState(initial.role || '');
  const [skills, setSkills] = useState(initial.skills || '');

  const submit = (e) => {
    e?.preventDefault();
    if (!role.trim() && !skills.trim()) {
      toast.error('Pick a role or enter some skills');
      return;
    }
    onSearch({ role: role.trim(), skills: skills.trim(), search: '' });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-14 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
          Find your <span className="text-brand-500">collaborator</span>
        </h1>
        <p className="mt-2 text-gray-500">
          What kind of developer do you need? Search by role or skills to start.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 sm:p-7 space-y-5">
        <div>
          <label className="label">Role</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              className="input pl-10 text-base py-3"
              placeholder="Frontend, Backend, Android..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ROLE_QUICK_PICKS.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  role === r
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-600 border-pink-100 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Skills (optional, comma separated)</label>
          <input
            className="input"
            placeholder="React, TypeScript, Tailwind"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {POPULAR_SKILLS.map((s) => {
              const active = skills.split(',').map((x) => x.trim().toLowerCase()).includes(s.toLowerCase());
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    const list = skills.split(',').map((x) => x.trim()).filter(Boolean);
                    if (active) {
                      setSkills(list.filter((x) => x.toLowerCase() !== s.toLowerCase()).join(', '));
                    } else {
                      setSkills([...list, s].join(', '));
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-600 border-pink-100 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full text-base py-3">
          <Search size={18} />
          Search developers
        </button>
      </form>
    </div>
  );
}

function SearchSummary({ active, onChange }) {
  const chips = [];
  if (active.role) chips.push({ label: `Role: ${active.role}`, key: 'role' });
  if (active.skills) chips.push({ label: `Skills: ${active.skills}`, key: 'skills' });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={onChange} className="btn-outline text-xs">
        <ArrowLeft size={14} />
        New search
      </button>
      {chips.map((c) => (
        <span key={c.key} className="chip">
          <Filter size={11} className="mr-1" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function Swipe() {
  const [searchState, setSearchState] = useState(null); // null = hero; object = active search
  const [developers, setDevelopers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ open: false, user: null });

  const cardRefs = useRef({});

  const runSearch = useCallback(async (filters) => {
    setSearchState(filters);
    setLoading(true);
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.skills) params.skills = filters.skills;
      params.limit = 30;
      const { data } = await api.get('/developers', { params });
      setDevelopers([...data.data].reverse());
      setMeta(data.meta);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load developers');
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSwipe = useCallback(async (developer, dir) => {
    const direction = dir === 'right' ? 'LIKE' : 'PASS';
    try {
      const { data } = await api.post('/swipes', {
        toUserId: developer.id,
        direction,
      });

      if (data.match && data.isNewMatch) {
        setPopup({ open: true, user: developer });
      } else if (direction === 'LIKE') {
        toast(`Request sent to ${developer.name}`, { icon: '🤝' });
      }
    } catch (err) {
      toast.error(err.displayMessage || 'Action failed');
    } finally {
      setDevelopers((prev) => prev.filter((d) => d.id !== developer.id));
    }
  }, []);

  const swipeFromButton = async (dir) => {
    const top = developers[developers.length - 1];
    if (!top) return;
    const ref = cardRefs.current[top.id];
    if (ref?.swipe) {
      await ref.swipe(dir);
    } else {
      handleSwipe(top, dir);
    }
  };

  // Hero (no active search yet)
  if (!searchState) {
    return <SearchHero initial={{}} onSearch={runSearch} />;
  }

  const topDev = developers[developers.length - 1];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fade-in">
      <SearchSummary active={searchState} onChange={() => setSearchState(null)} />

      {meta && meta.referenceSkills?.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <Sparkles size={12} className="text-brand-400" />
          Ranked by match against:{' '}
          <span className="font-semibold text-gray-700">{meta.referenceSkills.join(', ')}</span>
        </div>
      )}

      <div className="relative h-[520px] sm:h-[560px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size={32} />
          </div>
        )}

        {!loading && developers.length === 0 && (
          <div className="card p-8 max-w-md text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <Handshake size={28} className="text-brand-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">No more developers</h3>
            <p className="mt-1 text-sm text-gray-500">
              You've gone through everyone matching your search. Try changing it, or come back
              later.
            </p>
            <div className="mt-5 flex gap-2 justify-center">
              <button onClick={() => runSearch(searchState)} className="btn-outline">
                <RefreshCw size={16} />
                Refresh
              </button>
              <button onClick={() => setSearchState(null)} className="btn-primary">
                <Search size={16} />
                New search
              </button>
            </div>
          </div>
        )}

        <div className="relative w-full max-w-sm h-full">
          {developers.map((dev, idx) => {
            const isTop = idx === developers.length - 1;
            return (
              <TinderCard
                key={dev.id}
                ref={(el) => {
                  if (el) cardRefs.current[dev.id] = el;
                  else delete cardRefs.current[dev.id];
                }}
                onSwipe={(dir) => handleSwipe(dev, dir)}
                preventSwipe={['up', 'down']}
                className="swipe-card"
              >
                <div
                  className="w-full h-full max-w-sm transition-transform"
                  style={{
                    transform: `scale(${1 - (developers.length - 1 - idx) * 0.04}) translateY(${(developers.length - 1 - idx) * 8}px)`,
                    pointerEvents: isTop ? 'auto' : 'none',
                  }}
                >
                  <DevCard developer={dev} />
                </div>
              </TinderCard>
            );
          })}
        </div>
      </div>

      {topDev && !loading && (
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={() => swipeFromButton('left')}
            className="flex items-center gap-2 px-5 h-14 rounded-full bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:scale-[1.02] transition-all shadow-soft font-semibold"
            aria-label="Skip"
          >
            <X size={20} />
            Skip
          </button>
          <button
            onClick={() => swipeFromButton('right')}
            className="flex items-center gap-2 px-6 h-16 rounded-full bg-brand-gradient text-white hover:scale-[1.02] transition-all shadow-card font-semibold"
            aria-label="Ask to collaborate"
          >
            <Handshake size={22} />
            Ask to collaborate
          </button>
        </div>
      )}

      <MatchPopup
        open={popup.open}
        matchedUser={popup.user}
        onClose={() => setPopup({ open: false, user: null })}
      />
    </div>
  );
}
