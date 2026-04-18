import { useMemo, useState } from 'react';

import AdBannerHorizontal from './components/AdBannerHorizontal';
import AdBannerVertical from './components/AdBannerVertical';
import CommunityCard from './components/CommunityCard';

import { COMMUNITY_ITEMS } from './communityItems';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function CommunityPage() {
  const itemsPerPage = 6; // 2 columns x 3 rows
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(COMMUNITY_ITEMS.length / itemsPerPage));
  const safePage = clamp(page, 1, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return COMMUNITY_ITEMS.slice(start, start + itemsPerPage);
  }, [itemsPerPage, safePage]);

  const goPage = (next) => setPage(clamp(next, 1, totalPages));

  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <div className="flex gap-8">
        {/* Left vertical ad */}
        <aside className="sticky top-28 hidden h-[calc(100vh-7rem)] w-64 flex-col gap-6 overflow-auto lg:flex">
          <AdBannerVertical
            title="Giảm 20% giờ vàng"
            subtitle="Voucher áp dụng cho sân top-rated (số lượng có hạn)."
          />
        </aside>

        {/* Main */}
        <section className="flex-1 pb-20">
          {/* Top horizontal ad */}
          <AdBannerHorizontal
            title="Đặt sân nhanh, nhận ưu đãi"
            subtitle="Quảng cáo: ưu đãi theo khung giờ — xem ngay để không bỏ lỡ."
            cta="Xem ưu đãi"
          />

          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tight">
                Community <span className="italic text-[#8eff71]">Hub</span>
              </h1>
              <div className="mt-2 text-sm text-[#abaca5]">Bài viết / kèo đá / review từ cộng đồng.</div>
            </div>
          </div>

          {/* Grid 2x3 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {pageItems.map((item) => (
              <CommunityCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goPage(safePage - 1)}
              disabled={safePage <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-[#abaca5] transition-colors hover:bg-[#242721] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {pages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goPage(p)}
                className={
                  p === safePage
                    ? 'font-headline flex h-10 w-10 items-center justify-center rounded-lg bg-[#8eff71] text-sm font-bold text-[#0d6100]'
                    : 'font-headline flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-sm font-bold text-[#abaca5] transition-all hover:border-[#8eff71] hover:text-[#8eff71]'
                }
                aria-current={p === safePage ? 'page' : undefined}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-[#abaca5] transition-colors hover:bg-[#242721] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
