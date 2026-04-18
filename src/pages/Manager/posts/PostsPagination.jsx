/**
 * PostsPagination.jsx
 * Numeric page buttons for the Manager Posts list.
 * Renders up to MAX_VISIBLE_PAGES numbered buttons with ellipsis truncation.
 */

// 2. Third-party
import PropTypes from 'prop-types';

// Maximum number of page buttons visible at once before truncating with "…"
const MAX_VISIBLE_PAGES = 7;

/**
 * buildPageList
 * Generates the array of page numbers (and 'ellipsis' sentinels) to render.
 *
 * @param {number} current - Current active page (1-indexed)
 * @param {number} total   - Total number of pages
 * @returns {Array<number|string>} - Array of numbers or 'ellipsis' strings
 */
function buildPageList(current, total) {
  if (total <= MAX_VISIBLE_PAGES) {
    // Show all pages when count is small enough
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  const sideWindow = 2; // pages shown on each side of current

  // Always show first page
  pages.push(1);

  const leftEdge = current - sideWindow;
  const rightEdge = current + sideWindow;

  // Ellipsis after page 1 if there's a gap
  if (leftEdge > 2) pages.push('ellipsis-left');

  // Pages around current
  for (let p = Math.max(2, leftEdge); p <= Math.min(total - 1, rightEdge); p++) {
    pages.push(p);
  }

  // Ellipsis before last page if there's a gap
  if (rightEdge < total - 1) pages.push('ellipsis-right');

  // Always show last page
  pages.push(total);

  return pages;
}

/**
 * PostsPagination component
 * @param {number}   page         - Current page (1-indexed)
 * @param {number}   totalPages   - Total number of pages (0 means unknown / hide)
 * @param {boolean}  loading      - Disables buttons while loading
 * @param {Function} onPageChange - Callback that receives the new page number
 */
export default function PostsPagination({ page, totalPages, loading, onPageChange }) {
  // If total is unknown we still show at least current page
  const knownTotal = totalPages > 0 ? totalPages : page;
  const pageList = buildPageList(page, knownTotal);

  /**
   * renderButton
   * Renders an individual numeric page button.
   *
   * @param {number} pageNum - Page number this button represents
   * @returns {JSX.Element}
   */
  const renderButton = (pageNum) => {
    const isActive = pageNum === page;
    return (
      <button
        key={pageNum}
        type="button"
        disabled={loading || isActive}
        onClick={() => onPageChange(pageNum)}
        className={[
          'h-9 min-w-[2.25rem] rounded-lg px-2 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-primary text-on-primary cursor-default'
            : 'border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-50',
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
      >
        {pageNum}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1 flex-wrap justify-center" role="navigation" aria-label="Pagination">
      {pageList.map((item) => {
        if (typeof item === 'string') {
          // Ellipsis placeholder — not interactive
          return (
            <span key={item} className="h-9 min-w-[2.25rem] flex items-center justify-center text-sm text-on-surface-variant select-none">
              …
            </span>
          );
        }
        return renderButton(item);
      })}
    </div>
  );
}

PostsPagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func.isRequired,
};

PostsPagination.defaultProps = {
  totalPages: 0,
  loading: false,
};
