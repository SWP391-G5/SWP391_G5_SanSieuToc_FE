import { useNavigate } from 'react-router-dom';

import { useWishlist } from '../../hooks/useWishlist';

import WishlistCard from './components/WishlistCard';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, wishlistIds, toggleWishlist } = useWishlist();

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
          {wishlist.map((f) => (
            <WishlistCard
              key={f.id}
              field={f}
              wished={wishlistIds.has(f.id)}
              onToggleWishlist={toggleWishlist}
              onViewInList={() => navigate('/fields')}
            />
          ))}
        </div>
      )}
    </section>
  );
}
