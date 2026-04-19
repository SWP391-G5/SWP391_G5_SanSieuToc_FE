import { useEffect, useMemo, useState } from 'react';

import useCustomerBanners from '../../../hooks/useCustomerBanners';
import { useAuth } from '../../../context/AuthContext';

import AdBannerHorizontal from './components/AdBannerHorizontal';
import AdBannerVertical from './components/AdBannerVertical';
import CommunityCard from './components/CommunityCard';
import CreatePostModal from './components/CreatePostModal';

import { adaptPostToCommunityItem } from './communityApiAdapter';
import publicApi from '../../../services/public/publicApi';
import { COMMUNITY_HORIZONTAL_POOL } from '../../../data/ads/communityHorizontalCopy';
import { COMMUNITY_VERTICAL_POOL } from '../../../data/ads/communityVerticalCopy';
import { getRandomAdsFromPool } from '../../../utils/adUtils';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const itemsPerPage = 6; // 2 columns x 3 rows
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { banners: horizontalBanners } = useCustomerBanners('community_horizontal');
  const { banners: verticalBanners } = useCustomerBanners('community_vertical');

  // Randomize copies on mount
  const horizontalCopies = useMemo(() => {
    return getRandomAdsFromPool(COMMUNITY_HORIZONTAL_POOL, 3);
  }, []);

  const verticalCopies = useMemo(() => {
    return getRandomAdsFromPool(COMMUNITY_VERTICAL_POOL, 5);
  }, []);

  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await publicApi.getPosts({
          page: safePage,
          limit: itemsPerPage,
          q: searchText.trim() || undefined,
        });
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
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [itemsPerPage, safePage, searchText]);

  const pageItems = useMemo(() => items, [items]);

  const goPage = (next) => setPage(clamp(next, 1, totalPages));

  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <div className="flex gap-8">
        {/* Left vertical ad */}
        <aside className="sticky top-28 hidden h-[calc(100vh-7rem)] w-64 flex-col gap-6 overflow-auto lg:flex">
          {verticalBanners.map((banner, index) => {
            const copy = verticalCopies[index % verticalCopies.length] || verticalCopies[0];
            return (
              <AdBannerVertical
                key={banner._id}
                banner={banner}
                title={copy.title}
                subtitle={copy.subtitle}
                cta={copy.cta}
                to={copy.to}
              />
            );
          })}
        </aside>

        {/* Main */}
        <section className="flex-1 pb-20">
          {/* Top horizontal ad */}
          <AdBannerHorizontal
            banners={horizontalBanners}
            copyArray={horizontalCopies}
          />

          <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tight">
                Community <span className="italic text-[#8eff71]">Hub</span>
              </h1>
              <div className="mt-2 text-sm text-[#abaca5]">Bài viết / kèo đá / review từ cộng đồng.</div>
              {searchText.trim() ? (
                <div className="mt-2 text-xs text-[#abaca5]">
                  Search result for: <span className="text-[#fdfdf6]">{searchText}</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row md:items-center">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#8eff71] px-6 py-2.5 text-sm font-black uppercase tracking-widest text-[#0d6100] transition-all hover:scale-[1.03] active:scale-[0.97]"
                >
                  <span className="material-symbols-outlined text-xl">add_comment</span>
                  Post
                </button>
              )}

              <div className="group relative w-full xl:max-w-sm">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#abaca5] transition-colors group-focus-within:text-[#8eff71]">
                  search
                </span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search posts"
                  className="w-full rounded-xl border border-[#474944]/30 bg-[#121410] py-2.5 pl-10 pr-10 text-sm text-[#fdfdf6] outline-none transition-all placeholder:text-[#abaca5]/50 focus:border-[#8eff71] focus:ring-2 focus:ring-[#8eff71]/40"
                />

                {searchText ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText('');
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#abaca5] transition-colors hover:bg-[#242721] hover:text-[#fdfdf6]"
                    aria-label="Clear post search"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <CreatePostModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              // The post is pending
            }}
          />

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
              <div className="font-headline text-xl font-black">
                {searchText.trim() ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết'}
              </div>
              <div className="mt-2 text-sm text-[#abaca5]">
                {searchText.trim()
                  ? 'Thử từ khóa khác để tìm bài viết cộng đồng.'
                  : 'Hiện chưa có bài nào ở trạng thái Posted.'}
              </div>
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
