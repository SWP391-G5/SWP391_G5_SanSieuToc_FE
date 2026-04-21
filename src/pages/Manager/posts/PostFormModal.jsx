/**
 * PostFormModal.jsx
 * Create/Edit modal for Manager Posts.
 */

import { useEffect, useMemo, useState } from 'react';
import { MAX_IMAGES_PER_POST, buildPickedImagePreviews, revokePreviewUrl } from './postUploadHelpers';
import publicApi from '../../../services/public/publicApi';

const FALLBACK_POST_TAG_OPTIONS = [
  { value: 'ThongBao', label: 'Thông báo' },
  { value: 'TimKeo', label: 'Tìm kèo' },
  { value: 'Tips', label: 'Tips / Kinh nghiệm' },
  { value: 'Review', label: 'Review' },
  { value: 'HoiDap', label: 'Hỏi đáp' },
  { value: 'GiaoLuu', label: 'Giao lưu' },
  { value: 'SuKien', label: 'Sự kiện / Giải đấu' },
  { value: 'KhuyenMai', label: 'Khuyến mãi' },
  { value: 'BaoLoi', label: 'Báo lỗi / Góp ý' },
  { value: 'Khac', label: 'Khác' },
];

const MIN_TAGS_PER_POST = 1;
const MAX_TAGS_PER_POST = 3;

