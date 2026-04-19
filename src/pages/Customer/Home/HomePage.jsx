import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import footballImg from '../../../assets/images/football.jpg';
import volleyballImg from '../../../assets/images/volleyball.jpg';
import useFields from '../../../hooks/useFields';
import publicApi from '../../../services/public/publicApi';

import FeaturedFieldsSection from './components/FeaturedFieldsSection';
import HeroSection from './components/HeroSection';

import useCustomerBanners from '../../../hooks/useCustomerBanners';
import { HOME_INTRO_COPY, HOME_FEATURE_POOL } from '../../../data/ads/homeAdsCopy';
import { getRandomAdsFromPool } from '../../../utils/adUtils';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { banners: homeBanners } = useCustomerBanners('home_hero');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Consolidated randomized hero ads: Intro fixed + Randomized features
  const heroAdsArray = useMemo(() => {
    // Pick 4 additional features to mix with 2 intro slides = 6 max slides
    const features = getRandomAdsFromPool(HOME_FEATURE_POOL, 4);
    return [...HOME_INTRO_COPY, ...features];
  }, []);

  useEffect(() => {
    if (!homeBanners?.length) return;
    const t = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % homeBanners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [homeBanners]);

  const activeHeroImage = homeBanners[currentSlide]?.imageUrl || footballImg;
  const activeCopy = heroAdsArray[currentSlide % heroAdsArray.length];

  useEffect(() => {
    const target = location.state?.scrollTo;
    if (target !== 'field') return;

    requestAnimationFrame(() => {
      const el = document.getElementById(target);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location]);

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

  // Dynamic suggestions from database instead of static FIELDS
  const [dbSuggestions, setDbSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const query = heroSearch.trim();
    if (!query || !heroSearchOpen) {
      setDbSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await publicApi.getFields({ q: query });
        const items = Array.isArray(data?.items) ? data.items : [];
        setDbSuggestions(items.slice(0, 6)); // limit to 6
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [heroSearch, heroSearchOpen]);

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
    navigate('/fields', { 
      state: { 
        searchText: value,
        searchDate: selectedDate || undefined
      } 
    });
  };

  const submitHeroSearch = () => {
    setHeroSearchOpen(false);
    goToFields(heroSearch);
  };

  const onHeroSubmit = (e) => {
    e.preventDefault();
    submitHeroSearch();
  };

  const featuredFieldsParams = useMemo(
    () => ({
      priceMin: 0,
      priceMax: 5000000,
      sortBy: 'topRated',
    }),
    []
  );

  const { items: featuredFields } = useFields(featuredFieldsParams);
  const topRatedFields = useMemo(() => {
    return Array.isArray(featuredFields) ? featuredFields.slice(0, 3) : [];
  }, [featuredFields]);

  const [largeField, smallField1, smallField2] = topRatedFields;

  const featured = {
    large: {
      tag: largeField?.size || 'Đánh giá cao',
      title: largeField?.name || '—',
      address: largeField?.address || '',
      price: largeField?.price || '',
      priceUnit: 'Giá mỗi giờ',
      image: largeField?.image || footballImg,
      alt: largeField?.imageAlt || 'Hình ảnh sân',
    },
    small1: {
      title: smallField1?.name || '—',
      address: smallField1?.address || '',
      price: smallField1?.price || '',
      image: smallField1?.image || footballImg,
      alt: smallField1?.imageAlt || 'Hình ảnh sân',
    },
    small2: {
      title: smallField2?.name || '—',
      address: smallField2?.address || '',
      price: smallField2?.price || '',
      image: smallField2?.image || footballImg,
      alt: smallField2?.imageAlt || 'Hình ảnh sân',
    },
    medium: {
      badge: 'Mới ra mắt',
      title: 'Sân Đại học Y Hà Nội',
      desc: 'Mặt cỏ mới nâng cấp đạt chuẩn FIFA Quality Pro. Hệ thống đèn chống chói giúp trận ban đêm nổi bật.',
      cta: 'Xem chi tiết',
      image: volleyballImg,
      alt: 'Cả đội tụ họp dưới ánh đèn',
    },
  };

  return (
    <div className="pb-24 md:pb-0">
      <HeroSection
        backgroundImageSrc={activeHeroImage}
        activeCopy={activeCopy}
        heroSearchRef={heroSearchRef}
        minDate={minDate}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        heroSearch={heroSearch}
        onHeroSearchChange={setHeroSearch}
        heroSearchOpen={heroSearchOpen}
        onHeroSearchOpen={() => setHeroSearchOpen(true)}
        onHeroSearchClose={() => setHeroSearchOpen(false)}
        heroSuggestions={dbSuggestions}
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
            { value: '500+', label: 'Sân đối tác' },
            { value: '120K', label: 'Người chơi hoạt động' },
            { value: '15M', label: 'Lượt đặt sân' },
            { value: '4.9', label: 'Đánh giá trung bình' },
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
            <h3 className="mb-6 font-headline text-3xl font-black italic">Dành cho người chơi</h3>
            <ul className="space-y-4 text-[#abaca5]">
              {[
                'Tìm kiếm và so sánh sân gần bạn',
                'Xác nhận đặt sân nhanh chóng',
                'Đánh giá tin cậy và giá minh bạch',
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
              <span className="text-xs text-[#abaca5]">Dành cho chủ sân</span>
            </div>
            <h3 className="mb-6 font-headline text-3xl font-black italic">Phát triển sân của bạn</h3>
            <ul className="space-y-4 text-[#abaca5]">
              {[
                'Quản lý khung giờ, giá và tình trạng',
                'Thông báo và nhắc nhở tự động',
                'Thống kê hiệu suất và theo dõi doanh thu',
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
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </section>

      {/* Manager Promo */}
      <section className="border-y border-[#474944]/10 bg-[#121410] px-6 py-24 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <span className="mb-2 block font-label text-sm uppercase tracking-widest text-[#8eff71]">Quản lý sân</span>
            <h3 className="mb-6 font-headline text-4xl font-black italic">Vận hành thông minh hơn</h3>
            <p className="mb-8 text-[#abaca5]">
              Bảng điều khiển dành cho chủ sân: đặt sân, khách hàng, giá và thống kê — gói gọn một nơi.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { k: '+40%', v: 'Doanh thu' },
                { k: '-80%', v: 'Thời gian vận hành' },
                { k: '100%', v: 'An toàn' },
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
              <div className="text-sm uppercase tracking-widest text-[#abaca5]">Xem trước</div>
              <span className="rounded-full bg-[#242721] px-3 py-1 text-xs text-[#8eff71]">Bảng điều khiển</span>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Đặt sân hôm nay', value: '28' },
                { label: 'Chờ thanh toán', value: '5' },
                { label: 'Khuyến mãi đang hoạt động', value: '2' },
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
            { icon: 'search', label: 'Tìm kiếm', active: true },
            { icon: 'event', label: 'Đặt sân' },
            { icon: 'dashboard', label: 'Quản lý' },
            { icon: 'person', label: 'Hồ sơ' },
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
