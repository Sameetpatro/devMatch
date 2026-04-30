import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User2, Briefcase, Code2, Phone, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import Logo from '../components/Logo.jsx';
import { GithubIcon, LinkedinIcon } from '../components/icons.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

      await register({
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
      navigate('/swipe', { replace: true });
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

        <div className="card p-7 sm:p-8 animate-fade-in">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tell us a bit about you so we can find your perfect collaborator.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            {/* --- Basic info --- */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">
                Basic info
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Email</label>
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
                  <label className="label">Password</label>
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
                  <label className="label">Name</label>
                  <div className="relative">
                    <User2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      className="input pl-9"
                      placeholder="Your name"
                      value={form.name}
                      onChange={update('name')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Role</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      className="input pl-9"
                      placeholder="Frontend Developer, Android Dev..."
                      value={form.role}
                      onChange={update('role')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    className="input"
                    value={form.experienceYears}
                    onChange={update('experienceYears')}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Skills (comma separated)</label>
                  <div className="relative">
                    <Code2 size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      className="input pl-9"
                      placeholder="React, Node, TypeScript"
                      value={form.skills}
                      onChange={update('skills')}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Bio</label>
                  <textarea
                    className="input min-h-[88px] resize-none"
                    placeholder="Tell us what kind of project you're looking to build..."
                    value={form.bio}
                    onChange={update('bio')}
                  />
                </div>
              </div>
            </div>

            {/* --- Contact --- */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
                Contact
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Only visible to people you've connected with. Phone is required so collaborators can
                reach you.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    Phone <span className="text-brand-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      className="input pl-9"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={update('phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Telegram</label>
                  <div className="relative">
                    <Send size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="input pl-9"
                      placeholder="@yourhandle"
                      value={form.telegram}
                      onChange={update('telegram')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">LinkedIn</label>
                  <div className="relative">
                    <LinkedinIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      className="input pl-9"
                      placeholder="https://linkedin.com/in/your-handle"
                      value={form.linkedin}
                      onChange={update('linkedin')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">GitHub</label>
                  <div className="relative">
                    <GithubIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      className="input pl-9"
                      placeholder="https://github.com/your-handle"
                      value={form.github}
                      onChange={update('github')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
