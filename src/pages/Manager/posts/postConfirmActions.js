/**
 * ============================================================
 * FILE: src/pages/Manager/posts/postConfirmActions.js
 * ============================================================
 * WHAT IS THIS FILE?
 *   Small factory helpers to build a consistent confirmAction
 *   object shape used by ManagerPostsPage.
 *
 * RESPONSIBILITIES:
 *   - Create confirm modal config objects with consistent keys
 *
 * DATA FLOW:
 *   ManagerPostsPage.jsx → createConfirmAction() → PostConfirmModal props
 *
 * USED IN:
 *   - src/pages/Manager/ManagerPostsPage.jsx
 * ============================================================
 */

// ── CHANGE [2026-04-21]: Structured header for reviewability (no behavior change) ──

/**
 * postConfirmActions.js
 * Shared confirm-state helpers for Manager Posts page.
 */

/**
 * createConfirmAction
 * A small helper to keep confirmAction object shape consistent.
 *
 * @param {object} args - parameters
 * @param {'approve'|'delete'} args.type - action type
 * @param {string} args.message - confirm message
 * @param {string} args.confirmText - ok button text
 * @param {'primary'|'danger'} args.variant - visual variant
 * @param {function():Promise<void>} args.onConfirm - confirm handler
 * @returns {object} confirmAction object
 */
export function createConfirmAction({ type, message, confirmText, variant, onConfirm }) {
  return {
    type,
    title: 'Xác nhận',
    message,
    confirmText,
    variant,
    onConfirm,
  };
}

// ── END CHANGE ─────────────────────────────────────────────
