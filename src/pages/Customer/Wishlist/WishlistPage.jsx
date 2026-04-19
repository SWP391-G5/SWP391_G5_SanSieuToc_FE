import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Modal } from '../../../components/Modal';
import { useWishlist } from '../../../hooks/useWishlist';

import WishlistCard from './components/WishlistCard';

const INITIAL_POPUP_STATE = {
  isOpen: false,
  mode: 'info',
  title: '',
  message: '',
  confirmText: 'Đồng ý',
  onConfirm: null,
};

function compareByText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'vi');
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, wishlistIds, toggleWishlist, clearWishlist } = useWishlist();

  const [keyword, setKeyword] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [compareIds, setCompareIds] = useState([]);
  const [systemPopup, setSystemPopup] = useState(INITIAL_POPUP_STATE);

  const closeSystemPopup = () => {
    setSystemPopup(INITIAL_POPUP_STATE);
  };

  const openInfoPopup = ({ title, message }) => {
    setSystemPopup({
      isOpen: true,
      mode: 'info',
      title,
      message,
      confirmText: 'Đồng ý',
      onConfirm: null,
    });
  };

  const openConfirmPopup = ({ title, message, confirmText, onConfirm }) => {
    setSystemPopup({
      isOpen: true,
      mode: 'confirm',
      title,
      message,
      confirmText: confirmText || 'Xác nhận',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : null,
    });
  };

  const handlePopupConfirm = () => {
    const action = systemPopup.onConfirm;
    closeSystemPopup();
    if (typeof action === 'function') {
      action();
    }
  };

  const cityOptions = useMemo(() => {
    const set = new Set(wishlist.map((f) => String(f?.city || '').trim()).filter(Boolean));
    return Array.from(set).sort(compareByText);
  }, [wishlist]);

  const sizeOptions = useMemo(() => {
    const set = new Set(wishlist.map((f) => String(f?.size || '').trim()).filter(Boolean));
    return Array.from(set).sort(compareByText);
  }, [wishlist]);

  const filteredWishlist = useMemo(() => {
    const q = normalizeSearchText(keyword);

    return wishlist.filter((f) => {
      if (cityFilter !== 'All' && String(f?.city || '').trim() !== cityFilter) return false;
      if (sizeFilter !== 'All' && String(f?.size || '').trim() !== sizeFilter) return false;

      if (!q) return true;
      return normalizeSearchText(f?.name).includes(q);
    });
  }, [cityFilter, keyword, sizeFilter, wishlist]);

  useEffect(() => {
    const idSet = new Set(wishlist.map((x) => String(x.id)));
    setCompareIds((prev) => prev.filter((id) => idSet.has(String(id))));
  }, [wishlist]);

  const compareItems = useMemo(() => {
    const idSet = new Set(compareIds.map((id) => String(id)));
    return wishlist.filter((f) => idSet.has(String(f.id)));
  }, [compareIds, wishlist]);

  const toggleCompare = (field) => {
    const id = String(field?.id || '');
    if (!id) return;

    if (compareIds.includes(id)) {
      setCompareIds((prev) => prev.filter((x) => x !== id));
      return;
    }

    if (compareIds.length >= 3) {
      openInfoPopup({
        title: 'Đã đạt giới hạn so sánh',
        message: 'Bạn có thể so sánh tối đa 3 sân cùng lúc.',
      });
      return;
    }

    setCompareIds((prev) => [...prev, id]);
  };

  const resetFilters = () => {
    setKeyword('');
    setCityFilter('All');
    setSizeFilter('All');
  };

  const onRemoveAll = () => {
    if (wishlist.length === 0) return;
    openConfirmPopup({
      title: 'Xóa tất cả mục yêu thích?',
      message: 'Thao tác này sẽ xóa toàn bộ sân đã lưu trong danh sách yêu thích.',
      confirmText: 'Xóa tất cả',
      onConfirm: () => {
        clearWishlist();
        setCompareIds([]);
      },
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-headline text-3xl font-black italic text-[#fdfdf6]">Danh sách yêu thích</h1>
          <p className="mt-2 text-sm text-[#abaca5]">Sân đã lưu — khách cũng có thể xem.</p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={onRemoveAll}
            disabled={wishlist.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#ff4d6d]/30 bg-[#2a151a] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#ff8ea3] transition-colors hover:bg-[#ff4d6d]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xóa tất cả
            <span className="material-symbols-outlined text-base">delete</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/fields')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#242721] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
          >
            Xem danh sách sân
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {wishlist.length > 0 ? (
        <div className="mb-8 rounded-xl border border-[#474944]/30 bg-[#121410] p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="group relative min-w-[14rem] flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#abaca5]">search</span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên sân"
                className="w-full rounded-lg border border-[#474944]/30 bg-[#181a16] py-2.5 pl-10 pr-3 text-sm text-[#fdfdf6] outline-none transition-all focus:border-[#8eff71]"
              />
            </div>

            <div className="relative min-w-[11rem]">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#474944]/30 bg-[#181a16] px-3 py-2.5 pr-9 text-sm text-[#fdfdf6] outline-none transition-all focus:border-[#8eff71]"
              >
                <option value="All">Tất cả thành phố</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#abaca5]">expand_more</span>
            </div>

            <div className="relative min-w-[10rem]">
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#474944]/30 bg-[#181a16] px-3 py-2.5 pr-9 text-sm text-[#fdfdf6] outline-none transition-all focus:border-[#8eff71]"
              >
                <option value="All">Tất cả kích thước</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#abaca5]">expand_more</span>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg bg-[#242721] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
            >
              Đặt lại bộ lọc
            </button>
          </div>

          <div className="text-xs text-[#abaca5]">Hiển thị {filteredWishlist.length} sân</div>
        </div>
      ) : null}

      {compareItems.length > 0 ? (
        <div className="mb-8 rounded-xl border border-[#8eff71]/25 bg-[#121410] p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-xl font-black text-[#fdfdf6]">So sánh sân</h2>
              <p className="mt-1 text-xs text-[#abaca5]">
                {compareItems.length < 2
                  ? 'Chọn ít nhất 2 sân để so sánh.'
                  : `Đang so sánh ${compareItems.length} sân`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="rounded-lg bg-[#242721] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
            >
              Xóa so sánh
            </button>
          </div>

          {compareItems.length >= 2 ? (
            <div className="overflow-x-auto rounded-lg border border-[#474944]/30">
              <table className="w-full min-w-[48rem] border-collapse text-left">
                <thead className="bg-[#181a16]">
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Tiêu chí</th>
                    {compareItems.map((f) => (
                      <th key={f.id} className="px-4 py-3 text-sm font-black text-[#fdfdf6]">
                        <div className="line-clamp-2">{f.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#474944]/20">
                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Giá</td>
                    {compareItems.map((f) => (
                      <td key={`price-${f.id}`} className="px-4 py-3 font-headline text-lg font-black text-[#8eff71]">
                        {f.price}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-[#474944]/20">
                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Đánh giá</td>
                    {compareItems.map((f) => (
                      <td key={`rating-${f.id}`} className="px-4 py-3 text-sm text-[#fdfdf6]">
                        {f.rating || 'Không có'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-[#474944]/20">
                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Thành phố</td>
                    {compareItems.map((f) => (
                      <td key={`city-${f.id}`} className="px-4 py-3 text-sm text-[#fdfdf6]">
                        {f.city || 'Không có'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-[#474944]/20">
                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Kích thước</td>
                    {compareItems.map((f) => (
                      <td key={`size-${f.id}`} className="px-4 py-3 text-sm text-[#fdfdf6]">
                        {f.size || 'Không có'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-[#474944]/20">
                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Địa chỉ</td>
                    {compareItems.map((f) => (
                      <td key={`address-${f.id}`} className="px-4 py-3 text-sm text-[#fdfdf6]">
                        {f.address || 'Không có'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-[#474944]/20">
                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-[#abaca5]">Tiện ích</td>
                    {compareItems.map((f) => (
                      <td key={`utils-${f.id}`} className="px-4 py-3 text-sm text-[#fdfdf6]">
                        {Array.isArray(f.utilities) && f.utilities.length ? f.utilities.join(', ') : 'Không có'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {wishlist.length === 0 ? (
        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
          <div className="font-headline text-xl font-black">Danh sách yêu thích đang trống</div>
          <div className="mt-2 text-sm text-[#abaca5]">Nhấn biểu tượng trái tim ở sân để lưu vào đây.</div>
        </div>
      ) : filteredWishlist.length === 0 ? (
        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-10 text-center">
          <div className="font-headline text-xl font-black">Không có sân phù hợp với bộ lọc</div>
          <div className="mt-2 text-sm text-[#abaca5]">Thử đổi từ khóa, thành phố hoặc kích thước.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredWishlist.map((f) => (
            <WishlistCard
              key={f.id}
              field={f}
              wished={wishlistIds.has(f.id)}
              onToggleWishlist={toggleWishlist}
              onViewInList={() => navigate('/fields')}
              onToggleCompare={toggleCompare}
              isCompared={compareIds.includes(String(f.id))}
              compareDisabled={compareIds.length >= 3}
            />
          ))}
        </div>
      )}

      <Modal isOpen={systemPopup.isOpen} onClose={closeSystemPopup} title={systemPopup.title}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-[#474944]/40 bg-[#121410] p-4">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                systemPopup.mode === 'confirm' ? 'bg-[#ff4d6d]/20 text-[#ff8ea3]' : 'bg-[#8eff71]/20 text-[#8eff71]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {systemPopup.mode === 'confirm' ? 'warning' : 'info'}
              </span>
            </div>

            <p className="pt-0.5 text-sm leading-relaxed text-[#d4d6cf]">{systemPopup.message}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {systemPopup.mode === 'confirm' ? (
              <button
                type="button"
                onClick={closeSystemPopup}
                className="rounded-lg border border-[#474944]/40 bg-[#242721] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#d4d6cf] transition-colors hover:border-[#abaca5]/50 hover:text-[#fdfdf6]"
              >
                Hủy
              </button>
            ) : null}

            <button
              type="button"
              onClick={handlePopupConfirm}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                systemPopup.mode === 'confirm'
                  ? 'bg-[#ff4d6d] text-[#12070a] hover:bg-[#ff6f89]'
                  : 'bg-[#8eff71] text-[#0d6100] hover:bg-[#a4ff8f]'
              }`}
            >
              {systemPopup.mode === 'confirm' ? systemPopup.confirmText : 'Đồng ý'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
