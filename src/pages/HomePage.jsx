import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import volleyballImg from '../assets/images/volleyball.jpg';
import { DEFAULT_HOME_HERO_SLIDES } from '../assets/defaultSliders';
import SimpleImageSlider from '../components/ads/SimpleImageSlider';
import { FIELDS } from '../data/fields';
import useBanners from '../hooks/useBanners';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { items: heroBanners } = useBanners({ placement: 'home_hero' });
  const heroSlides = useMemo(() => {
    return (heroBanners || []).map((x) => x?.imageUrl).filter(Boolean);
  }, [heroBanners]);

  useEffect(() => {
    const target = location.state?.scrollTo;
    if (target !== 'field') return;

    requestAnimationFrame(() => {
      const el = document.getElementById(target);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.state]);

  const formatDateInput = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const minDate = formatDateInput(new Date());
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (e) => {
    const v = e.target.value;

    if (!v) {
      setSelectedDate('');
      return;
    }

    if (v < minDate) {
      setSelectedDate(minDate);
      return;
    }

    setSelectedDate(v);
  };

  const [heroSearch, setHeroSearch] = useState('');
  const [heroSearchOpen, setHeroSearchOpen] = useState(false);
  const heroSearchRef = useRef(null);

  const normalizeText = (s) => {
    const v = String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();

    return v;
  };

  const heroSuggestions = useMemo(() => {
    const q = normalizeText(heroSearch);
    if (!q) return [];

    return [...FIELDS]
      .filter((f) => normalizeText(`${f.name} ${f.address}`).includes(q))
      .sort((a, b) => {
        const ra = Number(a.rating) || 0;
        const rb = Number(b.rating) || 0;
        if (rb !== ra) return rb - ra;
        return String(a.name).localeCompare(String(b.name));
      })
      .slice(0, 6);
  }, [heroSearch]);

  useEffect(() => {
    if (!heroSearchOpen) return undefined;

    const onMouseDown = (e) => {
      if (!heroSearchRef.current) return;
      if (heroSearchRef.current.contains(e.target)) return;
      setHeroSearchOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setHeroSearchOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [heroSearchOpen]);

  const goToFields = (q) => {
    const value = String(q ?? '').trim();
    navigate('/fields', value ? { state: { searchText: value } } : undefined);
  };

  const onHeroSubmit = (e) => {
    e.preventDefault();
    goToFields(heroSearch);
  };

  const topRatedFields = useMemo(() => {
    const sorted = [...FIELDS].sort((a, b) => {
      const ra = Number(a.rating) || 0;
      const rb = Number(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      return String(a.name).localeCompare(String(b.name));
    });

    return sorted.slice(0, 3);
  }, []);

  const [largeField, smallField1, smallField2] = topRatedFields;

  const featured = {
    large: {
      tag: largeField?.size || 'Top rated',
      title: largeField?.name || '—',
      address: largeField?.address || '',
      price: largeField?.price || '',
      priceUnit: 'Price per hour',
      image: largeField?.image || footballImg,
      alt: largeField?.imageAlt || 'Field image',
    },
    small1: {
      title: smallField1?.name || '—',
      address: smallField1?.address || '',
      price: smallField1?.price || '',
      image: smallField1?.image || footballImg,
      alt: smallField1?.imageAlt || 'Field image',
    },
    small2: {
      title: smallField2?.name || '—',
      address: smallField2?.address || '',
      price: smallField2?.price || '',
      image: smallField2?.image || footballImg,
      alt: smallField2?.imageAlt || 'Field image',
    },
    medium: {
      badge: 'New Arrival',
      title: 'Ha Noi Medical University Field',
      desc:
        'Newly upgraded turf meeting FIFA Quality Pro standards. Anti-glare lighting makes night matches pop.',
      cta: 'Explore details',
      image: volleyballImg,
      alt: 'Team huddle under stadium lights',
    },
  };

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero Section */}
      <section className="relative flex min-h-[921px] items-center overflow-hidden px-6 md:px-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d0f0b] via-[#0d0f0b]/80 to-transparent" />
          <SimpleImageSlider
            images={heroSlides}
            fallbackImages={DEFAULT_HOME_HERO_SLIDES}
            intervalMs={5000}
            className="absolute inset-0"
            imgClassName="h-full w-full object-cover"
            alt="Football match under stadium lights"
          />
        </div>

        <div className="relative z-20 mx-auto w-full max-w-4xl">
          <span className="mb-4 inline-block font-label text-sm uppercase tracking-[0.3em] text-[#8eff71]">
            Electric Pitch Performance
          </span>
          <h1 className="mb-8 font-headline text-5xl font-black italic tracking-tighter text-[#fdfdf6] md:text-8xl leading-[0.9]">
            BOOK A FIELD <span className="text-[#8eff71]">IN SECONDS</span>,
            <br />
            LIGHT UP YOUR GAME!
          </h1>

          {/* Search Bar */}
          <form
            onSubmit={onHeroSubmit}
            className="flex max-w-3xl flex-col gap-2 rounded-xl bg-[#1e201b] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:flex-row"
          >
            <div ref={heroSearchRef} className="relative flex flex-1">
              <div className="flex w-full items-center gap-3 rounded-lg bg-[#242721] px-4 py-3">
                <span className="material-symbols-outlined text-[#8eff71]">location_on</span>
                <input
                  className="w-full border-none bg-transparent text-[#fdfdf6] placeholder:text-[#abaca5]/50 focus:outline-none"
                  placeholder="Search by area or field name..."
                  type="text"
                  value={heroSearch}
                  onChange={(e) => {
                    setHeroSearch(e.target.value);
                    setHeroSearchOpen(true);
                  }}
                  onFocus={() => setHeroSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setHeroSearchOpen(false);
                    if (e.key === 'Escape') setHeroSearchOpen(false);
                  }}
                  autoComplete="off"
                />

                {heroSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHeroSearch('');
                      setHeroSearchOpen(false);
                    }}
                    className="rounded-lg p-1 text-[#abaca5] transition-colors hover:bg-[#1e201b] hover:text-[#fdfdf6]"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                ) : null}
              </div>

              {heroSearchOpen && heroSearch.trim() ? (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#474944]/30 bg-[#121410] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
                >
                  {heroSuggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#abaca5]">No fields found</div>
                  ) : (
                    heroSuggestions.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="option"
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#181a16]"
                        onClick={() => {
                          setHeroSearch(f.name);
                          setHeroSearchOpen(false);
                          goToFields(f.name);
                        }}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-headline text-sm font-black text-[#fdfdf6]">
                            {f.name}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-[#abaca5]">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span className="truncate">{f.address}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="font-headline text-sm font-black text-[#8eff71]">{f.price}</div>
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#abaca5]">
                            <span className="material-symbols-outlined fill-icon text-xs text-[#8eff71]">
                              star
                            </span>
                            <span>{f.rating}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}

                  {heroSuggestions.length > 0 ? (
                    <button
                      type="button"
                      className="w-full border-t border-[#474944]/30 bg-[#0d0f0b]/20 px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-[#8eff71] hover:bg-[#181a16]"
                      onClick={() => {
                        setHeroSearchOpen(false);
                        goToFields(heroSearch);
                      }}
                    >
                      View all results
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 items-center gap-3 rounded-lg bg-[#242721] px-4 py-3">
              <span className="material-symbols-outlined text-[#8eff71]">calendar_month</span>
              <input
                className="w-full border-none bg-transparent text-[#fdfdf6] focus:outline-none [color-scheme:dark]"
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={handleDateChange}
                onBlur={handleDateChange}
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#8eff71] px-8 py-4 font-black uppercase tracking-widest text-[#0d6100] transition-colors hover:bg-[#2ff801]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="border-y border-[#474944]/10 bg-[#121410] py-16 px-6 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-12 md:grid-cols-4">
          {[
            { value: '500+', label: 'Partner Fields' },
            { value: '120K', label: 'Active Players' },
            { value: '15M', label: 'Bookings Made' },
            { value: '4.9', label: 'Average Rating' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="mb-2 font-headline text-5xl font-black text-[#8eff71]">{s.value}</div>
              <div className="font-label text-xs uppercase tracking-widest text-[#abaca5]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Fields (Asymmetric Bento Grid) */}
      <section id="field" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-24 md:px-8">
        <div className="mb-16 flex items-end justify-between gap-6">
          <div>
            <span className="mb-2 block font-label text-sm uppercase tracking-widest text-[#88f6ff]">
              Top Rated
            </span>
            <h2 className="font-headline text-4xl font-black italic md:text-5xl">FEATURED FIELDS</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/fields')}
            className="flex items-center gap-2 font-label text-sm uppercase tracking-widest text-[#8eff71] transition-all hover:gap-4"
          >
            View all <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Large Feature Card */}
          <div className="group relative overflow-hidden rounded-xl bg-[#181a16] md:col-span-8 min-h-[400px]">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-80"
              src={featured.large.image}
              alt={featured.large.alt}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181a16] via-transparent to-transparent" />
            <div className="absolute bottom-0 w-full p-8">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <span className="mb-3 inline-block rounded-sm bg-[#8eff71] px-2 py-1 text-[10px] font-black uppercase text-[#0d6100]">
                    {featured.large.tag}
                  </span>
                  <h3 className="mb-2 font-headline text-3xl font-bold md:text-4xl">{featured.large.title}</h3>
                  <p className="flex items-center gap-2 text-[#abaca5]">
                    <span className="material-symbols-outlined text-sm text-[#8eff71]">location_on</span>
                    {featured.large.address}
                  </p>
                </div>

                <div className="text-right">
                  <div className="font-headline text-2xl font-black text-[#88f6ff]">{featured.large.price}</div>
                  <div className="text-[10px] uppercase tracking-tighter text-[#abaca5]">
                    {featured.large.priceUnit}
                  </div>
                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-[#fdfdf6] px-6 py-3 text-xs font-black uppercase text-[#0d0f0b] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
                  >
                    Book now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Card */}
          <div className="group flex flex-col overflow-hidden rounded-xl bg-[#181a16] md:col-span-4">
            <div className="relative h-48 overflow-hidden">
              <img
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                src={featured.small1.image}
                alt={featured.small1.alt}
                loading="lazy"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h3 className="mb-1 font-headline text-xl font-bold">{featured.small1.title}</h3>
                <p className="mb-4 text-sm text-[#abaca5]">{featured.small1.address}</p>
              </div>
              <div className="flex items-center justify-between border-t border-[#474944]/20 pt-4">
                <span className="font-headline font-bold text-[#8eff71]">{featured.small1.price}</span>
                <button
                  type="button"
                  className="material-symbols-outlined rounded-lg bg-[#242721] p-2 transition-colors hover:text-[#8eff71]"
                  aria-label="Add to cart"
                >
                  add_shopping_cart
                </button>
              </div>
            </div>
          </div>

          {/* Another Secondary Card */}
          <div className="group flex flex-col overflow-hidden rounded-xl bg-[#181a16] md:col-span-4">
            <div className="relative h-48 overflow-hidden">
              <img
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                src={featured.small2.image}
                alt={featured.small2.alt}
                loading="lazy"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h3 className="mb-1 font-headline text-xl font-bold">{featured.small2.title}</h3>
                <p className="mb-4 text-sm text-[#abaca5]">{featured.small2.address}</p>
              </div>
              <div className="flex items-center justify-between border-t border-[#474944]/20 pt-4">
                <span className="font-headline font-bold text-[#8eff71]">{featured.small2.price}</span>
                <button
                  type="button"
                  className="material-symbols-outlined rounded-lg bg-[#242721] p-2 transition-colors hover:text-[#8eff71]"
                  aria-label="Add to cart"
                >
                  add_shopping_cart
                </button>
              </div>
            </div>
          </div>

          {/* Medium Feature Card */}
          <div className="group relative overflow-hidden rounded-xl bg-[#121410] md:col-span-8 min-h-[300px]">
            <div className="grid h-full grid-cols-1 md:grid-cols-2">
              <div className="relative overflow-hidden">
                <img
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={featured.medium.image}
                  alt={featured.medium.alt}
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col justify-center p-8">
                <span className="mb-2 font-label text-[10px] uppercase tracking-widest text-[#88f6ff]">
                  {featured.medium.badge}
                </span>
                <h3 className="mb-4 font-headline text-3xl font-bold">{featured.medium.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#abaca5]">{featured.medium.desc}</p>
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#242721] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
                >
                  {featured.medium.cta}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Players & Owners */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="rounded-2xl bg-[#121410] p-10">
            <h3 className="mb-6 font-headline text-3xl font-black italic">For Players</h3>
            <ul className="space-y-4 text-[#abaca5]">
              {[
                'Search and compare fields near you',
                'Instant booking confirmation',
                'Trusted reviews and transparent pricing',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#8eff71]">check_circle</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#121410] p-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#242721] px-3 py-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8eff71]">PRO</span>
              <span className="text-xs text-[#abaca5]">For Owners</span>
            </div>
            <h3 className="mb-6 font-headline text-3xl font-black italic">Grow your venue</h3>
            <ul className="space-y-4 text-[#abaca5]">
              {[
                'Manage slots, pricing, and availability',
                'Automated notifications and reminders',
                'Performance insights and revenue tracking',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#88f6ff]">done_all</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="mt-8 rounded-lg bg-[#8eff71] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#0d6100] transition-colors hover:bg-[#2ff801]"
            >
              Start now
            </button>
          </div>
        </div>
      </section>

      {/* Manager Promo */}
      <section className="border-y border-[#474944]/10 bg-[#121410] px-6 py-24 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <span className="mb-2 block font-label text-sm uppercase tracking-widest text-[#8eff71]">
              Stadium Manager
            </span>
            <h3 className="mb-6 font-headline text-4xl font-black italic">Operate smarter</h3>
            <p className="mb-8 text-[#abaca5]">
              A dashboard built for owners: bookings, customers, pricing, and insights—one place.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { k: '+40%', v: 'Revenue' },
                { k: '-80%', v: 'Ops time' },
                { k: '100%', v: 'Secure' },
              ].map((m) => (
                <div key={m.v} className="rounded-xl bg-[#181a16] p-5">
                  <div className="font-headline text-3xl font-black text-[#88f6ff]">{m.k}</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-[#abaca5]">{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#181a16] p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm uppercase tracking-widest text-[#abaca5]">Preview</div>
              <span className="rounded-full bg-[#242721] px-3 py-1 text-xs text-[#8eff71]">Dashboard</span>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Today bookings', value: '28' },
                { label: 'Pending payments', value: '5' },
                { label: 'Active promotions', value: '2' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between rounded-xl bg-[#242721] px-5 py-4">
                  <div className="text-sm text-[#abaca5]">{r.label}</div>
                  <div className="font-headline text-xl font-black text-[#fdfdf6]">{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#474944]/20 bg-[#0d0f0b]/80 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          {[
            { icon: 'search', label: 'Find', active: true },
            { icon: 'event', label: 'Bookings' },
            { icon: 'dashboard', label: 'Manager' },
            { icon: 'person', label: 'Profile' },
          ].map((i) => (
            <button
              key={i.label}
              type="button"
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs ${
                i.active ? 'text-[#8eff71]' : 'text-[#fdfdf6]/70'
              }`}
            >
              <span className="material-symbols-outlined">{i.icon}</span>
              <span className="font-label uppercase tracking-widest">{i.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
