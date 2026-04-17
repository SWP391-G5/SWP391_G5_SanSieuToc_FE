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
    title: 'Confirm',
    message,
    confirmText,
    variant,
    onConfirm,
  };
}
