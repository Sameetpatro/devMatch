import { Briefcase, Star, MapPin, Sparkles } from 'lucide-react';

// One swipeable developer card. Designed to fill a fixed-size container
// (the swipe stack). Pure presentational — swipe handlers come from parent.
export default function DevCard({ developer, dragRef, style, hideScore }) {
  const initial = developer.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      ref={dragRef}
      style={style}
      className="card overflow-hidden w-full h-full flex flex-col select-none border-pink-100 hover:border-amber-200 transition-colors"
    >
      {/* Pink + Yellow sunset gradient banner */}
      <div className="h-32 bg-brand-gradient relative shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_60%)]" />
        {!hideScore && typeof developer.score === 'number' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-bold text-gray-900 shadow-md border border-amber-200">
            <Sparkles size={13} className="text-amber-500 fill-amber-400" />
            <span><span className="text-pink-600 font-extrabold">{developer.score}</span> match</span>
          </div>
        )}
        <div className="absolute -bottom-10 left-6">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-card flex items-center justify-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-amber-500 border-4 border-white">
            {initial}
          </div>
        </div>
      </div>

      <div className="px-6 pt-12 pb-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{developer.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Briefcase size={14} className="text-amber-600" />
              {developer.role}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200 shadow-sm">
            <Star size={14} className="text-amber-500 fill-amber-400" />
            <span className="text-sm font-bold text-amber-800">
              {Number(developer.rating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-pink-500" />
            {developer.experienceYears} yr{developer.experienceYears === 1 ? '' : 's'} exp
          </span>
          {developer.isAvailable && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Available
            </span>
          )}
        </div>

        {developer.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-3">{developer.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(developer.skills ?? []).map((s, idx) => (
            <span
              key={s}
              className={idx % 2 === 0 ? 'chip' : 'chip-yellow'}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
