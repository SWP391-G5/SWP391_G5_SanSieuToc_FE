/**
 * ============================================================
 * FILE: src/pages/Manager/posts/PostConfirmModal.jsx
 * ============================================================
 * WHAT IS THIS FILE?
 *   A small reusable confirmation modal (EXECUTOR) used by
 *   Manager screens to confirm destructive/important actions.
 *
 * RESPONSIBILITIES:
 *   - Render a modal with title/message and Cancel/Confirm buttons
 *   - Close on overlay click or Escape
 *
 * DATA FLOW:
 *   Parent state (ManagerPostsPage) → props → [THIS COMPONENT]
 *   → calls props.onCancel / props.onConfirm
 *
 * USED IN:
 *   - src/pages/Manager/ManagerPostsPage.jsx
 *   - src/pages/Manager/banners-ads/BannersAdsPage.jsx
 * ============================================================
 */

// ── Third-party ────────────────────────────────────────────
import PropTypes from 'prop-types';

// ── CHANGE [2026-04-21]: Add PropTypes + structured docs for reviewability ──
export default function PostConfirmModal({
  open,
  title,
  message,
  cancelText,
  confirmText,
  confirmVariant,
  onCancel,
  onConfirm,
  zIndexClassName,
}) {
  if (!open) return null;

  /**
   * handleCancel
   * ----------------------------------------------------------
   * Closes the modal via the provided callback.
   *
   * TRIGGERS: overlay click / Escape / Cancel button
   */
  const handleCancel = () => onCancel?.();

  const confirmClassName =
    confirmVariant === 'danger'
      ? 'bg-error text-on-error hover:opacity-90'
      : 'bg-primary text-on-primary hover:opacity-90';

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleCancel();
      }}
      tabIndex={-1}
    >
      <div className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl">
        <div className="px-5 py-4 border-b border-outline-variant">
          <div className="text-sm font-bold text-on-surface">{title}</div>
          <div className="text-xs text-on-surface-variant mt-1">Vui lòng xác nhận để tiếp tục.</div>
          {message ? <div className="text-xs text-on-surface mt-2">{message}</div> : null}
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
          >
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className={`h-10 rounded-lg px-4 text-sm font-bold ${confirmClassName}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

PostConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired, // Whether modal is visible
  title: PropTypes.string, // Modal title text
  message: PropTypes.string, // Optional message/body
  cancelText: PropTypes.string, // Cancel button label
  confirmText: PropTypes.string, // Confirm button label
  confirmVariant: PropTypes.oneOf(['primary', 'danger']), // Controls confirm button styling
  onCancel: PropTypes.func, // Called when user cancels/closes
  onConfirm: PropTypes.func, // Called when user confirms
  zIndexClassName: PropTypes.string, // Allows parent to stack multiple modals safely
};

PostConfirmModal.defaultProps = {
  title: 'Confirm',
  message: '',
  cancelText: 'Cancel',
  confirmText: 'OK',
  confirmVariant: 'primary',
  onCancel: undefined,
  onConfirm: undefined,
  zIndexClassName: 'z-[61]',
};
// ── END CHANGE ─────────────────────────────────────────────
