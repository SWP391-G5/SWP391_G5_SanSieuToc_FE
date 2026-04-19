import { useNavigate } from 'react-router-dom';

export default function AdBannerVertical({ banner, title, subtitle, cta, to }) {
  const navigate = useNavigate();
  if (!banner) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#474944]/30 bg-[#121410]">
      <div className="relative h-48">
        <img
          alt={banner.title || 'Ad banner'}
          className="h-full w-full object-cover opacity-80"
          src={banner.imageUrl}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0b] via-transparent to-transparent" />
      </div>

      <div className="space-y-4 p-6 pb-8">
        <div className="text-[10px] font-black uppercase tracking-widest text-[#88f6ff]">Ad</div>
        <div className="font-headline text-lg font-black text-[#fdfdf6]">{title || banner.title || 'Promotional'}</div>
        <div className="text-sm leading-relaxed text-[#abaca5]">{subtitle}</div>
        <button
          type="button"
          onClick={() => (to ? navigate(to) : null)}
          className="font-headline w-full rounded-lg bg-[#242721] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
        >
          {cta || 'Learn more'}
        </button>
      </div>
    </div>
  );
}
