import { useEffect, useMemo, useState } from 'react';

import AdBannerHorizontal from './components/AdBannerHorizontal';
import AdBannerVertical from './components/AdBannerVertical';
import CommunityCard from './components/CommunityCard';

import { adaptPostToCommunityItem } from './communityApiAdapter';
import publicApi from '../../../services/public/publicApi';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function CommunityPage() {
  const itemsPerPage = 6; // 2 columns x 3 rows
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await publicApi.getPosts({ page: safePage, limit: itemsPerPage });
        if (!alive) return;

        const list = Array.isArray(data?.items) ? data.items : [];
        const total = Number(data?.pagination?.total) || list.length;
        const nextTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));

        setItems(list.map(adaptPostToCommunityItem));
        setTotalPages(nextTotalPages);

        if (safePage > nextTotalPages) {
          setPage(nextTotalPages);
        }
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || 'Không tải được bài viết cộng đồng.');
        setItems([]);
        setTotalPages(1);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [itemsPerPage, safePage]);

  const pageItems = useMemo(() => items, [items]);

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
          {error ? (
            <div className="rounded-xl border border-[#474944]/20 bg-[#121410] p-10 text-center">
              <div className="font-headline text-xl font-black">Không tải được Community</div>
              <div className="mt-2 text-sm text-[#abaca5]">{error}</div>
            </div>
          ) : loading ? (
            <div className="rounded-xl border border-[#474944]/20 bg-[#121410] p-10 text-center">
              <div className="font-headline text-xl font-black">Đang tải bài viết...</div>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-xl border border-[#474944]/20 bg-[#121410] p-10 text-center">
              <div className="font-headline text-xl font-black">Chưa có bài viết</div>
              <div className="mt-2 text-sm text-[#abaca5]">Hiện chưa có bài nào ở trạng thái Posted.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {pageItems.map((item) => (
                <CommunityCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goPage(safePage - 1)}
              disabled={loading || safePage <= 1}
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
                disabled={loading}
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
              disabled={loading || safePage >= totalPages}
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
