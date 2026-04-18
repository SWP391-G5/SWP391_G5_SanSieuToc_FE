export default function WishlistCard({
  field,
  wished,
  onToggleWishlist,
  onViewInList,
  onToggleCompare,
  isCompared = false,
  compareDisabled = false,
}) {
  const f = field;

  const imageUrl = (() => {
    if (f?.image) return f.image;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#121410"/>
      <stop offset="1" stop-color="#0d0f0b"/>
    </linearGradient>
    <linearGradient id="pitch" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#16351f"/>
      <stop offset="1" stop-color="#0f2616"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" rx="36" fill="url(#g)"/>

  <!-- Pitch -->
  <rect x="70" y="70" width="1060" height="560" rx="28" fill="url(#pitch)"/>

  <!-- Grass stripes -->
  <g opacity="0.22">
    <rect x="70" y="70" width="1060" height="70" fill="#1d4428"/>
    <rect x="70" y="210" width="1060" height="70" fill="#1d4428"/>
    <rect x="70" y="350" width="1060" height="70" fill="#1d4428"/>
    <rect x="70" y="490" width="1060" height="70" fill="#1d4428"/>
  </g>

  <!-- Field lines -->
  <g fill="none" stroke="#e8fff0" stroke-opacity="0.55" stroke-width="6">
    <rect x="110" y="110" width="980" height="480" rx="18"/>
    <path d="M600 110v480"/>
    <circle cx="600" cy="350" r="120"/>
    <circle cx="600" cy="350" r="8" fill="#e8fff0"/>

    <!-- Penalty boxes -->
    <rect x="110" y="230" width="140" height="240" rx="10"/>
    <rect x="950" y="230" width="140" height="240" rx="10"/>
    <rect x="110" y="280" width="60" height="140" rx="10"/>
    <rect x="1030" y="280" width="60" height="140" rx="10"/>
  </g>

  <!-- Soft vignette -->
  <rect x="70" y="70" width="1060" height="560" rx="28" fill="#000" opacity="0.15"/>

  <!-- Border -->
  <rect x="60" y="60" width="1080" height="580" rx="28" fill="none" stroke="#8eff71" stroke-opacity="0.14" stroke-width="6"/>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  })();

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-[#181a16] shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02]">
      <div className="relative h-56 flex-shrink-0 overflow-hidden">
        <img
          alt={f.imageAlt || 'Field image'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          src={imageUrl}
          loading="lazy"
        />

        <button
          type="button"
          onClick={() => onToggleWishlist(f)}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0d0f0b]/70 backdrop-blur-md transition-transform hover:scale-105"
        >
          <span
            className={`material-symbols-outlined text-[20px] leading-none ${wished ? 'fill-icon text-[#ff4d6d]' : 'text-[#fdfdf6]/90'}`}
          >
            favorite
          </span>
        </button>

        {f.rating ? (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#0d0f0b]/80 px-3 py-1 backdrop-blur-md">
            <span className="material-symbols-outlined fill-icon text-xs text-[#8eff71]">star</span>
            <span className="font-headline text-xs font-bold">{f.rating}</span>
          </div>
        ) : null}

        {f.size ? (
          <div
            className={
              f.sizeTone === 'tertiary'
                ? 'absolute bottom-4 right-4 rounded-lg bg-[#88f6ff] px-3 py-1'
                : 'absolute bottom-4 right-4 rounded-lg bg-[#8eff71] px-3 py-1'
            }
          >
            <span
              className={
                f.sizeTone === 'tertiary'
                  ? 'font-headline text-xs font-black text-[#003f43]'
                  : 'font-headline text-xs font-black text-[#0d6100]'
              }
            >
              {f.size}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="h-16">
          <h3 className="line-clamp-2 font-headline text-xl font-extrabold transition-colors group-hover:text-[#8eff71]">{f.name}</h3>
          {f.address ? (
            <div className="mt-1 flex items-center gap-1 text-[#abaca5]">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="line-clamp-1 text-xs font-medium">{f.address}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <span className="font-headline block text-[10px] font-bold uppercase text-[#88f6ff]">Price per hour</span>
            <span className="font-headline text-2xl font-black tracking-tighter text-[#8eff71]">{f.price}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCompare?.(f)}
              disabled={compareDisabled && !isCompared}
              className={
                isCompared
                  ? 'font-headline rounded-lg border border-[#8eff71]/60 bg-[#8eff71]/20 px-4 py-2 text-xs font-bold text-[#8eff71]'
                  : 'font-headline rounded-lg bg-[#242721] px-4 py-2 text-xs font-bold transition-all hover:bg-[#8eff71] hover:text-[#0d6100] disabled:cursor-not-allowed disabled:opacity-50'
              }
            >
              {isCompared ? 'Compared' : 'Compare'}
            </button>

            <button
              type="button"
              onClick={onViewInList}
              className="font-headline rounded-lg bg-[#242721] px-4 py-2 text-xs font-bold transition-all hover:bg-[#8eff71] hover:text-[#0d6100]"
            >
              View in list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
