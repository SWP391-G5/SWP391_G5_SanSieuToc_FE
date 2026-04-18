import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_FIELDS_LIST_ADS_SLIDES } from '../../../assets/defaultSliders';
import SimpleImageSlider from '../../../components/ads/SimpleImageSlider';
import Pagination from '../../../components/common/Pagination';
import useBanners from '../../../hooks/useBanners';

import { FIELD_LIST_ADS_COPY } from '../../../data/ads/fieldListAdsCopy';
import { useWishlist } from '../../../hooks/useWishlist';
import useFields from '../../../hooks/useFields';

import FieldCard from './components/FieldCard';

function cleanAddressPart(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/^[,\s.-]+|[,\s.-]+$/g, '')
    .trim();
}

function inferStreetFromField(field) {
  const direct = cleanAddressPart(field?.street);
  if (direct) return direct;

  const rawAddress = String(field?.address || '').trim();
  if (!rawAddress) return '';

  const firstPart = cleanAddressPart(rawAddress.split(',')[0] || '');
  if (!firstPart) return '';

  const alreadyStreetLike = /^(?:duong|đường|street|thon|thôn|xom|xóm|ap|ấp|to|tổ|ngo|ngõ|hem|hẻm)\b/iu.test(firstPart);
  if (alreadyStreetLike) return firstPart;

  const withoutHouseNumber = cleanAddressPart(firstPart.replace(/^(?:so\s*)?\d+[\p{L}\p{N}/.-]*\s+/iu, ''));
  return withoutHouseNumber || firstPart;
}

