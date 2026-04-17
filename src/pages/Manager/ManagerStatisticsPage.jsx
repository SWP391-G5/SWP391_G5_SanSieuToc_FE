/**
 * ManagerStatisticsPage.jsx
 * Manager dashboard statistics page (prepared UI: mock stats + sections; API wiring later).
 */

import { useMemo } from 'react';

function formatCompactNumber(n) {
  const v = Number(n) || 0;
  return v.toLocaleString();
}

/**
 * ManagerStatisticsPage
 * @returns {JSX.Element} statistics page skeleton
 */
export default function ManagerStatisticsPage() {
  // Prepared mock values (replace by API later)
  const stats = useMemo(
    () => ({
      totalRevenueVnd: 0,
      totalBookings: 0,
      totalUsers: 0,
      avgRating: 0,
      pendingOwnerPosts: 0,
      activeBanners: 0,
    }),
    []
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-headline font-bold">Statistics</h1>
        <p className="text-sm text-on-surface-variant">System snapshot and performance overview (prepared UI; API wiring later).</p>
      </header>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Total Revenue</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-primary">{formatCompactNumber(stats.totalRevenueVnd)}</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">From all completed transactions (placeholder)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Total Bookings</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-on-surface">{formatCompactNumber(stats.totalBookings)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">All time bookings count (placeholder)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Total Users</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-tertiary">{formatCompactNumber(stats.totalUsers)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Customers + owners (placeholder)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Average Rating</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-on-surface">{stats.avgRating || '—'}</h3>
            <span className="text-xs font-bold text-on-surface-variant pb-1 mb-1">/ 5</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Across all feedback (placeholder)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Pending Owner Posts</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-error">{formatCompactNumber(stats.pendingOwnerPosts)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Needs approval (placeholder)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Active Banners</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-primary">{formatCompactNumber(stats.activeBanners)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Currently published marketing images (placeholder)</div>
        </div>
      </section>

      {/* Prepared sections */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-headline font-bold">Revenue Trend</h2>
              <p className="text-sm text-on-surface-variant">Chart placeholder (wire to API later).</p>
            </div>
          </div>
          <div className="bg-surface-container p-6 rounded-xl">
            <div className="text-sm text-on-surface-variant">Coming soon: chart component.</div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xl font-headline font-bold">Top Fields</h2>
          <div className="bg-surface-container p-6 rounded-xl">
            <div className="text-sm text-on-surface-variant">Coming soon: top fields list.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
