import { useState, useEffect } from 'react';
import { Briefcase, Clock, CheckCircle2, XCircle, AlertCircle, MessageCircle, MapPin, DollarSign, Sparkles } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import ChatModal from '../components/ChatModal';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // { matchId, partnerName }

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roles/applications/mine');
      setApplications(res.data.data || []);
    } catch (err) {
      console.error('Error fetching applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const total = applications.length;
  const pending = applications.filter((a) => a.status === 'PENDING').length;
  const accepted = applications.filter((a) => a.status === 'ACCEPTED').length;
  const rejected = applications.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Applications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track the status of your company job applications and collaboration requests.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 border-pink-100 bg-white">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Applied</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{total}</div>
        </div>
        <div className="card p-4 border-amber-100 bg-amber-50/40">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Under Review</span>
          <div className="text-2xl font-black text-amber-800 mt-1">{pending}</div>
        </div>
        <div className="card p-4 border-emerald-100 bg-emerald-50/40">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Accepted & Ready</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{accepted}</div>
        </div>
        <div className="card p-4 border-rose-100 bg-rose-50/40">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Not Selected</span>
          <div className="text-2xl font-black text-rose-800 mt-1">{rejected}</div>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size={36} />
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-pink-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-50 to-amber-50 text-pink-500 flex items-center justify-center mx-auto mb-4 border border-pink-100">
            <Briefcase size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No applications yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
            You haven't submitted any applications yet. Explore the Jobs Feed to find roles matching your skill set!
          </p>
          <a
            href="/roles"
            className="inline-flex items-center gap-2 btn-primary px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            <Sparkles size={16} />
            Explore Roles Feed
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const role = app.role || {};
            const isAccepted = app.status === 'ACCEPTED';
            const isRejected = app.status === 'REJECTED';
            const isPending = app.status === 'PENDING';
            const isExpired = app.status === 'EXPIRED';

            return (
              <div
                key={app.id}
                className="card p-6 border-pink-100 hover:border-pink-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-gray-900">{role.title || 'Job Role'}</h3>
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full">
                      {role.companyName || 'Personal Project'}
                    </span>

                    {/* Status Badge */}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} />
                        Accepted • Connected
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle size={13} />
                        Not Selected
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={13} />
                        Under Review ({app.remainingHours}h remaining in 3-day window)
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        <AlertCircle size={13} />
                        Review Window Expired
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">{role.description}</p>

                  {/* Skills required */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(role.skills || []).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Meta details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-pink-500" />
                      Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                    {role.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {role.location}
                      </span>
                    )}
                    {role.salaryRange && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {role.salaryRange}
                      </span>
                    )}
                  </div>

                  {app.coverLetter && (
                    <div className="mt-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-gray-600">
                      <span className="font-semibold text-gray-700">Cover note: </span>
                      "{app.coverLetter}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-3">
                  {isAccepted && app.matchId ? (
                    <button
                      onClick={() =>
                        setActiveChat({
                          matchId: app.matchId,
                          partnerName: role.recruiter?.name || role.companyName || 'Recruiter',
                        })
                      }
                      className="btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-soft hover:shadow-md transition-all animate-bounce-subtle"
                    >
                      <MessageCircle size={15} />
                      Start Live Chat
                    </button>
                  ) : isAccepted ? (
                    <a
                      href="/connections"
                      className="btn-primary px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      <MessageCircle size={14} />
                      Go to Connections
                    </a>
                  ) : isPending ? (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                      Awaiting Decision
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">Archived</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Chat Modal */}
      {activeChat && (
        <ChatModal
          matchId={activeChat.matchId}
          partnerName={activeChat.partnerName}
          isOpen={true}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}

