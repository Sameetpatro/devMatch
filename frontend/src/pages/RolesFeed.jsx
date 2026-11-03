import { useEffect, useState } from 'react';
import {
  Briefcase, Sparkles, MapPin, DollarSign, Clock, CheckCircle2, ChevronRight, Send, X,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner.jsx';

export default function RolesFeed() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [meta, setMeta] = useState(null);

  const fetchFeed = async () => {
    try {
      const { data } = await api.get('/roles/feed');
      setFeedItems(data.data || []);
      setMeta(data.meta);
    } catch (err) {
      toast.error('Failed to load personalized roles feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;

    setSubmitting(true);
    try {
      await api.post(`/roles/${selectedRole.role.id}/apply`, {
        coverLetter: coverLetter || undefined,
      });

      toast.success(
        `Applied to ${selectedRole.role.title}! Recruiter notified via background queue.`
      );

      // Remove applied role from feed deck
      setFeedItems((prev) => prev.filter((item) => item.role.id !== selectedRole.role.id));
      setSelectedRole(null);
      setCoverLetter('');
    } catch (err) {
      toast.error(err.displayMessage || 'Application failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200 flex items-center gap-1.5">
              <Sparkles size={13} className="text-pink-500 fill-pink-400" />
              Personalized Feed
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
            Discover Matching Opportunities
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Roles ranked in real-time by your skill overlap, experience fit, and availability.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size={36} />
        </div>
      ) : feedItems.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-pink-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-50 to-amber-50 text-pink-500 flex items-center justify-center mx-auto mb-4 border border-pink-100">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">You're all caught up!</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
            You have reviewed all available roles matching your profile. Check back shortly as new roles are posted continuously.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {feedItems.map(({ role, scoring }) => {
            const isHighMatch = scoring.score >= 70;
            return (
              <div
                key={role.id}
                className="card p-6 border-pink-100 hover:border-pink-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      {(role.companyName || '').toLowerCase().includes('personal') || (role.companyName || '').toLowerCase().includes('indie') ? (
                        <>🚀 {role.companyName}</>
                      ) : (
                        <>🏢 {role.companyName}</>
                      )}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-3 py-0.5 rounded-full ${
                        isHighMatch
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {scoring.score}% Match ({scoring.matchingSkills}/{scoring.requiredSkillsCount} skills)
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {role.description}
                  </p>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(role.skills || []).map((s) => {
                      const isMatching = (meta?.developerSkills || []).includes(s.toLowerCase());
                      return (
                        <span
                          key={s}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                            isMatching
                              ? 'bg-pink-500 text-white shadow-xs font-semibold'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {s} {isMatching && '✓'}
                        </span>
                      );
                    })}
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-pink-500" />
                      {role.experienceYearsRequired}+ yrs experience required
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-pink-500" />
                      {role.isRemote ? 'Remote Friendly' : role.location || 'Onsite'}
                    </span>
                    {role.salaryRange && (
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        <DollarSign size={13} className="text-emerald-600" />
                        {role.salaryRange}
                      </span>
                    )}
                  </div>
                </div>

                {/* Apply CTA */}
                <div className="flex items-center gap-2 shrink-0 md:self-center">
                  <button
                    onClick={() => setSelectedRole({ role, scoring })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all"
                  >
                    Apply Now
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-5">
            <div className="flex items-center justify-between border-b border-pink-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Apply for {selectedRole.role.title}
                </h3>
                <p className="text-xs text-pink-600 font-semibold mt-0.5">
                  {selectedRole.role.companyName} • {selectedRole.scoring.score}% Compatibility Score
                </p>
              </div>
              <button onClick={() => setSelectedRole(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="label">Cover Note / Intro (Optional)</label>
                <textarea
                  rows={4}
                  placeholder="Share a brief introduction or highlight your experience with the role requirements..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="input resize-none"
                />
              </div>

              <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100/70 text-xs text-gray-600">
                💡 Submitting your application alerts the hiring team via the RabbitMQ event queue and prioritizes your card in their review deck.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  <Send size={15} />
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

