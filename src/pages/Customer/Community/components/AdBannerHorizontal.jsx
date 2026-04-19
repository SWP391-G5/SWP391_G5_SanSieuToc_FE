import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleImageSlider from '../../../../components/ads/SimpleImageSlider';

export default function AdBannerHorizontal({ banners, copyArray = [] }) {
  const navigate = useNavigate();
  const images = useMemo(() => (banners || []).map((b) => b.imageUrl).filter(Boolean), [banners]);
  const [idx, setIdx] = useState(0);
  
  if (!images.length) return null;
  const currentBanner = banners[idx] || banners[0];
  const currentCopy = copyArray.length > 0 ? copyArray[idx % copyArray.length] : { subtitle: '', cta: '', to: '' };

  return (
    <div className="group relative mb-12 overflow-hidden rounded-xl border border-[#8eff71]/20 bg-[#121410]">
      <div className="absolute inset-0 opacity-50 grayscale transition-all duration-500 group-hover:grayscale-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d0f0b] via-[#0d0f0b]/80 to-transparent" />
        <SimpleImageSlider
          images={images}
          intervalMs={6000}
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover transition-transform duration-[10000ms] group-hover:scale-105"
          onIndexChange={setIdx}
        />
      </div>

      <div className="relative z-20 flex min-h-[12rem] items-center p-8 text-shadow-sm">
        <div className="max-w-xl space-y-3">
          <span className="font-headline inline-block rounded-full bg-[#8eff71]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71] ring-1 ring-[#8eff71]/30">
            Sponsored
          </span>
          <h2 className="font-headline text-2xl font-black leading-tight text-[#fdfdf6]">
            {currentCopy.title || currentBanner?.title || 'Khuyến mãi đặc biệt'}
          </h2>
          <p className="max-w-sm text-sm text-[#abaca5] opacity-90">{currentCopy.subtitle || ''}</p>
          <button
            type="button"
            onClick={() => (currentCopy.to ? navigate(currentCopy.to) : null)}
            className="font-headline mt-2 w-fit rounded-lg bg-[#8eff71] px-6 py-2 text-sm font-black text-[#0d6100] transition-all hover:scale-105"
          >
            {currentCopy.cta || 'Khám phá'}
          </button>
        </div>
      </div>
    </div>
  );
}
