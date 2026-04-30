import { Briefcase, Star, MapPin, Sparkles } from 'lucide-react';

// One swipeable developer card. Designed to fill a fixed-size container
// (the swipe stack). Pure presentational — swipe handlers come from parent.
export default function DevCard({ developer, dragRef, style, hideScore }) {
  const initial = developer.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      ref={dragRef}
      style={style}
      className="card overflow-hidden w-full h-full flex flex-col select-none"
    >
      {/* gradient banner */}
      <div className="h-32 bg-brand-gradient relative shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
        {!hideScore && typeof developer.score === 'number' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-600 shadow">
            <Sparkles size={12} />
            {developer.score} score
          </div>
        )}
        <div className="absolute -bottom-10 left-6">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-card flex items-center justify-center text-3xl font-extrabold text-brand-500 border-4 border-white">
            {initial}
          </div>
        </div>
      </div>

      <div className="px-6 pt-12 pb-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{developer.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Briefcase size={14} />
              {developer.role}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-pink-50 px-2 py-1 border border-pink-100">
            <Star size={14} className="text-brand-500 fill-brand-500" />
            <span className="text-sm font-semibold text-brand-600">
              {Number(developer.rating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-brand-400" />
            {developer.experienceYears} yr{developer.experienceYears === 1 ? '' : 's'} exp
          </span>
          {developer.isAvailable && (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Available
            </span>
          )}
        </div>

        {developer.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-3">{developer.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(developer.skills ?? []).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
