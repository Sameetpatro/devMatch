import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import toast from 'react-hot-toast';
import { Heart, X, RefreshCw, Sparkles } from 'lucide-react';
import api from '../lib/api';
import DevCard from '../components/DevCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Spinner from '../components/Spinner.jsx';
import MatchPopup from '../components/MatchPopup.jsx';

const emptyFilters = { role: '', skills: '', search: '' };

export default function Swipe() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [developers, setDevelopers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ open: false, user: null });

  // Refs to call swipe() from action buttons (one per active card).
  const cardRefs = useRef({});

  const fetchDevelopers = useCallback(async (active) => {
    setLoading(true);
    try {
      const params = {};
      if (active.role) params.role = active.role;
      if (active.skills) params.skills = active.skills;
      if (active.search) params.search = active.search;
      params.limit = 30;

      const { data } = await api.get('/developers', { params });
      // Reverse so the highest-ranked (data[0]) ends up on TOP of the stack.
      // react-tinder-card renders the last child highest in z-order.
      setDevelopers([...data.data].reverse());
      setMeta(data.meta);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load developers');
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevelopers(appliedFilters);
  }, [appliedFilters, fetchDevelopers]);

  const handleApply = () => setAppliedFilters({ ...filters });
  const handleReset = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  // Send the swipe to the backend, then drop the card from the stack.
  const handleSwipe = useCallback(
    async (developer, dir) => {
      const direction = dir === 'right' ? 'LIKE' : 'PASS';
      try {
        const { data } = await api.post('/swipes', {
          toUserId: developer.id,
          direction,
        });

        if (data.match && data.isNewMatch) {
          setPopup({ open: true, user: developer });
        } else if (direction === 'LIKE') {
          toast(`Liked ${developer.name}`, { icon: '💖' });
        }
      } catch (err) {
        toast.error(err.displayMessage || 'Swipe failed');
      } finally {
        setDevelopers((prev) => prev.filter((d) => d.id !== developer.id));
      }
    },
    []
  );

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

  const topDev = developers[developers.length - 1];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
      />

      {meta && meta.referenceSkills?.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <Sparkles size={12} className="text-brand-400" />
          Ranked by your match against:{' '}
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
              <Heart size={28} className="text-brand-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">No more developers</h3>
            <p className="mt-1 text-sm text-gray-500">
              You've swiped through everyone matching your filters. Try adjusting them, or check
              back later.
            </p>
            <button onClick={() => fetchDevelopers(appliedFilters)} className="btn-primary mt-5">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        )}

        {/* Card stack — last child is on top */}
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
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => swipeFromButton('left')}
            className="h-14 w-14 rounded-full bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:scale-105 transition-all shadow-soft flex items-center justify-center"
            aria-label="Pass"
          >
            <X size={26} />
          </button>
          <button
            onClick={() => swipeFromButton('right')}
            className="h-16 w-16 rounded-full bg-brand-gradient text-white hover:scale-105 transition-all shadow-card flex items-center justify-center"
            aria-label="Like"
          >
            <Heart size={28} className="fill-white" />
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
