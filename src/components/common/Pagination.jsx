export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(safeTotalPages, Math.max(1, Number(page) || 1));

  const canPrev = safePage > 1;
  const canNext = safePage < safeTotalPages;

  const baseBtn =
    'font-headline flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition-all';

  const pages = (() => {
    if (safeTotalPages <= 5) return Array.from({ length: safeTotalPages }, (_, i) => i + 1);

    const set = new Set([1, safeTotalPages]);

    if (safePage <= 3) {
      [2, 3, 4].forEach((n) => set.add(n));
    } else if (safePage >= safeTotalPages - 2) {
      [safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1].forEach((n) => set.add(n));
    } else {
      [safePage - 1, safePage, safePage + 1].forEach((n) => set.add(n));
    }

    const list = Array.from(set)
      .filter((n) => n >= 1 && n <= safeTotalPages)
      .sort((a, b) => a - b);

    const withEllipsis = [];
    for (let i = 0; i < list.length; i++) {
      const cur = list[i];
      const prev = list[i - 1];
      if (i > 0 && cur - prev > 1) withEllipsis.push('ellipsis');
      withEllipsis.push(cur);
    }
    return withEllipsis;
  })();

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        type="button"
        onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
        disabled={!canPrev}
        className={
          !canPrev
            ? 'flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-[#474944]/20 text-[#abaca5]/40'
            : 'flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-[#abaca5] transition-colors hover:bg-[#242721]'
        }
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span key={`e-${idx}`} className="px-2 text-[#abaca5]">
              ...
            </span>
          );
        }

        const n = Number(p);
        const active = n === safePage;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange?.(n)}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'font-headline flex h-10 w-10 items-center justify-center rounded-lg bg-[#8eff71] text-sm font-bold text-[#0d6100]'
                : `${baseBtn} border-[#474944]/30 text-[#abaca5] hover:border-[#8eff71] hover:text-[#8eff71]`
            }
          >
            {n}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange?.(Math.min(safeTotalPages, safePage + 1))}
        disabled={!canNext}
        className={
          !canNext
            ? 'flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-[#474944]/20 text-[#abaca5]/40'
            : 'flex h-10 w-10 items-center justify-center rounded-lg border border-[#474944]/30 text-[#abaca5] transition-colors hover:bg-[#242721]'
        }
        aria-label="Next page"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}
