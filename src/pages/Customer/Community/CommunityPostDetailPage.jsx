import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { COMMUNITY_ITEMS } from './communityItems';

export default function CommunityPostDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const fromStateItem = location.state?.item;
  const numericId = Number(id);

  const item = useMemo(() => {
    if (fromStateItem && String(fromStateItem.id) === String(id)) return fromStateItem;
    if (Number.isFinite(numericId)) return (COMMUNITY_ITEMS || []).find((x) => x.id === numericId);
    return undefined;
  }, [fromStateItem, id, numericId]);

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
        <button
          type="button"
          onClick={() => navigate('/community')}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#abaca5] transition-colors hover:text-[#8eff71]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Community
        </button>

        <div className="mt-8 rounded-xl border border-[#474944]/20 bg-[#121410] p-6">
          <h1 className="font-headline text-2xl font-black text-[#fdfdf6]">Bài viết không tồn tại</h1>
          <p className="mt-2 text-sm text-[#abaca5]">Bài viết này có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#abaca5] transition-colors hover:text-[#8eff71]"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Back
      </button>

      <article className="mt-6 overflow-hidden rounded-xl border border-[#474944]/20 bg-[#121410]">
        <div className="relative h-64 overflow-hidden md:h-80">
          <img alt={item.imageAlt} src={item.image} className="h-full w-full object-cover" loading="lazy" />

          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-[#0d0f0b]/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71] backdrop-blur-md">
            <span className="material-symbols-outlined text-sm">forum</span>
            {item.tag}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="font-headline text-3xl font-black tracking-tight text-[#fdfdf6] md:text-4xl">{item.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#abaca5]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">account_circle</span>
              <span className="font-medium text-[#fdfdf6]/80">{item.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">schedule</span>
              <span>{item.time}</span>
            </div>
          </div>

          <div className="mt-6 whitespace-pre-line text-sm leading-7 text-[#abaca5]">{item.content || item.excerpt}</div>
        </div>
      </article>
    </div>
  );
}
