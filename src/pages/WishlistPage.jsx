import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WISHLIST_KEY = 'sst_wishlist';

function loadWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.id === 'number');
  } catch {
    return [];
  }
}

function saveWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export default function WishlistPage() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState(() => loadWishlist());

  const wishlistIds = useMemo(() => new Set(wishlist.map((x) => x.id)), [wishlist]);

  const toggleWishlist = (field) => {
    setWishlist((prev) => {
      const exists = prev.some((x) => x.id === field.id);
      const next = exists ? prev.filter((x) => x.id !== field.id) : [...prev, field];
      saveWishlist(next);
      return next;
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-headline text-3xl font-black italic text-[#fdfdf6]">Wishlist</h1>
          <p className="mt-2 text-sm text-[#abaca5]">Your saved fields — available for guests too.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/fields')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#242721] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
        >
          Browse fields
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>

      {wishlist.length === 0 ? (
        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
          <div className="font-headline text-xl font-black">Your wishlist is empty</div>
          <div className="mt-2 text-sm text-[#abaca5]">Tap the heart icon on a field to save it here.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((f) => {
            const wished = wishlistIds.has(f.id);

            return (
              <div
                key={f.id}
                className="group flex h-full flex-col overflow-hidden rounded-xl bg-[#181a16] shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative h-56 flex-shrink-0 overflow-hidden">
                  <img
                    alt={f.imageAlt || 'Field image'}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={f.image}
                    loading="lazy"
                  />

                  <button
                    type="button"
                    onClick={() => toggleWishlist(f)}
                    aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={wished}
                    className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0d0f0b]/70 backdrop-blur-md transition-transform hover:scale-105"
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] leading-none ${
                        wished ? 'fill-icon text-[#ff4d6d]' : 'text-[#fdfdf6]/90'
                      }`}
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
                    <h3 className="line-clamp-2 font-headline text-xl font-extrabold transition-colors group-hover:text-[#8eff71]">
                      {f.name}
                    </h3>
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
                      <span className="font-headline text-2xl font-black tracking-tighter text-[#8eff71]">
                        {f.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/fields')}
                      className="font-headline rounded-lg bg-[#242721] px-4 py-2 text-xs font-bold transition-all hover:bg-[#8eff71] hover:text-[#0d6100]"
                    >
                      View in list
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
