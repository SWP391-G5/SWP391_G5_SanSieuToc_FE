export default function HeroSection({
  backgroundImageSrc,
  activeCopy,
  heroSearchRef,
  minDate,
  selectedDate,
  onDateChange,
  heroSearch,
  onHeroSearchChange,
  heroSearchOpen,
  onHeroSearchOpen,
  onHeroSearchClose,
  heroSuggestions,
  onPickSuggestion,
  onFormSubmit,
  onViewAllResults,
}) {
  return (
    <section className="relative flex min-h-[921px] items-center overflow-hidden px-6 md:px-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d0f0b] via-[#0d0f0b]/80 to-transparent" />
        <img
          className="h-full w-full object-cover transition-opacity duration-1000"
          src={backgroundImageSrc}
          alt="Trận bóng dưới ánh đèn sân vận động"
          loading="eager"
        />
      </div>

      <div className="relative z-20 mx-auto w-full max-w-4xl">
        <span className="mb-4 inline-block font-label text-sm uppercase tracking-[0.3em] text-[#8eff71]">
          {activeCopy?.badge || 'Hiệu suất sân điện'}
        </span>
        <h1 className="mb-8 font-headline text-5xl font-black italic tracking-tighter text-[#fdfdf6] md:text-7xl leading-[0.9]">
          {activeCopy?.title1 || 'ĐẶT SÂN '}
          <span className="text-[#8eff71]">{activeCopy?.highlight || 'TRONG VÀI GIÂY'}</span>
          {activeCopy?.title2 || ','}
          <br />
          {activeCopy?.subtitle || 'BÙNG CHÁY CÙNG TRẬN ĐẤU!'}
        </h1>

        <form
          onSubmit={onFormSubmit}
          className="flex max-w-3xl flex-col gap-2 rounded-xl bg-[#1e201b] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:flex-row"
        >
          <div ref={heroSearchRef} className="relative flex flex-1">
            <div className="flex w-full items-center gap-3 rounded-lg bg-[#242721] px-4 py-3">
              <span className="material-symbols-outlined text-[#8eff71]">location_on</span>
              <input
                className="w-full border-none bg-transparent text-[#fdfdf6] placeholder:text-[#abaca5]/50 focus:outline-none"
                placeholder="Tìm theo khu vực hoặc tên sân..."
                type="text"
                value={heroSearch}
                onChange={(e) => {
                  onHeroSearchChange(e.target.value);
                  onHeroSearchOpen();
                }}
                onFocus={onHeroSearchOpen}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onHeroSearchClose();
                  if (e.key === 'Escape') onHeroSearchClose();
                }}
                autoComplete="off"
              />

              {heroSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    onHeroSearchChange('');
                    onHeroSearchClose();
                  }}
                  className="rounded-lg p-1 text-[#abaca5] transition-colors hover:bg-[#1e201b] hover:text-[#fdfdf6]"
                  aria-label="Xóa tìm kiếm"
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
                  <div className="px-4 py-3 text-sm text-[#abaca5]">Không tìm thấy sân</div>
                ) : (
                  heroSuggestions.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="option"
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#181a16]"
                      onClick={() => onPickSuggestion(f)}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-headline text-sm font-black text-[#fdfdf6]">{f.name}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-[#abaca5]">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          <span className="truncate">{f.address}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="font-headline text-sm font-black text-[#8eff71]">{f.price}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#abaca5]">
                          <span className="material-symbols-outlined fill-icon text-xs text-[#8eff71]">star</span>
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
                    onClick={onViewAllResults}
                  >
                    Xem tất cả kết quả
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
              onChange={onDateChange}
              onBlur={onDateChange}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[#8eff71] px-8 py-4 font-black uppercase tracking-widest text-[#0d6100] transition-colors hover:bg-[#2ff801]"
          >
            Tìm kiếm
          </button>
        </form>
      </div>
    </section>
  );
}