export default function FieldListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSearchText = typeof location.state?.searchText === 'string' ? location.state.searchText : '';

  // Ads banner (text is hard-coded; manager only changes images)
  const ADS_SLIDE_COUNT = 6;

  const { items: adsBanners } = useBanners({ placement: 'fields_list_ads' });
  const adsSlides = useMemo(() => {
    return (adsBanners || [])
      .map((x) => x?.imageUrl)
      .filter(Boolean)
      .slice(0, ADS_SLIDE_COUNT);
  }, [adsBanners]);

  const adsFallbackSlides = useMemo(() => {
    return (DEFAULT_FIELDS_LIST_ADS_SLIDES || []).slice(0, ADS_SLIDE_COUNT);
  }, []);

  const adsCopy = useMemo(() => {
    return (FIELD_LIST_ADS_COPY || []).slice(0, ADS_SLIDE_COUNT);
  }, []);

  const [adsIndex, setAdsIndex] = useState(0);

  const activeAdsCopy = useMemo(() => {
    const list = Array.isArray(adsSlides) && adsSlides.length ? adsSlides : adsFallbackSlides;
    const len = list.length || ADS_SLIDE_COUNT;
    const idx = len ? ((adsIndex % len) + len) % len : 0;
    return adsCopy[idx] || adsCopy[0];
  }, [adsCopy, adsFallbackSlides, adsIndex, adsSlides]);

  const [searchText, setSearchText] = useState(initialSearchText);
  const [sortBy, setSortBy] = useState('topRated');

  const { wishlistIds, toggleWishlist } = useWishlist();
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedStreet, setSelectedStreet] = useState('All');
  const [selectedSize, setSelectedSize] = useState(null);
  const [priceMaxK, setPriceMaxK] = useState(350);
  const [utilities, setUtilities] = useState({
    parking: false,
    lighting: false,
    wifi: false,
    shower: false,
  });

  const fieldsParams = useMemo(() => {
    const selectedUtilities = Object.entries(utilities)
      .filter(([, v]) => v)
      .map(([k]) => k);

    return {
      q: searchText.trim() || undefined,
      city: selectedCity === 'All' ? undefined : selectedCity,
      district: selectedCity === 'All' || selectedDistrict === 'All' ? undefined : selectedDistrict,
      street: selectedCity === 'All' || selectedDistrict === 'All' || selectedStreet === 'All' ? undefined : selectedStreet,
      sizeKey: selectedSize || undefined,
      priceMin: 0,
      priceMax: priceMaxK * 1000,
      utilities: selectedUtilities.length ? selectedUtilities.join(',') : undefined,
      sortBy,
    };
  }, [priceMaxK, searchText, selectedCity, selectedDistrict, selectedSize, selectedStreet, sortBy, utilities]);

  const { loading: fieldsLoading, error: fieldsError, items: fields } = useFields(fieldsParams);

  const areaParams = useMemo(
    () => ({
      city: selectedCity === 'All' ? undefined : selectedCity,
    }),
    [selectedCity]
  );

  const { items: areaFields } = useFields(areaParams);

  const districtOptions = useMemo(() => {
    if (selectedCity === 'All') return [];

    const source = Array.isArray(areaFields) ? areaFields : [];
    const set = new Set(
      source
        .map((f) => String(f?.district || '').trim())
        .filter(Boolean)
    );

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [areaFields, selectedCity]);

  const streetOptions = useMemo(() => {
    if (selectedCity === 'All' || selectedDistrict === 'All') return [];

    const source = Array.isArray(areaFields) ? areaFields : [];
    const set = new Set(
      source
        .filter((f) => String(f?.district || '').trim() === selectedDistrict)
        .map((f) => inferStreetFromField(f))
        .filter(Boolean)
    );

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [areaFields, selectedCity, selectedDistrict]);

  const clearFilters = () => {
    setSelectedCity('All');
    setSelectedDistrict('All');
    setSelectedStreet('All');
    setSelectedSize(null);
    setPriceMaxK(350);
    setUtilities({ parking: false, lighting: false, wifi: false, shower: false });
  };

  const displayFields = useMemo(() => {
    return Array.isArray(fields) ? fields : [];
  }, [fields]);

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    const total = displayFields.length;
    return total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  }, [displayFields.length]);

  const effectivePage = useMemo(() => {
    const p = Number(page) || 1;
    return Math.min(totalPages, Math.max(1, p));
  }, [page, totalPages]);

  const pagedFields = useMemo(() => {
    const start = (effectivePage - 1) * PAGE_SIZE;
    return displayFields.slice(start, start + PAGE_SIZE);
  }, [displayFields, effectivePage]);

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
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedDistrict('All');
                    setSelectedStreet('All');
                    setPage(1);
                  }}
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

            {/* District */}
            <div className="space-y-2">
              <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                <span className="material-symbols-outlined text-sm">map</span>
                District
              </label>

              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedStreet('All');
                    setPage(1);
                  }}
                  disabled={selectedCity === 'All' || districtOptions.length === 0}
                  className="w-full appearance-none rounded-lg border border-[#474944]/20 bg-[#181a16] px-3 py-2 pr-10 text-sm outline-none transition-all focus:border-[#8eff71] focus:ring-1 focus:ring-[#8eff71] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="All">
                    {selectedCity === 'All' ? 'Choose city first' : 'All districts'}
                  </option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#abaca5]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Street */}
            <div className="space-y-2">
              <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                <span className="material-symbols-outlined text-sm">place</span>
                Street
              </label>

              <div className="relative">
                <select
                  value={selectedStreet}
                  onChange={(e) => {
                    setSelectedStreet(e.target.value);
                    setPage(1);
                  }}
                  disabled={selectedCity === 'All' || selectedDistrict === 'All'}
                  className="w-full appearance-none rounded-lg border border-[#474944]/20 bg-[#181a16] px-3 py-2 pr-10 text-sm outline-none transition-all focus:border-[#8eff71] focus:ring-1 focus:ring-[#8eff71] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="All">
                    {selectedCity === 'All'
                      ? 'Choose city first'
                      : selectedDistrict === 'All'
                        ? 'Choose district first'
                        : streetOptions.length
                          ? 'All streets'
                          : 'No street data in database'}
                  </option>
                  {streetOptions.map((street) => (
                    <option key={street} value={street}>
                      {street}
                    </option>
                  ))}
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
                <span>0k</span>
                <span>{priceMaxK}k</span>
              </div>

              <input
                className="w-full accent-[#8eff71]"
                type="range"
                min="0"
                max="350"
                step="10"
                value={priceMaxK}
                onChange={(e) => {
                  setPriceMaxK(Number(e.target.value));
                  setPage(1);
                }}
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
                  onClick={() => {
                    setSelectedSize((s) => (s === '5' ? null : '5'));
                    setPage(1);
                  }}
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
                  onClick={() => {
                    setSelectedSize((s) => (s === '7' ? null : '7'));
                    setPage(1);
                  }}
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
                  onClick={() => {
                    setSelectedSize((s) => (s === '11' ? null : '11'));
                    setPage(1);
                  }}
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
                        setPage(1);
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
              onClick={() => {
                clearFilters();
                setPage(1);
              }}
              className="font-headline w-full rounded-lg border border-[#8eff71]/20 bg-[#242721] py-3 text-sm font-bold text-[#8eff71] transition-all duration-300 hover:bg-[#8eff71] hover:text-[#0d6100]"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 pb-20">
          {/* Ad Banner */}
          <div className="group relative mb-12 overflow-hidden rounded-xl border border-[#8eff71]/20 bg-[#121410]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d0f0b] via-[#0d0f0b]/75 to-transparent" />
              <SimpleImageSlider
                images={adsSlides}
                fallbackImages={adsFallbackSlides}
                intervalMs={5000}
                className="absolute inset-0"
                imgClassName="h-full w-full object-cover"
                alt="Field list ad slider"
                onIndexChange={setAdsIndex}
              />
            </div>

            <div className="relative z-20 flex min-h-[12rem] items-center p-8">
              <div className="max-w-xl space-y-3">
                <span className="font-headline inline-block rounded-full bg-[#8eff71]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71]">
                  {activeAdsCopy?.badge}
                </span>

                <h2 className="font-headline text-2xl font-black leading-tight text-[#fdfdf6]">
                  {activeAdsCopy?.title}{' '}
                  <span className="italic text-[#8eff71]">{activeAdsCopy?.highlight}</span>
                </h2>

                <p className="max-w-sm text-sm text-[#abaca5]">{activeAdsCopy?.desc}</p>

                <button
                  type="button"
                  onClick={() => {
                    if (activeAdsCopy?.to) navigate(activeAdsCopy.to);
                  }}
                  className="font-headline rounded-lg bg-[#8eff71] px-6 py-2 text-sm font-black text-[#0d6100] transition-all hover:scale-105"
                >
                  {activeAdsCopy?.cta}
                </button>
              </div>
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
            <div className="group relative w-full xl:max-w-2xl xl:flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#abaca5] transition-colors group-focus-within:text-[#8eff71]">search</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by field name"
                className="font-headline w-full rounded-xl border border-[#474944]/30 bg-[#121410] py-3 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-[#abaca5]/50 focus:border-[#8eff71] focus:ring-2 focus:ring-[#8eff71]"
              />
              {searchText ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#abaca5] transition-colors hover:bg-[#242721] hover:text-[#fdfdf6]"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              ) : null}
            </div>

            {/* Sort (Top Rated / Price) */}
            <div className="w-full overflow-x-auto xl:w-auto xl:overflow-visible xl:shrink-0">
              <div className="flex min-w-max items-center gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('topRated');
                    setPage(1);
                  }}
                  className={
                    sortBy === 'topRated'
                      ? 'font-headline flex min-w-[8.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#8eff71] bg-[#8eff71] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0d6100]'
                      : 'font-headline flex min-w-[8.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#474944]/30 bg-[#121410] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#abaca5] transition-colors hover:text-[#fdfdf6]'
                  }
                  aria-pressed={sortBy === 'topRated'}
                >
                  <span className="material-symbols-outlined fill-icon text-base">star</span>
                  Top rated
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy('priceAsc');
                    setPage(1);
                  }}
                  className={
                    sortBy === 'priceAsc'
                      ? 'font-headline flex min-w-[8.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#8eff71] bg-[#8eff71] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0d6100]'
                      : 'font-headline flex min-w-[8.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#474944]/30 bg-[#121410] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#abaca5] transition-colors hover:text-[#fdfdf6]'
                  }
                  aria-pressed={sortBy === 'priceAsc'}
                >
                  <span className="material-symbols-outlined text-base">arrow_upward</span>
                  Price up
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy('priceDesc');
                    setPage(1);
                  }}
                  className={
                    sortBy === 'priceDesc'
                      ? 'font-headline flex min-w-[8.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#8eff71] bg-[#8eff71] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0d6100]'
                      : 'font-headline flex min-w-[8.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#474944]/30 bg-[#121410] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#abaca5] transition-colors hover:text-[#fdfdf6]'
                  }
                  aria-pressed={sortBy === 'priceDesc'}
                >
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                  Price down
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {fieldsError ? (
              <div className="col-span-full rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
                <div className="font-headline text-xl font-black">Failed to load fields</div>
                <div className="mt-2 text-sm text-[#abaca5]">{fieldsError}</div>
              </div>
            ) : fieldsLoading ? (
              <div className="col-span-full rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
                <div className="font-headline text-xl font-black">Loading fields...</div>
                <div className="mt-2 text-sm text-[#abaca5]">Please wait a moment.</div>
              </div>
            ) : displayFields.length === 0 ? (
              <div className="col-span-full rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
                <div className="font-headline text-xl font-black">No fields found</div>
                <div className="mt-2 text-sm text-[#abaca5]">Try another keyword (partial search works).</div>
              </div>
            ) : (
              pagedFields.map((f) => (
                <FieldCard key={f.id} field={f} wished={wishlistIds.has(f.id)} onToggleWishlist={toggleWishlist} />
              ))
            )}
          </div>

          {/* Pagination */}
          <Pagination page={effectivePage} totalPages={totalPages} onPageChange={setPage} />
        </section>
      </div>
    </div>
  );
}
