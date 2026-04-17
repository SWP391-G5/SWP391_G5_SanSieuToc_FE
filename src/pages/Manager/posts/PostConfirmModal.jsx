/**
 * PostConfirmModal.jsx
 * Reusable confirmation modal for Manager Posts actions.
 */

export default function PostConfirmModal({
  open,
  title = 'Confirm',
  message,
  cancelText = 'Cancel',
  confirmText = 'OK',
  confirmVariant = 'primary', // 'primary' | 'danger'
  onCancel,
  onConfirm,
  zIndexClassName = 'z-[61]',
}) {
  if (!open) return null;

  const confirmClassName =
    confirmVariant === 'danger'
      ? 'bg-error text-on-error hover:opacity-90'
      : 'bg-primary text-on-primary hover:opacity-90';

  return (
    <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}>
      <div className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl">
        <div className="px-5 py-4 border-b border-outline-variant">
          <div className="text-sm font-bold text-black">{title}</div>
          {message ? <div className="text-xs text-on-surface-variant mt-1">{message}</div> : null}
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
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
