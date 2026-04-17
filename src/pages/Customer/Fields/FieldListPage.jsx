import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useWishlist } from '../../../hooks/useWishlist';
import { FIELDS } from '../../../features/fields';
import { normalizeText } from '../../../utils/normalizeText';
import { parsePriceText } from '../../../utils/price';

import FieldCard from './components/FieldCard';

export default function FieldListPage() {
  const location = useLocation();
  const initialSearchText = typeof location.state?.searchText === 'string' ? location.state.searchText : '';

  const [searchText, setSearchText] = useState(initialSearchText);
  const [sortBy, setSortBy] = useState('topRated');

  const { wishlistIds, toggleWishlist } = useWishlist();

  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedSize, setSelectedSize] = useState(null);
  const [priceMaxK, setPriceMaxK] = useState(1500);
  const [utilities, setUtilities] = useState({
    parking: false,
    lighting: false,
    wifi: false,
    shower: false,
  });

  const clearFilters = () => {
    setSelectedCity('All');
    setSelectedSize(null);
    setPriceMaxK(1500);
    setUtilities({ parking: false, lighting: false, wifi: false, shower: false });
  };

  const displayFields = useMemo(() => {
    const q = normalizeText(searchText);

    const minVnd = 200 * 1000;
    const maxVnd = priceMaxK * 1000;

    const selectedUtilities = Object.entries(utilities)
      .filter(([, v]) => v)
      .map(([k]) => k);

    let list = FIELDS
      .filter((f) => (selectedCity === 'All' ? true : f.city === selectedCity))
      .filter((f) => (selectedSize ? f.sizeKey === selectedSize : true))
      .filter((f) => {
        const p = parsePriceText(f.price);
        return p >= minVnd && p <= maxVnd;
      })
      .filter((f) => {
        if (selectedUtilities.length === 0) return true;
        return selectedUtilities.every((a) => (f.utilities || []).includes(a));
      });

    if (q) {
      list = list.filter((f) => {
        const haystack = `${f.name} ${f.address}`;
        return normalizeText(haystack).includes(q);
      });
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'priceAsc') return parsePriceText(a.price) - parsePriceText(b.price);
      if (sortBy === 'priceDesc') return parsePriceText(b.price) - parsePriceText(a.price);

      // topRated
      const ra = Number(a.rating) || 0;
      const rb = Number(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      return String(a.name).localeCompare(String(b.name));
    });

    return sorted;
  }, [searchText, sortBy, selectedCity, selectedSize, priceMaxK, utilities]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <div className="flex gap-8">
        {/* SideNavBar / Filters */}
        <aside className="sticky top-28 hidden h-[calc(100vh-7rem)] w-64 flex-col gap-6 overflow-auto rounded-xl bg-[#121410] p-6 lg:flex">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-xl font-bold text-[#8eff71]">Filters</h2>
            <p className="text-xs font-medium text-[#abaca5]">Refine your pitch</p>
          </div>

          <div className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                <span className="material-symbols-outlined text-sm">location_on</span>
                Location
              </label>

              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#474944]/20 bg-[#181a16] px-3 py-2 pr-10 text-sm outline-none transition-all focus:border-[#8eff71] focus:ring-1 focus:ring-[#8eff71]"
                >
                  <option value="All">All</option>
                  <option value="TP.HCM">TP.HCM</option>
                  <option value="Ha Noi">Ha Noi</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#abaca5]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                <span className="material-symbols-outlined text-sm">payments</span>
                Price Range
              </label>

              <div className="flex items-center justify-between text-[10px] text-[#88f6ff]">
                <span>200k</span>
                <span>{priceMaxK}k</span>
              </div>

              <input
                className="w-full accent-[#8eff71]"
                type="range"
                min="200"
                max="1500"
                step="50"
                value={priceMaxK}
                onChange={(e) => setPriceMaxK(Number(e.target.value))}
              />
            </div>

            {/* Field Size */}
            <div className="space-y-2">
              <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                <span className="material-symbols-outlined text-sm">grid_view</span>
                Field Size
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSize((s) => (s === '5' ? null : '5'))}
                  className={
                    selectedSize === '5'
                      ? 'font-headline rounded bg-[#8eff71] px-3 py-1 text-[10px] font-bold text-[#0d6100]'
                      : 'font-headline rounded bg-[#242721] px-3 py-1 text-[10px] font-bold text-[#abaca5] transition-colors hover:text-[#fdfdf6]'
                  }
                >
                  5-a-side
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSize((s) => (s === '7' ? null : '7'))}
                  className={
                    selectedSize === '7'
                      ? 'font-headline rounded bg-[#8eff71] px-3 py-1 text-[10px] font-bold text-[#0d6100]'
                      : 'font-headline rounded bg-[#242721] px-3 py-1 text-[10px] font-bold text-[#abaca5] transition-colors hover:text-[#fdfdf6]'
                  }
                >
                  7-a-side
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSize((s) => (s === '11' ? null : '11'))}
                  className={
                    selectedSize === '11'
                      ? 'font-headline rounded bg-[#8eff71] px-3 py-1 text-[10px] font-bold text-[#0d6100]'
                      : 'font-headline rounded bg-[#242721] px-3 py-1 text-[10px] font-bold text-[#abaca5] transition-colors hover:text-[#fdfdf6]'
                  }
                >
                  11-a-side
                </button>
              </div>
            </div>

            {/* Utilities */}
            <div className="space-y-3">
              <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                <span className="material-symbols-outlined text-sm">sports_soccer</span>
                Utilities
              </label>

              <div className="space-y-2">
                {[
                  { key: 'parking', label: 'Parking' },
                  { key: 'lighting', label: 'Lighting' },
                  { key: 'wifi', label: 'WiFi' },
                  { key: 'shower', label: 'Shower' },
                ].map((a) => (
                  <label key={a.key} className="group flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={utilities[a.key]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUtilities((prev) => ({ ...prev, [a.key]: checked }));
                      }}
                      className="h-4 w-4 rounded border-[#474944]/30 bg-[#181a16] text-[#8eff71] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm text-[#abaca5] transition-colors group-hover:text-[#fdfdf6]">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="font-headline w-full rounded-lg border border-[#8eff71]/20 bg-[#242721] py-3 text-sm font-bold text-[#8eff71] transition-all duration-300 hover:bg-[#8eff71] hover:text-[#0d6100]"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 pb-20">
          {/* Ad Banner */}
          <div className="group relative mb-12 flex min-h-[10rem] flex-col justify-center overflow-hidden rounded-xl border border-[#8eff71]/20 bg-gradient-to-r from-[#181a16] via-[#181a16] to-[#8eff71]/20 p-8">
            <div className="z-10 max-w-xl space-y-3">
              <span className="font-headline inline-block rounded-full bg-[#8eff71]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71]">
                Pro Membership
              </span>
              <h2 className="font-headline text-2xl font-black leading-tight">
                Unlock Exclusive Pitch Hours &amp; <span className="italic text-[#8eff71]">20% Discounts</span>
              </h2>
              <p className="max-w-sm text-sm text-[#abaca5]">Elevate your game with priority bookings and professional perks.</p>
              <button type="button" className="font-headline rounded-lg bg-[#8eff71] px-6 py-2 text-sm font-black text-[#0d6100] transition-all hover:scale-105">
                Join The Club
              </button>
            </div>

            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-30 grayscale transition-all duration-500 group-hover:grayscale-0">
              <img
                alt="Promo Athlete"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCctJ_52eUrX1p0jXlKzCC9XybW_cOVNj4RRJlOSWLwHfTILYf03W8VSxaIzjT6ON-hoypfZxO4uTdgSbRZnEDUogpCJ03tHr31mDaVLnfaHfCURdqh5tjGfJr4o_DIiq2VCJzDeoX-D-ZqR04EkO5ASmQb4fgsHmHYzbhmcAiQkdfQ6_J1J7FmLfGAjCnYSlNeyNsCu0f6S6TcpXBLgmjb3dqB52q3nBk2ZteRAHoZyuklVC2yZcW0VAw5E6cSUOeaugrDE2APHg"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mb-8 flex flex-col items-center justify-between gap-6 xl:flex-row">
            <div className="flex w-full items-center gap-4 xl:w-auto">
              <div>
                <h1 className="font-headline whitespace-nowrap text-4xl font-black tracking-tight">
                  Showing {displayFields.length} <span className="italic text-[#8eff71]">Fields</span>
                </h1>
                {searchText.trim() ? (
                  <div className="mt-1 text-xs text-[#abaca5]">
                    Result for: <span className="text-[#fdfdf6]">{searchText}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Search Bar */}
            <div className="group relative w-full max-w-2xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#abaca5] transition-colors group-focus-within:text-[#8eff71]">search</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search fields (name / address)..."
                className="font-headline w-full rounded-xl border border-[#474944]/30 bg-[#121410] py-3 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-[#abaca5]/50 focus:border-[#8eff71] focus:ring-2 focus:ring-[#8eff71]"
              />
              {searchText ? (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#abaca5] transition-colors hover:bg-[#242721] hover:text-[#fdfdf6]"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              ) : null}
            </div>

            {/* Sort (Top Rated / Price) */}
            <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#474944]/30 bg-[#121410] p-1 md:w-auto md:justify-start">
              <button
                type="button"
                onClick={() => setSortBy('topRated')}
                className={
                  sortBy === 'topRated'
                    ? 'font-headline flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8eff71] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0d6100] md:flex-none'
                    : 'font-headline flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider text-[#abaca5] transition-colors hover:text-[#fdfdf6] md:flex-none'
                }
                aria-pressed={sortBy === 'topRated'}
              >
                <span className="material-symbols-outlined fill-icon text-base">star</span>
                Top rated
              </button>

              <button
                type="button"
                onClick={() => setSortBy('priceAsc')}
                className={
                  sortBy === 'priceAsc'
                    ? 'font-headline flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8eff71] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0d6100] md:flex-none'
                    : 'font-headline flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider text-[#abaca5] transition-colors hover:text-[#fdfdf6] md:flex-none'
                }
                aria-pressed={sortBy === 'priceAsc'}
              >
                <span className="material-symbols-outlined text-base">arrow_upward</span>
                Price
              </button>

              <button
                type="button"
                onClick={() => setSortBy('priceDesc')}
                className={
                  sortBy === 'priceDesc'
                    ? 'font-headline flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8eff71] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0d6100] md:flex-none'
                    : 'font-headline flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider text-[#abaca5] transition-colors hover:text-[#fdfdf6] md:flex-none'
                }
                aria-pressed={sortBy === 'priceDesc'}
              >
                <span className="material-symbols-outlined text-base">arrow_downward</span>
                Price
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayFields.length === 0 ? (
              <div className="col-span-full rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
                <div className="font-headline text-xl font-black">No fields found</div>
                <div className="mt-2 text-sm text-[#abaca5]">Try another keyword (partial search works).</div>
              </div>
            ) : (
              displayFields.map((f) => (
                <FieldCard key={f.id} field={f} wished={wishlistIds.has(f.id)} onToggleWishlist={toggleWishlist} />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 py-8">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-[#abaca5] transition-colors hover:bg-[#242721]"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button type="button" className="font-headline flex h-10 w-10 items-center justify-center rounded-lg bg-[#8eff71] text-sm font-bold text-[#0d6100]">
              1
            </button>
            <button
              type="button"
              className="font-headline flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-sm font-bold text-[#abaca5] transition-all hover:border-[#8eff71] hover:text-[#8eff71]"
            >
              2
            </button>
            <button
              type="button"
              className="font-headline flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-sm font-bold text-[#abaca5] transition-all hover:border-[#8eff71] hover:text-[#8eff71]"
            >
              3
            </button>
            <span className="px-2 text-[#abaca5]">...</span>
            <button
              type="button"
              className="font-headline flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-sm font-bold text-[#abaca5] transition-all hover:border-[#8eff71] hover:text-[#8eff71]"
            >
              7
            </button>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-[#abaca5] transition-colors hover:bg-[#242721]"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </section>
      </div>

      {/* FAB */}
      <button
        type="button"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#8eff71] to-[#2ff801] text-[#0d6100] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition-all hover:scale-110"
        aria-label="Open search"
      >
        <span className="material-symbols-outlined font-black">search</span>
      </button>
    </div>
  );
}
