import { useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import communityService from '../../../../services/communityService';
import uploadService from '../../../../services/uploadService';
import publicApi from '../../../../services/public/publicApi';
import { useNotification } from '../../../../context/NotificationContext';

Modal.setAppElement('#root');

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

// UI constraints
const MAX_IMAGES_PER_POST = 6;
const MIN_TAGS_PER_POST = 1;
const MAX_TAGS_PER_POST = 3;
const MAX_TITLE_CHARS = 200;
const MAX_CONTENT_CHARS = 10000;

const INITIAL_FORM = {
  title: '',
  content: '',
  tags: [],
  images: [], // string urls OR { file: File, previewUrl: string }
};

function revokePreviewUrl(url) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

function buildPickedImagePreviews(files) {
  return Array.from(files || [])
    .filter((f) => f instanceof File)
    .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
}

export default function CreatePostModal({ isOpen, onClose, onSuccess, editingPost = null }) {
  const { notifySuccess, notifyError, notifyInfo, notifyWarning } = useNotification();
  const [loading, setLoading] = useState(false);
  const [tagOptions, setTagOptions] = useState(FALLBACK_POST_TAG_OPTIONS);
  const [form, setForm] = useState(INITIAL_FORM);

  const isEditing = Boolean(editingPost?.id);

  // Load tag options
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  const selectedTags = useMemo(() => (Array.isArray(form?.tags) ? form.tags : []), [form?.tags]);
  const knownTagValues = useMemo(() => new Set((tagOptions || []).map((t) => String(t.value))), [tagOptions]);

  // Keep previously selected tags visible even if public tags list differs
  const mergedTagOptions = useMemo(() => {
    const extras = selectedTags
      .filter((v) => v && !knownTagValues.has(String(v)))
      .map((v) => ({ value: String(v), label: String(v) }));
    return [...(tagOptions || []), ...extras];
  }, [tagOptions, selectedTags, knownTagValues]);

  // Initialize / hydrate form when opening modal
  useEffect(() => {
    if (!isOpen) return;

    if (!isEditing) {
      setForm(INITIAL_FORM);
      return;
    }

    const incomingTags = Array.isArray(editingPost?.tags)
      ? editingPost.tags.map((x) => String(x || '').trim()).filter(Boolean)
      : [];

    const fallbackTag = String(editingPost?.tag || '').trim();
    const tags = (incomingTags.length > 0 ? incomingTags : fallbackTag ? [fallbackTag] : []).slice(0, MAX_TAGS_PER_POST);

    const incomingImages = Array.isArray(editingPost?.images)
      ? editingPost.images.map((x) => String(x || '').trim()).filter(Boolean)
      : [];

    const fallbackImage = String(editingPost?.image || '').trim();
    const images = (incomingImages.length > 0 ? incomingImages : fallbackImage ? [fallbackImage] : []).slice(0, MAX_IMAGES_PER_POST);

    setForm({
      title: String(editingPost?.title || '').trim(),
      content: String(editingPost?.content || ''),
      tags,
      images,
    });
  }, [isOpen, isEditing, editingPost]);

  const clearForm = () => {
    (form?.images || []).forEach((img) => {
      if (img && typeof img === 'object') revokePreviewUrl(img.previewUrl);
    });
    setForm(INITIAL_FORM);
  };

  const handleClose = () => {
    clearForm();
    setLoading(false);
    onClose?.();
  };

  const toggleTag = (value) => {
    const v = String(value || '').trim();
    if (!v) return;

    setForm((prev) => {
      const next = new Set(Array.isArray(prev?.tags) ? prev.tags : []);
      if (next.has(v)) next.delete(v);
      else next.add(v);

      const nextArr = Array.from(next);
      if (nextArr.length > MAX_TAGS_PER_POST) {
        notifyWarning(`Bạn chỉ được chọn tối đa ${MAX_TAGS_PER_POST} tag cho 1 bài.`);
        return prev;
      }

      return { ...prev, tags: nextArr };
    });
  };

  const onPickFiles = (files) => {
    try {
      const picked = buildPickedImagePreviews(files);
      if (!picked.length) return;

      const currentTotalCount = Array.isArray(form?.images) ? form.images.length : 0;
      const remaining = Math.max(0, MAX_IMAGES_PER_POST - currentTotalCount);

      if (remaining <= 0) {
        notifyWarning(`Bạn chỉ được upload tối đa ${MAX_IMAGES_PER_POST} ảnh mỗi bài viết.`);
        // revoke previews we just created
        picked.forEach((x) => revokePreviewUrl(x.previewUrl));
        return;
      }

      const accepted = picked.slice(0, remaining);
      const rejected = picked.slice(remaining);
      rejected.forEach((x) => revokePreviewUrl(x.previewUrl));

      setForm((prev) => ({ ...prev, images: [...(prev?.images || []), ...accepted] }));

      if (rejected.length > 0) {
        notifyInfo(`Đã bỏ qua ${rejected.length} ảnh vì vượt quá giới hạn ${MAX_IMAGES_PER_POST} ảnh.`);
      }
    } catch (err) {
      notifyError(err?.message || 'Không thể đọc ảnh đã chọn.');
    }
  };

  const removeImageAt = (idx) => {
    setForm((prev) => {
      const target = prev?.images?.[idx];
      if (target && typeof target === 'object') revokePreviewUrl(target.previewUrl);
      return { ...prev, images: (prev?.images || []).filter((_, i) => i !== idx) };
    });
  };

  const validatePublish = () => {
    const title = String(form?.title || '').trim();
    const content = String(form?.content || '').trim();
    const tags = Array.isArray(form?.tags) ? form.tags.filter(Boolean) : [];

    if (!title) return 'Tiêu đề là bắt buộc.';
    if (title.length > MAX_TITLE_CHARS) return `Tiêu đề tối đa ${MAX_TITLE_CHARS} ký tự.`;

    if (!content) return 'Nội dung là bắt buộc.';
    if (content.length > MAX_CONTENT_CHARS) return `Nội dung tối đa ${MAX_CONTENT_CHARS} ký tự.`;

    if (tags.length < MIN_TAGS_PER_POST) return `Vui lòng chọn tối thiểu ${MIN_TAGS_PER_POST} tag.`;

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validatePublish();
    if (err) {
      notifyWarning(err);
      return;
    }

    setLoading(true);
    try {
      const localFiles = (form?.images || []).filter((x) => x && typeof x === 'object' && x.file instanceof File).map((x) => x.file);
      const newUploadedUrls = localFiles.length > 0 ? await uploadService.uploadImages(localFiles) : [];

      const existingUrls = (form?.images || [])
        .filter((x) => typeof x === 'string')
        .map((x) => String(x || '').trim())
        .filter(Boolean);

      const finalImageUrls = [...existingUrls, ...newUploadedUrls].slice(0, MAX_IMAGES_PER_POST);
      const tags = Array.isArray(form?.tags) ? form.tags.filter(Boolean) : [];
      const primaryTag = tags[0] || 'General';

      const reqPayload = {
        title: String(form?.title || '').trim(),
        content: String(form?.content || '').trim(),
        tag: primaryTag,
        tags,
        image: finalImageUrls[0] || '',
        images: finalImageUrls,
        // also send postTags for newer BE variants
        postTags: tags,
      };

      const result = isEditing
        ? await communityService.updateMyPost(editingPost.id, reqPayload)
        : await communityService.createPost(reqPayload);

      notifySuccess(
        isEditing
          ? 'Đã cập nhật bài viết. Bài viết sẽ được duyệt lại.'
          : 'Bài viết đã được gửi! Vui lòng chờ Admin duyệt.'
      );
      onSuccess?.(result?.item || null);
      handleClose();
    } catch (err2) {
      notifyError(err2?.response?.data?.message || err2?.message || 'Không thể xử lý bài viết.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup when closing modal
  useEffect(() => {
    if (isOpen) return;
    clearForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Create Post Modal"
      className="mx-auto mt-20 w-full max-w-4xl outline-none"
      overlayClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto"
    >
      <div className="w-full rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl my-10">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-headline font-bold">{isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {isEditing
                ? 'Sau khi sửa, bài viết sẽ chuyển về trạng thái Pending và cần duyệt lại.'
                : 'Bài viết của bạn sẽ chuyển về Pending và cần duyệt trước khi công khai.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            disabled={loading}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tags</div>
                    <div className="text-xs text-on-surface-variant">
                      Chọn {MIN_TAGS_PER_POST}-{MAX_TAGS_PER_POST} tag
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
                          disabled={loading}
                          className={
                            active
                              ? 'h-9 rounded-full px-3 text-xs font-bold border border-primary bg-primary/15 text-primary'
                              : 'h-9 rounded-full px-3 text-xs font-bold border border-outline-variant text-on-surface-variant hover:bg-surface'
                          }
                          title={opt.value}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {selectedTags.length < MIN_TAGS_PER_POST ? (
                    <div className="text-xs text-error">Vui lòng chọn tối thiểu {MIN_TAGS_PER_POST} tag.</div>
                  ) : null}
                </div>
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
                      disabled={loading}
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
                              disabled={loading}
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
                onClick={handleClose}
                className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
                disabled={loading || selectedTags.length < MIN_TAGS_PER_POST}
                title={
                  selectedTags.length < MIN_TAGS_PER_POST ? `Vui lòng chọn tối thiểu ${MIN_TAGS_PER_POST} tag.` : undefined
                }
              >
                {loading ? 'Đang xử lý...' : isEditing ? 'Lưu cập nhật' : 'Publish'}
              </button>
            </div>

            <div className="mt-4">
              <p className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant">
                * Bài viết sẽ được Admin duyệt trước khi công khai.
              </p>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
