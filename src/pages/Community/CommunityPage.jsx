import { useMemo, useState } from 'react';

import AdBannerHorizontal from './components/AdBannerHorizontal';
import AdBannerVertical from './components/AdBannerVertical';
import CommunityCard from './components/CommunityCard';

const MOCK_COMMUNITY_ITEMS = [
  {
    id: 1,
    tag: 'Tips',
    title: '5 mẹo chọn sân gần bạn (giá hợp lý)',
    excerpt: 'Cách đọc rating, so sánh tiện ích và tránh giờ cao điểm để tiết kiệm chi phí.',
    author: 'SanSieuToc Team',
    time: '2h ago',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Football field',
  },
  {
    id: 2,
    tag: 'Match',
    title: 'Tìm đội đá giao hữu tối thứ 6',
    excerpt: 'Khu vực TP.HCM, trình độ trung bình khá. Cần 3-4 bạn.',
    author: 'Minh Nguyen',
    time: '6h ago',
    image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Players on field',
  },
  {
    id: 3,
    tag: 'Review',
    title: 'Review sân D7: đèn sáng, cỏ ổn',
    excerpt: 'Điểm cộng: dễ đậu xe, có nước. Điểm trừ: hơi đông giờ 20-22h.',
    author: 'Khanh Le',
    time: '1d ago',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Stadium lights',
  },
  {
    id: 4,
    tag: 'Owner',
    title: 'Chia sẻ cách set giá theo khung giờ',
    excerpt: 'Gợi ý set giá theo demand + combo khuyến mãi để tăng doanh thu.',
    author: 'Owner Club',
    time: '2d ago',
    image: 'https://images.unsplash.com/photo-1526232373132-0e4ee16f4b38?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Football pitch',
  },
  {
    id: 5,
    tag: 'Tips',
    title: 'Checklist trước khi ra sân',
    excerpt: 'Giày, băng gối, nước uống, áo bib và cách khởi động 5 phút.',
    author: 'Coach Tran',
    time: '3d ago',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Football shoes',
  },
  {
    id: 6,
    tag: 'Match',
    title: 'Kèo sân 11: cần thêm 6 người',
    excerpt: 'Ha Noi, CN tuần này. Vào sân đúng giờ, chia team random.',
    author: 'Duc Pham',
    time: '4d ago',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Football game',
  },
  {
    id: 7,
    tag: 'Review',
    title: 'Sân mini Lê Duẩn: nhỏ nhưng sạch',
    excerpt: 'Phù hợp đá 5, mặt sân đều. Nhà tắm ổn, wifi hơi yếu.',
    author: 'Thanh Vu',
    time: '5d ago',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Mini pitch',
  },
  {
    id: 8,
    tag: 'Owner',
    title: 'Khuyến mãi: làm sao không lỗ?',
    excerpt: 'Tính cost/slot + giới hạn voucher theo khung giờ để tối ưu.',
    author: 'Marketing',
    time: '6d ago',
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Promotion',
  },
  {
    id: 9,
    tag: 'Tips',
    title: 'Đá ban đêm: cách giảm chấn thương',
    excerpt: 'Warm-up kỹ hơn, chọn giày đinh phù hợp và đừng bỏ qua cooldown.',
    author: 'Physio',
    time: '1w ago',
    image: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Night field',
  },
  {
    id: 10,
    tag: 'Match',
    title: 'Tìm đội đá 7 người (kèo đều)',
    excerpt: 'TP.HCM, tối T3. Ưu tiên chơi đẹp, không va chạm.',
    author: 'Huy',
    time: '1w ago',
    image: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Team match',
  },
  {
    id: 11,
    tag: 'Review',
    title: 'Celadon City: dịch vụ tốt, giá ok',
    excerpt: 'Bãi xe rộng, đèn sáng, nhân viên support nhanh.',
    author: 'Linh',
    time: '2w ago',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Stadium',
  },
  {
    id: 12,
    tag: 'Owner',
    title: 'Tối ưu lịch sân bằng slot 90 phút',
    excerpt: 'Gộp slot để giảm thời gian trống và tăng tỷ lệ lấp đầy.',
    author: 'Ops',
    time: '2w ago',
    image: 'https://images.unsplash.com/photo-1520975958225-457d2c611a0a?auto=format&fit=crop&w=1200&q=60',
    imageAlt: 'Planning',
  },
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function CommunityPage() {
  const itemsPerPage = 6; // 2 columns x 3 rows
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(MOCK_COMMUNITY_ITEMS.length / itemsPerPage));
  const safePage = clamp(page, 1, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return MOCK_COMMUNITY_ITEMS.slice(start, start + itemsPerPage);
  }, [safePage]);

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

            <div className="hidden items-center gap-2 rounded-xl border border-[#474944]/30 bg-[#121410] px-4 py-3 text-xs font-black uppercase tracking-widest text-[#abaca5] md:flex">
              <span className="material-symbols-outlined text-base">view_module</span>
              2 columns • 3 rows
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
