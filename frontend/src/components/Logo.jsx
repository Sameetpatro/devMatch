import { Heart } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-lg' },
    md: { box: 'h-10 w-10', icon: 20, text: 'text-xl' },
    lg: { box: 'h-14 w-14', icon: 28, text: 'text-3xl' },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${s.box} flex items-center justify-center rounded-xl bg-brand-gradient shadow-card`}>
        <Heart size={s.icon} className="text-white fill-white" />
      </div>
      <span className={`${s.text} font-extrabold tracking-tight text-gray-900`}>
        Dev<span className="text-brand-500">Match</span>
      </span>
    </div>
  );
}
