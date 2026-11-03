import { Handshake, Users, X, Sparkles } from 'lucide-react';

export default function MatchPopup({ open, matchedUser, onClose }) {
  if (!open || !matchedUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative card max-w-sm w-[92%] mx-4 p-8 text-center animate-pop border-2 border-amber-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="relative mx-auto h-20 w-20 rounded-full bg-brand-gradient flex items-center justify-center shadow-card">
          <Handshake size={36} className="text-white" />
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-gray-950 shadow-md">
            <Sparkles size={14} />
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900">
          You're <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-amber-600">Connected!</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          You and <span className="font-bold text-pink-600">{matchedUser.name}</span> both want to
          collaborate. Contact details are now unlocked!
        </p>

        <div className="mt-6 flex items-center gap-2.5 justify-center">
          <button className="btn-outline text-xs sm:text-sm" onClick={onClose}>
            Keep searching
          </button>
          <a href="/connections" className="btn-primary text-xs sm:text-sm">
            <Users size={16} />
            View connections
          </a>
        </div>
      </div>
    </div>
  );
}
