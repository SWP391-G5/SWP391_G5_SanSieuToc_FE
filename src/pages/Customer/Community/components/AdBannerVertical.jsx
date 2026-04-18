export default function AdBannerVertical({ title, subtitle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#474944]/30 bg-[#121410]">
      <div className="relative h-48">
        <img
          alt="Ad banner"
          className="h-full w-full object-cover opacity-80"
          src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=60"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0b] via-transparent to-transparent" />
      </div>

      <div className="space-y-3 p-5">
        <div className="text-[10px] font-black uppercase tracking-widest text-[#88f6ff]">Ad</div>
        <div className="font-headline text-lg font-black text-[#fdfdf6]">{title}</div>
        <div className="text-sm text-[#abaca5]">{subtitle}</div>
        <button
          type="button"
          className="font-headline w-full rounded-lg bg-[#242721] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
        >
          Learn more
        </button>
      </div>
    </div>
  );
}
