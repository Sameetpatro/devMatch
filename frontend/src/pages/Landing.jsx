import { Link, Navigate } from 'react-router-dom';
import {
  Search, Sparkles, Handshake, ShieldCheck, ArrowRight, Users, Briefcase,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../lib/auth.jsx';

const FEATURES = [
  {
    icon: Search,
    title: 'Smart search',
    body: 'Filter by role, skills, or experience. Looking for a Backend dev who knows Postgres? One search away.',
  },
  {
    icon: Sparkles,
    title: 'Ranked by match',
    body: 'Candidates are scored by skill overlap, rating, and experience — best fits surface first, every time.',
  },
  {
    icon: Handshake,
    title: 'Both must agree',
    body: 'You ask to collaborate; they ask back. No one-sided spam — only mutual interest unlocks the match.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy first',
    body: 'Phone, email, LinkedIn, GitHub, Telegram — all hidden until both of you agree to work together.',
  },
];

const STEPS = [
  { n: 1, title: 'Search', body: 'Pick a role and the skills you need. Hit search.' },
  { n: 2, title: 'Ask to collaborate', body: 'Swipe through ranked devs. Like the ones you’d work with.' },
  { n: 3, title: 'Connect', body: 'When they ask back, contact details unlock instantly.' },
];

export default function Landing() {
  const { user, loading } = useAuth();

  // Logged-in users skip the marketing page.
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- Top nav --- */}
      <header className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
          <Logo />
          <Link to="/login" className="btn-ghost text-sm">
            Sign in
          </Link>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="px-4 sm:px-6 pt-10 sm:pt-16 pb-16">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <span className="chip mb-5">
            <Briefcase size={12} className="mr-1.5" />
            For developers who want to build, together
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.05]">
            Find the dev you actually
            <br className="hidden sm:block" />{' '}
            want to <span className="text-brand-500">build with</span>.
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            DevMatch is a Tinder-style platform where developers swipe to find collaborators —
            ranked by shared skills, gated by mutual consent, private until you connect.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">
              Get started
              <ArrowRight size={18} />
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Free. No credit card. Build something cool.
          </p>
        </div>

        {/* Hero illustration: stack of "cards" hinting at the swipe UI */}
        <div className="mt-16 max-w-md mx-auto relative h-72 sm:h-80">
          {[
            { rot: '-rot-6', off: 'translate-x-[-12%] translate-y-2 opacity-60', body: 'React • Node • Postgres' },
            { rot: '-rot-3', off: 'translate-x-[-6%] translate-y-1 opacity-80', body: 'Kotlin • Jetpack' },
            { rot: 'rot-0', off: '', body: 'You + your future collaborator' },
          ].map((c, i) => (
            <div
              key={i}
              className={`absolute inset-0 card overflow-hidden transition-all`}
              style={{ transform: `translate(${i * -3}%, ${i * 4}px) rotate(${(2 - i) * -2}deg)`, zIndex: i }}
            >
              <div className="h-24 bg-brand-gradient" />
              <div className="px-5 pb-5 -mt-8">
                <div className="h-14 w-14 rounded-2xl bg-brand-gradient text-white border-4 border-white shadow-card flex items-center justify-center text-xl font-extrabold">
                  {['S', 'A', 'D'][i]}
                </div>
                <div className="mt-3">
                  <div className="h-3 w-32 bg-pink-100 rounded" />
                  <div className="mt-2 h-2 w-24 bg-pink-50 rounded" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.body.split(' • ').map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- What is DevMatch --- */}
      <section className="px-4 sm:px-6 py-14 bg-white border-y border-pink-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            What is <span className="text-brand-500">DevMatch</span>?
          </h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            Most "find a co-founder" tools are either job boards (one-sided) or generic networks
            (noisy). DevMatch is built around one idea: <strong className="text-gray-900">two
            developers who genuinely want to build together</strong>. You search for the role you
            need, swipe through candidates ranked by skill match, and contact details only unlock
            when you both opt in.
          </p>
        </div>
      </section>

      {/* --- Features --- */}
      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Why DevMatch
            </h2>
            <p className="mt-2 text-gray-500">Designed for builders, not recruiters.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card p-6 hover:scale-[1.02] transition-transform">
                <div className="h-12 w-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-card">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="mt-4 font-bold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- How it works --- */}
      <section className="px-4 sm:px-6 py-14 bg-white border-y border-pink-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              How it works
            </h2>
            <p className="mt-2 text-gray-500">Three steps. That's it.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="card p-6 text-center relative">
                <div className="mx-auto h-12 w-12 rounded-full bg-brand-gradient text-white flex items-center justify-center text-lg font-extrabold shadow-card">
                  {n}
                </div>
                <h3 className="mt-4 font-bold text-gray-900 text-lg">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Final CTA --- */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto card p-8 sm:p-12 text-center bg-brand-gradient text-white border-0 shadow-card">
          <Users size={36} className="mx-auto opacity-90" />
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find your collaborator?
          </h2>
          <p className="mt-2 opacity-90">
            Join DevMatch and start matching with developers who fit your project.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 bg-white text-brand-600 font-bold hover:bg-pink-50 transition-colors text-base shadow"
          >
            Get started
            <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-xs opacity-80">
            Already have an account?{' '}
            <Link to="/login" className="underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-gray-400">
        DevMatch &copy; {new Date().getFullYear()} — Find your dev collaborator.
      </footer>
    </div>
  );
}
