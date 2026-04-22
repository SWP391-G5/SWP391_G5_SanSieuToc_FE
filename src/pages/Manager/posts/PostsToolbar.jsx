/**
 * ============================================================
 * FILE: src/pages/Manager/posts/PostsToolbar.jsx
 * ============================================================
 * WHAT IS THIS FILE?
 *   Toolbar row for Manager Posts screen (EXECUTOR).
 *   Pure UI: search input + reset button.
 *
 * RESPONSIBILITIES:
 *   - Render controlled search input
 *   - Expose Reset action via callback
 *
 * DATA FLOW:
 *   ManagerPostsPage.jsx state → props.search → [THIS FILE]
 *   User input → props.onSearchChange(string)
 *   Reset click → props.onReset()
 *
 * USED IN:
 *   - src/pages/Manager/ManagerPostsPage.jsx
 * ============================================================
 */

// ── Third-party ────────────────────────────────────────────
import PropTypes from 'prop-types';

// ── CHANGE [2026-04-21]: Add structured header/import groups (no behavior change) ──

/**
 * PostsToolbar component
 * @param {string}   search         - Current search keyword
 * @param {Function} onSearchChange - Callback when search changes (receives new string)
 * @param {Function} onReset        - Callback to reset all filters
 */
export default function PostsToolbar({ search, onSearchChange, onReset }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      {/* Left: search + reset */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tìm kiếm</div>
          <input
            className="h-10 w-full sm:w-80 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black placeholder:text-gray-400"
            placeholder="Tiêu đề / nội dung..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={onReset}
          className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface text-on-surface-variant"
          title="Đặt lại Trạng thái / Người sở hữu / Tìm kiếm"
        >
          Đặt lại
        </button>
      </div>

      {/* Right: removed page-size selector (fixed 10 items/page) */}
      <div />
    </div>
  );
}

PostsToolbar.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

// ── END CHANGE ─────────────────────────────────────────────
