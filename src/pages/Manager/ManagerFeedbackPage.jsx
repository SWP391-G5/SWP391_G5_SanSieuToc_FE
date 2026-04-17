/**
 * ManagerFeedbackPage.jsx
 * Manager page to view all feedback across fields.
 * Prepared UI: summary stats + placeholder table. API wiring later.
 */

import { useMemo } from 'react';

function formatCompactNumber(n) {
  const v = Number(n) || 0;
  return v.toLocaleString();
}

/**
 * ManagerFeedbackPage
 * @returns {JSX.Element} feedback page skeleton
 */
export default function ManagerFeedbackPage() {
  // Prepared mock values (replace by API later)
  const summary = useMemo(
    () => ({
      totalFeedback: 0,
      avgRating: 0,
      oneStar: 0,
      fiveStar: 0,
    }),
    []
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-headline font-bold">Feedback</h1>
        <p className="text-sm text-on-surface-variant">Feedback overview and moderation (prepared UI; API wiring later).</p>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-surface-container p-6 rounded-xl">
          <div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Total feedback</div>
          <div className="mt-2 text-4xl font-headline font-black text-on-surface">{formatCompactNumber(summary.totalFeedback)}</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Average rating</div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-4xl font-headline font-black text-primary">{summary.avgRating || '—'}</div>
            <div className="text-xs font-bold text-on-surface-variant pb-1 mb-1">/ 5</div>
          </div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">5★ feedback</div>
          <div className="mt-2 text-4xl font-headline font-black text-tertiary">{formatCompactNumber(summary.fiveStar)}</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">1★ feedback</div>
          <div className="mt-2 text-4xl font-headline font-black text-error">{formatCompactNumber(summary.oneStar)}</div>
        </div>
      </section>

      {/* Table placeholder */}
      <section className="bg-surface-container p-6 rounded-xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-headline font-bold">All feedback</h2>
            <p className="text-sm text-on-surface-variant">Coming soon: filter/search + table list.</p>
          </div>
          <button
            type="button"
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            disabled
            title="API not wired yet"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-outline-variant bg-surface px-4 py-8 text-sm text-on-surface-variant">
          No data yet.
        </div>
      </section>
    </div>
  );
}
