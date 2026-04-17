/**
 * ManagerStatisticsPage.jsx
 * Manager dashboard statistics page (UI skeleton only).
 * API wiring will be implemented in a later task.
 */

/**
 * ManagerStatisticsPage
 * @returns {JSX.Element} statistics page skeleton
 */
export default function ManagerStatisticsPage() {
  return (
    <div className="space-y-8">
      {/* Quick Stats Summary (placeholder values) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Total System Revenue</p>
          <div className="flex items-end gap-2">
            {/* TODO: Replace with API value */}
            <h3 className="text-4xl font-headline font-black text-primary">—</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-primary">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>{/* TODO: Replace with API value */}—</span>
          </div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Marketing Approvals</p>
          <div className="flex items-end gap-2">
            {/* TODO: Replace with API value */}
            <h3 className="text-4xl font-headline font-black text-on-surface">—</h3>
            <span className="text-xs font-bold text-on-surface-variant pb-1 mb-1">Pending</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-error">
            <span className="material-symbols-outlined text-sm">priority_high</span>
            <span>{/* TODO: Replace with API value */}—</span>
          </div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group border border-primary/20">
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <span className="material-symbols-outlined text-8xl" data-icon="campaign">
              campaign
            </span>
          </div>
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Active Promotions</p>
          <div className="flex items-end gap-2">
            {/* TODO: Replace with API value */}
            <h3 className="text-4xl font-headline font-black text-tertiary">—</h3>
            <span className="text-xs font-bold text-on-surface-variant pb-1 mb-1">Running</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-tertiary">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{/* TODO: Replace with API value */}—</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid (skeleton stubs) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-headline font-bold">Marketing Queue</h3>
              <p className="text-sm text-on-surface-variant">Review content from branch owners</p>
            </div>
            <button type="button" className="text-primary text-xs font-label uppercase tracking-tighter hover:underline">
              View all queue
            </button>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl">
            {/* TODO: Replace with queue list component */}
            <p className="text-sm text-on-surface-variant">No items yet.</p>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-surface-container p-6 rounded-xl">
            <h3 className="text-lg font-headline font-bold">System Snapshot</h3>
            <p className="text-sm text-on-surface-variant mt-1">Coming soon.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
