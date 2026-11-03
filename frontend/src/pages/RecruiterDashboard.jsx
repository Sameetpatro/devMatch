import { useEffect, useState } from 'react';
import {
  Briefcase, Plus, Users, CheckCircle, XCircle, MapPin, DollarSign, Clock, Sparkles, Building2,
  Rocket, Send, MessageCircle, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner.jsx';
import ChatModal from '../components/ChatModal.jsx';

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'sent_requests'
  const [roles, setRoles] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeRoleDetails, setActiveRoleDetails] = useState(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  // Form State
  const [isCompany, setIsCompany] = useState(true);
  const [form, setForm] = useState({
    title: '',
    companyName: '',
    description: '',
    location: '',
    isRemote: true,
    experienceYearsRequired: 2,
    salaryRange: '$120k - $150k',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data.data || []);
    } catch (err) {
      toast.error('Failed to load published roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await api.get('/swipes/sent');
      setSentRequests(res.data.data || []);
    } catch (err) {
      console.warn('Could not load sent requests', err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchSentRequests();
  }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skillList = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (!skillList.length) {
        toast.error('Please specify at least one skill');
        setSubmitting(false);
        return;
      }

      const finalCompanyName = isCompany
        ? (form.companyName || 'Tech Startup')
        : (form.companyName ? `Personal Project: ${form.companyName}` : 'Personal Project / Indie');

      await api.post('/roles', {
        ...form,
        companyName: finalCompanyName,
        experienceYearsRequired: Number(form.experienceYearsRequired) || 0,
        skills: skillList,
      });

      toast.success('Role published successfully! RabbitMQ matching worker activated.');
      setShowCreateModal(false);
      setForm({
        title: '',
        companyName: '',
        description: '',
        location: '',
        isRemote: true,
        experienceYearsRequired: 2,
        salaryRange: '$120k - $150k',
        skills: '',
      });
      fetchRoles();
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to publish role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewApplicants = async (roleId) => {
    setLoadingApplicants(true);
    try {
      const { data } = await api.get(`/roles/${roleId}/candidates`);
      setActiveRoleDetails(data.data);
    } catch (err) {
      toast.error('Failed to load applicants for role');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleDecision = async (roleId, applicationId, decision) => {
    try {
      const { data } = await api.post(`/roles/${roleId}/applications/${applicationId}/decision`, {
        decision,
      });
      if (decision === 'ACCEPTED') {
        toast.success("It's a Connection! Candidate notified and live chat unlocked.");
      } else {
        toast('Application rejected. Candidate inbox updated.', { icon: 'ℹ️' });
      }
      handleViewApplicants(roleId);
      fetchRoles();
    } catch (err) {
      toast.error('Failed to record decision');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
            Recruiter & Project Lead Portal
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Manage Roles & Talent Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish company roles or personal projects, review applicants, and track sent requests.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <a
            href="/swipe"
            className="px-4 py-2 rounded-xl border border-pink-200 bg-white text-gray-700 hover:text-pink-600 hover:bg-pink-50 text-xs font-bold transition-colors shadow-soft flex items-center gap-1.5"
          >
            <Users size={15} className="text-pink-500" />
            Find Developers
          </a>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            Post Role / Project
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pink-100 gap-4">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'roles'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Briefcase size={16} />
          My Published Roles & Projects ({roles.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('sent_requests');
            fetchSentRequests();
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'sent_requests'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Send size={16} />
          Sent Requests to Developers ({sentRequests.length})
        </button>
      </div>

      {/* Tab 1: Roles */}
      {activeTab === 'roles' && (
        <>
          {loading ? (
            <div className="py-20 flex justify-center">
              <Spinner size={36} />
            </div>
          ) : roles.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-pink-200">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">No roles or projects published yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                Post your company openings or personal collaboration projects to receive ranked applications.
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-6 inline-flex">
                <Plus size={18} /> Post New Role / Project
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => {
                const isPersonal = (r.companyName || '').toLowerCase().includes('personal') || (r.companyName || '').toLowerCase().includes('indie');
                return (
                  <div
                    key={r.id}
                    className="card p-6 border-pink-100 hover:border-pink-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-gray-900 leading-snug">{r.title}</h3>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-pink-600 flex items-center gap-1.5 mt-1">
                        {isPersonal ? <Rocket size={13} /> : <Building2 size={13} />}
                        {r.companyName}
                      </p>

                      <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                        {r.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(r.skills || []).map((s) => (
                          <span key={s} className="chip text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-pink-500" />
                          <span>{r.experienceYearsRequired}+ yrs exp</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-pink-500" />
                          <span>{r.isRemote ? 'Remote' : r.location || 'Onsite'}</span>
                        </div>
                        {r.salaryRange && (
                          <div className="col-span-2 flex items-center gap-1.5 text-gray-700 font-medium mt-1">
                            <DollarSign size={13} className="text-emerald-600" />
                            <span>{r.salaryRange}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-pink-100/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                        <Users size={14} className="text-pink-600" />
                        {r._count?.applications || 0} applicants
                      </span>
                      <button
                        onClick={() => handleViewApplicants(r.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 font-semibold text-xs transition-colors"
                      >
                        Review Applicants
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Sent Requests to Developers */}
      {activeTab === 'sent_requests' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-pink-200">
              <Send size={32} className="mx-auto text-pink-400 mb-2 opacity-50" />
              <h3 className="text-lg font-bold text-gray-800">No requests sent yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Use the "Find Developers" search feed to discover top candidates and send collaboration requests.
              </p>
              <a href="/swipe" className="btn-primary text-xs font-bold inline-flex">
                <Users size={14} /> Browse Developers
              </a>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sentRequests.map((req) => {
                const dev = req.targetUser || {};
                const isConnected = req.status === 'CONNECTED';

                return (
                  <div
                    key={req.id}
                    className="card p-5 border-pink-100 hover:border-pink-200 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-base text-gray-900">{dev.name}</h4>
                          <p className="text-xs text-pink-600 font-medium">{dev.role || 'Developer'}</p>
                        </div>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Pending Response
                          </span>
                        )}
                      </div>

                      {dev.bio && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {dev.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {(dev.skills || []).map((s) => (
                          <span key={s} className="chip text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Sent {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {isConnected && req.matchId && (
                        <button
                          onClick={() =>
                            setActiveChat({
                              matchId: req.matchId,
                              partnerName: dev.name,
                            })
                          }
                          className="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <MessageCircle size={13} />
                          Live Chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Applicants Modal */}
      {activeRoleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-pink-100 overflow-hidden">
            <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/60 to-amber-50/60">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Applicants for "{activeRoleDetails.role.title}"
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ranked by skill match score, rating, and experience fit (3-day decision window)
                </p>
              </div>
              <button
                onClick={() => setActiveRoleDetails(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/40">
              {activeRoleDetails.applicants.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Users size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold">No candidates have applied to this role yet.</p>
                </div>
              ) : (
                activeRoleDetails.applicants.map((app) => (
                  <div
                    key={app.applicationId}
                    className="p-5 bg-white rounded-2xl border border-pink-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-gray-900">{app.developer.name}</h4>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {app.scoring.score}% Match
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            app.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : app.status === 'EXPIRED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                        {app.status === 'PENDING' && (
                          <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                            <Clock size={11} /> {app.remainingHours}h left to review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {app.developer.role} • {app.developer.experienceYears} years experience
                      </p>
                      {app.coverLetter && (
                        <p className="text-xs text-gray-600 bg-pink-50/50 p-2.5 rounded-xl border border-pink-100/60 italic">
                          "{app.coverLetter}"
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.developer.skills.map((s) => (
                          <span key={s} className="chip text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {app.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() =>
                              handleDecision(
                                activeRoleDetails.role.id,
                                app.applicationId,
                                'ACCEPTED'
                              )
                            }
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-xs shadow-md hover:opacity-95"
                          >
                            <CheckCircle size={14} /> Accept & Connect
                          </button>
                          <button
                            onClick={() =>
                              handleDecision(
                                activeRoleDetails.role.id,
                                app.applicationId,
                                'REJECTED'
                              )
                            }
                            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                      {app.status === 'ACCEPTED' && (
                        <a
                          href="/connections"
                          className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 font-semibold text-xs flex items-center gap-1"
                        >
                          <MessageCircle size={14} /> Go to Chat
                        </a>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="text-xs text-rose-500 font-semibold">Rejected</span>
                      )}
                      {app.status === 'EXPIRED' && (
                        <span className="text-xs text-gray-400 font-semibold">Expired</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-pink-100">
              <h3 className="font-bold text-lg text-gray-900">Post New Role or Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-4">
              {/* Company vs Personal Project Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Posting Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCompany(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isCompany
                        ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <Building2 size={15} /> Company Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompany(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      !isCompany
                        ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <Rocket size={15} /> Personal Project
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isCompany ? 'Position Title *' : 'Project Role / Co-founder Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isCompany ? 'e.g. Senior Backend Engineer' : 'e.g. AI Co-founder / React Native Lead'}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isCompany ? 'Company / Organization Name *' : 'Project Name / Initiative (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isCompany ? 'e.g. TechCorp Labs' : 'e.g. Side Project: Voice Agent'}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the scope, responsibilities, tech stack, and goals..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.experienceYearsRequired}
                    onChange={(e) => setForm({ ...form, experienceYearsRequired: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isCompany ? 'Salary Range' : 'Equity / Compensation'}
                  </label>
                  <input
                    type="text"
                    placeholder={isCompany ? '$130k - $160k' : 'Equity / Revenue Share / Unpaid'}
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRemote}
                    onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
                    className="accent-pink-500 h-4 w-4 rounded"
                  />
                  Remote Friendly
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs"
                  >
                    {submitting ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
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
