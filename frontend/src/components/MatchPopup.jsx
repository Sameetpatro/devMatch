import { Heart, MessageCircle, X } from 'lucide-react';

export default function MatchPopup({ open, matchedUser, onClose }) {
  if (!open || !matchedUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative card max-w-sm w-[92%] mx-4 p-8 text-center animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mx-auto h-20 w-20 rounded-full bg-brand-gradient flex items-center justify-center shadow-card">
          <Heart size={36} className="text-white fill-white" />
        </div>

        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">
          It's a match!
        </h2>
        <p className="mt-1 text-gray-600">
          You and <span className="font-bold text-brand-600">{matchedUser.name}</span> liked each other.
        </p>

        <div className="mt-5 flex items-center gap-2 justify-center">
          <button className="btn-outline" onClick={onClose}>
            Keep swiping
          </button>
          <a href="/matches" className="btn-primary">
            <MessageCircle size={16} />
            View matches
          </a>
        </div>
      </div>
    </div>
  );
}