// Align with BE schema constraints; show as hints in UI
const MAX_TITLE_CHARS = 200;
// Product: ~2k words suggestion. Use a char limit hint (roughly 12k chars) but keep BE max at 10000.
const MAX_CONTENT_CHARS = 10000;

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
  const [tagOptions, setTagOptions] = useState(FALLBACK_POST_TAG_OPTIONS);

  // Load global tag options (shared among Customer/Owner/Manager)
  useEffect(() => {
    if (!open) return;

    let alive = true;
    (async () => {
      try {
        const res = await publicApi.getPostTags();
        const items = res?.items;
        if (!alive) return;

        if (Array.isArray(items) && items.length > 0) {
          const cleaned = items
            .map((x) => ({ value: String(x?.value || '').trim(), label: String(x?.label || '').trim() }))
            .filter((x) => x.value && x.label);
          if (cleaned.length > 0) setTagOptions(cleaned);
        }
      } catch {
        // keep fallback
      }
    })();

    return () => {
      alive = false;
    };
  }, [open]);

  const tagOptionsByValue = useMemo(() => {
    const m = new Map();
    (tagOptions || []).forEach((t) => m.set(String(t.value), t));
    return m;
  }, [tagOptions]);

  const knownTagValues = useMemo(() => new Set((tagOptions || []).map((t) => String(t.value))), [tagOptions]);

  const selectedTags = Array.isArray(form?.tags) ? form.tags : [];

  // If API tags have changed, keep previously selected tags visible and selectable
  const mergedTagOptions = useMemo(() => {
    const extras = selectedTags
      .filter((v) => v && !knownTagValues.has(String(v)))
      .map((v) => ({ value: String(v), label: String(v) }));
    return [...(tagOptions || []), ...extras];
  }, [tagOptions, selectedTags, knownTagValues]);

  // Cleanup preview URLs when modal closes
  useEffect(() => {
    if (open) return;

    // revoke any object URLs created for previews
    (form?.images || []).forEach((img) => {
      if (img && typeof img === 'object' && img.previewUrl) revokePreviewUrl(img.previewUrl);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // IMPORTANT: keep this after hooks to avoid hook order change
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

  const canSaveDraft = !editing || String(editing?.status) === 'Draft' || !!editing?.__dbDraft;

  const toggleTag = (value) => {
    setForm((prev) => {
      const next = new Set(Array.isArray(prev?.tags) ? prev.tags : []);
      if (next.has(value)) next.delete(value);
      else next.add(value);

      // enforce max
      const nextArr = Array.from(next);
      if (nextArr.length > MAX_TAGS_PER_POST) {
        notify?.notifyWarning?.(`Bạn chỉ được chọn tối đa ${MAX_TAGS_PER_POST} tag cho 1 bài.`);
        return prev;
      }

      return { ...prev, tags: nextArr };
    });
  };

  const validateDraft = () => {
    const title = String(form?.title || '').trim();
    const tags = Array.isArray(form?.tags) ? form.tags.filter(Boolean) : [];

    if (!title) return 'Title is required.';
    if (title.length > MAX_TITLE_CHARS) return `Title tối đa ${MAX_TITLE_CHARS} ký tự.`;
    if (tags.length < MIN_TAGS_PER_POST) return `Vui lòng chọn tối thiểu ${MIN_TAGS_PER_POST} tag.`;

    const content = String(form?.content || '');
    if (content.length > MAX_CONTENT_CHARS) return `Content tối đa ${MAX_CONTENT_CHARS} ký tự.`;

    return '';
  };

  const validatePublish = () => {
    const base = validateDraft();
    if (base) return base;

    const content = String(form?.content || '').trim();
    if (!content) return 'Content is required to publish.';

    return '';
  };

  const handleSaveDraft = () => {
    const err = validateDraft();
    if (err) {
      notify?.notifyWarning?.(err);
      return;
    }
    onSaveDraft?.();
  };

  const handlePublish = () => {
    const err = validatePublish();
    if (err) {
      notify?.notifyWarning?.(err);
      return;
    }
    onPublish?.();
  };

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
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</div>
                  <div className="text-xs text-on-surface-variant">Tối đa {MAX_TITLE_CHARS} ký tự</div>
                </div>
                <input
                  className="h-11 w-full rounded-lg bg-white px-4 text-sm border border-outline-variant text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form?.title || ''}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value.slice(0, MAX_TITLE_CHARS) }))}
                  placeholder="Post title"
                  disabled={formBusy}
                />
              </label>

              <label className="space-y-1 block">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Content</div>
                  <div className="text-xs text-on-surface-variant">Tối đa {MAX_CONTENT_CHARS} ký tự</div>
                </div>
                <textarea
                  className="min-h-44 w-full rounded-lg bg-white px-4 py-3 text-sm border border-outline-variant text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form?.content || ''}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value.slice(0, MAX_CONTENT_CHARS) }))}
                  placeholder="Write content..."
                  disabled={formBusy}
                />
              </label>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tags</div>
                  <div className="text-xs text-on-surface-variant">
                    Chọn {MIN_TAGS_PER_POST}–{MAX_TAGS_PER_POST} tag
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mergedTagOptions.map((opt) => {
                    const active = selectedTags.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleTag(opt.value)}
                        disabled={formBusy}
                        className={
                          active
                            ? 'h-9 rounded-full px-3 text-xs font-bold border border-primary bg-primary/15 text-primary'
                            : 'h-9 rounded-full px-3 text-xs font-bold border border-outline-variant text-on-surface-variant hover:bg-surface'
                        }
                        title={opt.value}
                      >
                        {tagOptionsByValue.get(String(opt.value))?.label || opt.label}
                      </button>
                    );
                  })}
                </div>

                {selectedTags.length < MIN_TAGS_PER_POST ? (
                  <div className="text-xs text-error">Vui lòng chọn tối thiểu {MIN_TAGS_PER_POST} tag.</div>
                ) : null}
              </div>

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
                          {src ? <img src={src} alt="Ảnh xem trước" className="h-28 w-full object-cover" /> : null}
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
              >
                Save Draft
              </button>
            ) : null}

            <button
              type="button"
              onClick={handlePublish}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
              disabled={formBusy || selectedTags.length < MIN_TAGS_PER_POST}
              title={selectedTags.length < MIN_TAGS_PER_POST ? `Vui lòng chọn tối thiểu ${MIN_TAGS_PER_POST} tag.` : undefined}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
