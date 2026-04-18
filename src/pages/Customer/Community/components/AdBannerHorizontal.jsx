export default function AdBannerHorizontal({ title, subtitle, cta }) {
  return (
    <div className="group relative mb-10 flex min-h-[9rem] flex-col justify-center overflow-hidden rounded-xl border border-[#8eff71]/20 bg-gradient-to-r from-[#181a16] via-[#181a16] to-[#88f6ff]/20 p-8">
      <div className="z-10 max-w-2xl space-y-3">
        <span className="font-headline inline-block rounded-full bg-[#8eff71]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71]">
          Sponsored
        </span>
        <h2 className="font-headline text-2xl font-black leading-tight">{title}</h2>
        <p className="max-w-xl text-sm text-[#abaca5]">{subtitle}</p>
        <button
          type="button"
          className="font-headline w-fit rounded-lg bg-[#8eff71] px-6 py-2 text-sm font-black text-[#0d6100] transition-all hover:scale-105"
        >
          {cta}
        </button>
      </div>

      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-25 grayscale transition-all duration-500 group-hover:grayscale-0">
        <img
          alt="Ad banner"
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=60"
          loading="lazy"
        />
      </div>
    </div>
  );
}
