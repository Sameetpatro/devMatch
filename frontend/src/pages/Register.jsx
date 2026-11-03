import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User2, Briefcase, Code2, Phone, Send, Building2, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import Logo from '../components/Logo.jsx';
import { GithubIcon, LinkedinIcon } from '../components/icons.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userType: 'DEVELOPER', // 'DEVELOPER' | 'RECRUITER'
    companyName: '',
    email: '',
    password: '',
    name: '',
    role: '',
    bio: '',
    experienceYears: 0,
    skills: '',
    phone: '',
    linkedin: '',
    github: '',
    telegram: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skills = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const user = await register({
        userType: form.userType,
        companyName: form.companyName || undefined,
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        bio: form.bio || undefined,
        experienceYears: Number(form.experienceYears) || 0,
        skills: skills.length ? skills : undefined,
        phone: form.phone,
        linkedin: form.linkedin || undefined,
        github: form.github || undefined,
        telegram: form.telegram || undefined,
      });

      toast.success('Account created!');
      if (user.userType === 'RECRUITER') {
        navigate('/recruiter', { replace: true });
      } else {
        navigate('/roles', { replace: true });
      }
    } catch (err) {
      toast.error(err.displayMessage || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="card p-7 sm:p-8 animate-fade-in border-pink-100">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join the platform to discover roles, publish jobs, and connect directly.
          </p>

          {/* Account Type Selector */}
          <div className="mt-6 p-1.5 bg-pink-50/60 rounded-2xl border border-pink-100 flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, userType: 'DEVELOPER' })}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                form.userType === 'DEVELOPER'
                  ? 'bg-white text-pink-600 shadow-sm border border-pink-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👨‍💻 I am a Developer
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, userType: 'RECRUITER' })}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                form.userType === 'RECRUITER'
                  ? 'bg-white text-pink-600 shadow-sm border border-pink-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏢 I am a Recruiter / Founder
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            {/* --- Basic info --- */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-amber-600 mb-3">
                {form.userType === 'RECRUITER' ? 'Recruiter Profile' : 'Developer Profile'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      className="input pl-9"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={update('email')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="input pl-9"
                      placeholder="At least 6 chars"
                      value={form.password}
                      onChange={update('password')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      className="input pl-9"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={update('name')}
                    />
                  </div>
                </div>

                {form.userType === 'RECRUITER' && (
                  <div className="sm:col-span-2">
                    <label className="label">Company / Organization *</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        className="input pl-9"
                        placeholder="e.g. Acme Tech Labs"
                        value={form.companyName}
                        onChange={update('companyName')}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">
                    {form.userType === 'RECRUITER' ? 'Headline / Role *' : 'Role / Title *'}
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      className="input pl-9"
                      placeholder={
                        form.userType === 'RECRUITER'
                          ? 'e.g. Technical Talent Partner'
                          : 'e.g. Fullstack Engineer'
                      }
                      value={form.role}
                      onChange={update('role')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Years of experience</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="input"
                    value={form.experienceYears}
                    onChange={update('experienceYears')}
                  />
                </div>

                {form.userType === 'DEVELOPER' && (
                  <div className="sm:col-span-2">
                    <label className="label">Skills (comma separated)</label>
                    <div className="relative">
                      <Code2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        className="input pl-9"
                        placeholder="React, Node.js, PostgreSQL, Redis"
                        value={form.skills}
                        onChange={update('skills')}
                      />
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="label">Bio / Summary</label>
                  <textarea
                    rows={3}
                    className="input min-h-[88px] resize-none"
                    placeholder={
                      form.userType === 'RECRUITER'
                        ? 'Tell candidates about your company mission and engineering culture...'
                        : "Tell recruiters what you're passionate about building..."
                    }
                    value={form.bio}
                    onChange={update('bio')}
                  />
                </div>
              </div>
            </div>

            {/* --- Contact Info --- */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-amber-600">
                  Contact Details
                </h2>
                <span className="text-xs text-gray-400">Unlocked only upon mutual match</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Phone number *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      className="input pl-9"
                      placeholder="+1 555 123 4567"
                      value={form.phone}
                      onChange={update('phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Telegram handle</label>
                  <div className="relative">
                    <Send size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="input pl-9"
                      placeholder="@username"
                      value={form.telegram}
                      onChange={update('telegram')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">LinkedIn URL</label>
                  <div className="relative">
                    <LinkedinIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      className="input pl-9"
                      placeholder="https://linkedin.com/in/..."
                      value={form.linkedin}
                      onChange={update('linkedin')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">GitHub URL</label>
                  <div className="relative">
                    <GithubIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      className="input pl-9"
                      placeholder="https://github.com/..."
                      value={form.github}
                      onChange={update('github')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
              {submitting ? 'Creating profile...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-pink-600 hover:text-pink-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
