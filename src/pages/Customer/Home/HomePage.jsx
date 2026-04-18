import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import footballImg from '../../../assets/images/football.jpg';
import volleyballImg from '../../../assets/images/volleyball.jpg';
import { FIELDS, getFieldSuggestions, getTopRatedFields } from '../../../features/fields';

import FeaturedFieldsSection from './components/FeaturedFieldsSection';
import HeroSection from './components/HeroSection';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const heroSuggestions = useMemo(() => getFieldSuggestions(FIELDS, heroSearch, 6), [heroSearch]);

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

  const submitHeroSearch = () => {
    setHeroSearchOpen(false);
    goToFields(heroSearch);
  };

  const onHeroSubmit = (e) => {
    e.preventDefault();
    submitHeroSearch();
  };

  const topRatedFields = useMemo(() => getTopRatedFields(FIELDS, 3), []);
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
      desc: 'Newly upgraded turf meeting FIFA Quality Pro standards. Anti-glare lighting makes night matches pop.',
      cta: 'Explore details',
      image: volleyballImg,
      alt: 'Team huddle under stadium lights',
    },
  };

  return (
    <div className="pb-24 md:pb-0">
      <HeroSection
        backgroundImageSrc={footballImg}
        heroSearchRef={heroSearchRef}
        minDate={minDate}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        heroSearch={heroSearch}
        onHeroSearchChange={setHeroSearch}
        heroSearchOpen={heroSearchOpen}
        onHeroSearchOpen={() => setHeroSearchOpen(true)}
        onHeroSearchClose={() => setHeroSearchOpen(false)}
        heroSuggestions={heroSuggestions}
        onPickSuggestion={(f) => {
          setHeroSearch(f.name);
          setHeroSearchOpen(false);
          goToFields(f.name);
        }}
        onFormSubmit={onHeroSubmit}
        onViewAllResults={submitHeroSearch}
      />

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
              <div className="font-label text-xs uppercase tracking-widest text-[#abaca5]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <FeaturedFieldsSection featured={featured} onViewAll={() => navigate('/fields')} />

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
            <span className="mb-2 block font-label text-sm uppercase tracking-widest text-[#8eff71]">Stadium Manager</span>
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
