export default function WishlistCard({ field, wished, onToggleWishlist, onViewInList }) {
  const f = field;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-[#181a16] shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02]">
      <div className="relative h-56 flex-shrink-0 overflow-hidden">
        <img
          alt={f.imageAlt || 'Field image'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          src={f.image}
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

        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="font-headline block text-[10px] font-bold uppercase text-[#88f6ff]">Price per hour</span>
            <span className="font-headline text-2xl font-black tracking-tighter text-[#8eff71]">{f.price}</span>
          </div>

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
  );
}
