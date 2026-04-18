/**
 * PostFormModal.jsx
 * Create/Edit modal for Manager Posts.
 */

import { useEffect } from 'react';
import { MAX_IMAGES_PER_POST, buildPickedImagePreviews, revokePreviewUrl } from './postUploadHelpers';
import uploadService from '../../../services/uploadService';

export default function PostFormModal({
  open,
  editing,
  form,
  setForm,
  formBusy,
  formError,
  onClose,
  onSaveDraft,
  onPublish,
  notify,
}) {
  // Cleanup preview URLs when modal closes
  useEffect(() => {
    if (open) return;

    // revoke any object URLs created for previews
    (form?.images || []).forEach((img) => {
      if (img && typeof img === 'object' && img.previewUrl) revokePreviewUrl(img.previewUrl);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onPickFiles = (files) => {
    try {
      const list = Array.from(files || []);
      if (!list.length) return;

      const currentNewCount = (form?.images || []).filter((x) => x && typeof x === 'object' && x.file instanceof File).length;
      const remaining = Math.max(0, MAX_IMAGES_PER_POST - currentNewCount);

      if (remaining <= 0) {
        const msg = `Bạn chỉ được upload tối đa ${MAX_IMAGES_PER_POST} ảnh mỗi bài viết.`;
        notify?.notifyWarning?.(msg);
        return;
      }

      const accepted = list.slice(0, remaining);
      const rejectedCount = list.length - accepted.length;

      const previews = buildPickedImagePreviews(accepted);
      setForm((prev) => ({ ...prev, images: [...(prev?.images || []), ...previews] }));

      if (rejectedCount > 0) {
        notify?.notifyInfo?.(`Đã bỏ qua ${rejectedCount} ảnh vì vượt quá giới hạn ${MAX_IMAGES_PER_POST} ảnh.`);
      }
    } catch (e) {
      notify?.notifyError?.(e?.message || 'Failed to read images');
    }
  };

  const removeImageAt = (idx) => {
    setForm((prev) => {
      const target = prev?.images?.[idx];
      if (target && typeof target === 'object' && target.previewUrl) revokePreviewUrl(target.previewUrl);
      return { ...prev, images: (prev?.images || []).filter((_, i) => i !== idx) };
    });
  };

  const handleSaveDraft = () => {
    onSaveDraft?.();
  };

  const canSaveDraft = !editing || String(editing?.status) === 'Draft' || !!editing?.__dbDraft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl my-10">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-headline font-bold">{editing ? 'Edit Post' : 'New Post'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Khi Owner sửa bài đăng: trạng thái sẽ chuyển về <b>Pending</b> và cần duyệt lại. (Manager chỉ được sửa bài do mình tạo.)
            </p>
          </div>
          <button
            type="button"
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            onClick={onClose}
            disabled={formBusy}
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="space-y-1 block">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</div>
                <input
                  className="h-11 w-full rounded-lg bg-white px-4 text-sm border border-outline-variant text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form?.title || ''}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Post title"
                  disabled={formBusy}
                />
              </label>

              <label className="space-y-1 block">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Content</div>
                <textarea
                  className="min-h-44 w-full rounded-lg bg-white px-4 py-3 text-sm border border-outline-variant text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form?.content || ''}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Write content..."
                  disabled={formBusy}
                />
              </label>

              {formError ? <div className="rounded-lg border border-error/60 bg-error/10 p-3 text-sm text-error">{formError}</div> : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Images</div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Add multiple images (Max {MAX_IMAGES_PER_POST} images). You can remove any preview.
                  </div>
                </div>

                <label className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface inline-flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickFiles(e.target.files)}
                    disabled={formBusy}
                  />
                  Add images
                </label>
              </div>

              <div className="rounded-xl border border-outline-variant bg-surface p-4">
                {(form?.images || []).length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {(form?.images || []).map((img, idx) => {
                      const src = typeof img === 'string' ? img : img?.previewUrl;
                      return (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface">
                          {src ? <img src={src} alt="preview" className="h-28 w-full object-cover" /> : null}
                          <button
                            type="button"
                            onClick={() => removeImageAt(idx)}
                            className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white"
                            disabled={formBusy}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No images selected.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-outline-variant pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface"
              disabled={formBusy}
            >
              Cancel
            </button>

            {canSaveDraft ? (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
                disabled={formBusy}
                title="Lưu nháp vào DB (status=Draft)"
              >
                {formBusy ? 'Saving...' : 'Save Draft'}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onPublish}
              className="h-11 rounded-lg px-6 text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
              disabled={formBusy}
              title="Đăng bài ngay (Publish)"
            >
              {formBusy ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
