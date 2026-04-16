/**
 * ManagerPostsPage.jsx
 * Manager page for system posts/blog moderation and creation.
 */

import { useEffect, useMemo, useState } from 'react';
import managerApi from '../../services/manager/managerApi';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const STATUS = ['Pending', 'Posted', 'Rejected', 'Deleted'];

export default function ManagerPostsPage() {
  const notify = useNotification();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([]);
  const [draftItems, setDraftItems] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [tableOwner, setTableOwner] = useState(''); // '' | 'Draft' | 'AdminAccount' | 'UserAccount'

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const [draftAction, setDraftAction] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // draftAction: { type: 'publish'|'delete', id: string }

  // Local-only drafts (no DB/schema changes)
  // Rules:
  // - Stored as a list so they can appear in the table like normal posts
  // - Images are not persisted (File cannot be serialized safely). Draft rows show no images.
  const DRAFT_LIST_KEY = useMemo(
    () => `manager.posts.drafts.${String(user?._id || user?.id || 'anon')}`,
    [user?._id, user?.id]
  );

  const [form, setForm] = useState({ title: '', content: '', images: [] });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');


  const query = useMemo(
    () => ({
      page,
      limit,
      status: status && status !== 'Draft' ? status : undefined,
      q: search || undefined,
    }),
    [page, limit, status, search]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.status, query.search]);

  // client-side fuzzy-ish search (relative match) over the merged list
  const clientSearchNeedle = useMemo(() => String(search || '').trim().toLowerCase(), [search]);

  useEffect(() => {
    refreshDraftItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAFT_LIST_KEY]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', images: [] });
    setFormError('');
    setShowForm(true);
  };

  const openEditDraft = (draftId) => {
    const draft = getDraftById(draftId);
    if (!draft) {
      notify.notifyWarning('Draft not found.');
      return;
    }

    setEditing({ ...draft, __localDraft: true });
    setForm({ title: draft.postName || '', content: draft.postContent || '', images: [] });
    setFormError('');
    setShowForm(true);
  };

  const requestDraftPublish = (draftId) => setDraftAction({ type: 'publish', id: String(draftId) });
  const requestDraftDelete = (draftId) => setDraftAction({ type: 'delete', id: String(draftId) });
  const cancelDraftAction = () => setDraftAction(null);

  const requestConfirm = (action) => setConfirmAction(action);
  const cancelConfirm = () => setConfirmAction(null);

  const confirmRequestedAction = async () => {
    const action = confirmAction;
    if (!action) return;
    setConfirmAction(null);

    try {
      await action.onConfirm();
    } catch (e) {
      // onConfirm is responsible for notifying; swallow here to avoid unhandled rejection
    }
  };

  const confirmDraftAction = async () => {
    const action = draftAction;
    if (!action?.id) return;

    if (action.type === 'delete') {
      deleteDraftById(action.id);
      notify.notifySuccess('Draft deleted');
      setDraftAction(null);
      return;
    }

    if (action.type === 'publish') {
      await publishDraft(action.id);
      setDraftAction(null);
    }
  };

  const publishDraft = async (draftId) => {
    const draft = getDraftById(draftId);
    if (!draft) {
      notify.notifyWarning('Draft not found.');
      return;
    }

    // using app notification instead of blocking browser confirm

    setFormBusy(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.set('postName', draft.postName || '');
      fd.set('postContent', draft.postContent || '');
      await managerApi.createPost(fd);
      deleteDraftById(draftId);
      await load();
      notify.notifySuccess('Đã publish draft thành công');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Publish draft failed';
      setFormError(msg);
      notify.notifyError(msg);
    } finally {
      setFormBusy(false);
    }
  };

  const saveDraftFromForm = () => {
    const title = String(form?.title || '').trim();
    if (!title) {
      notify.notifyWarning('Title is required to save draft.');
      return;
    }

    const existingId = editing?.__localDraft ? editing?._id || editing?.id : null;
    const savedId = addOrUpdateDraft({ _id: existingId, postName: title, postContent: form?.content || '' });

    setEditing((prev) => (prev?.__localDraft ? { ...prev, _id: savedId } : prev));
    notify.notifySuccess('Đã lưu draft vào danh sách');
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await managerApi.getPosts(query);
      // BE may return {items, pagination} or {data}
      const list = data?.items || data?.data || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      const statusCode = e?.response?.status;
      const isUnauthorized = statusCode === 401 || statusCode === 403;

      const msg = isUnauthorized
        ? 'Unauthorized: API requires login token.'
        : e?.response?.data?.message || e?.message || 'Failed to load posts';

      setError(msg);
      setItems([]);
      notify.notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onPickFiles = async (files) => {
    setFormError('');
    try {
      const list = Array.from(files || []);
      if (list.length === 0) return;

      const MAX_IMAGES = 6;

      // Count only "new" images (objects) because existing images can be URLs (strings)
      const currentNewCount = form.images.filter((x) => x && typeof x === 'object' && x.file instanceof File).length;
      const remaining = Math.max(0, MAX_IMAGES - currentNewCount);

      if (remaining <= 0) {
        const msg = `Bạn chỉ được upload tối đa ${MAX_IMAGES} ảnh mỗi bài viết.`;
        setFormError(msg);
        notify.notifyWarning(msg);
        return;
      }

      const accepted = list.slice(0, remaining);
      const rejectedCount = list.length - accepted.length;

      // Keep File objects for multipart upload; create object URLs only for preview
      const previews = accepted.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) }));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...previews] }));

      if (rejectedCount > 0) {
        notify.notifyInfo(`Đã bỏ qua ${rejectedCount} ảnh vì vượt quá giới hạn ${MAX_IMAGES} ảnh.`);
      }
    } catch (e) {
      setFormError(e?.message || 'Failed to read images');
    }
  };

  const removeImageAt = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const submitForm = async () => {
    setFormBusy(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.set('postName', form.title);
      fd.set('postContent', form.content);

      // Append only newly selected files; existing URLs remain on the post unless user re-uploads.
      const MAX_IMAGES = 6;
      const newFiles = form.images.filter((x) => x && typeof x === 'object' && x.file instanceof File).slice(0, MAX_IMAGES);
      newFiles.forEach((x) => fd.append('images', x.file));

      if (editing?._id || editing?.id) {
        const id = editing._id || editing.id;
        await managerApi.updatePost(id, fd);
      } else {
        await managerApi.createPost(fd);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ title: '', content: '', images: [] });
      await load();
      notify.notifySuccess('Đã đăng bài (Publish) thành công');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save post';
      setFormError(msg);
      notify.notifyError(msg);
    } finally {
      setFormBusy(false);
    }
  };

  const approve = async (post) => {
    const id = post?._id || post?.id;
    if (!id) return;

    requestConfirm({
      type: 'approve',
      title: 'Confirm',
      message: 'Bạn chắc chắn muốn Approve bài đăng này?',
      confirmText: 'Approve',
      variant: 'primary',
      onConfirm: async () => {
        try {
          await managerApi.approvePost(id);
          await load();
          notify.notifySuccess('Post approved successfully');
        } catch (e) {
          notify.notifyError(e?.response?.data?.message || e?.message || 'Approve failed');
          throw e;
        }
      },
    });
  };

  const remove = async (post) => {
    const id = post?._id || post?.id;
    if (!id) return;

    requestConfirm({
      type: 'delete',
      title: 'Confirm',
      message: 'Bạn chắc chắn muốn xoá (soft) bài đăng này?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await managerApi.deletePost(id);
          await load();
          notify.notifySuccess('Post deleted successfully');
        } catch (e) {
          notify.notifyError(e?.response?.data?.message || e?.message || 'Delete failed');
          throw e;
        }
      },
    });
  };

  const getPostImages = (post) => {
    const imgs = post?.postImage || post?.images || [];
    return Array.isArray(imgs) ? imgs.filter(Boolean) : [];
  };

  const getPostTitle = (post) => post?.postName || post?.title || '';
  const getPostContent = (post) => post?.postContent || post?.content || '';

  const readDraftList = () => {
    try {
      const raw = localStorage.getItem(DRAFT_LIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeDraftList = (list) => {
    try {
      localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    } catch {
      // ignore
    }
  };

  const refreshDraftItems = () => {
    const list = readDraftList();
    setDraftItems(Array.isArray(list) ? list : []);
  };

  const addOrUpdateDraft = ({ _id, postName, postContent }) => {
    const now = new Date().toISOString();
    const list = readDraftList();

    const safeId = _id || `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const next = {
      _id: safeId,
      postName: String(postName || '').trim(),
      postContent: String(postContent || ''),
      status: 'Draft',
      postOwnerModel: 'AdminAccount',
      postOwnerID: String(user?._id || user?.id || ''),
      createdAt: now,
      updatedAt: now,
      __localDraft: true,
    };

    const idx = list.findIndex((x) => String(x?._id) === String(safeId));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...next, updatedAt: now };
    } else {
      list.unshift(next);
    }

    writeDraftList(list);
    refreshDraftItems();
    return safeId;
  };

  const deleteDraftById = (draftId) => {
    const list = readDraftList().filter((x) => String(x?._id) !== String(draftId));
    writeDraftList(list);
    refreshDraftItems();
  };

  const getDraftById = (draftId) => {
    const list = readDraftList();
    return list.find((x) => String(x?._id) === String(draftId)) || null;
  };

  const displayedItems = useMemo(() => {
    const merged = [...(draftItems || []), ...(items || [])];

    return merged.filter((p) => {
      const isLocalDraft = !!p?.__localDraft || String(p?.status) === 'Draft';

      // Filter by status (Draft included)
      if (status) {
        if (status === 'Draft') {
          if (!isLocalDraft) return false;
        } else {
          if (isLocalDraft) return false;
          if (String(p?.status) !== String(status)) return false;
        }
      }

      // Filter by owner model (Draft treated separately)
      if (tableOwner) {
        if (tableOwner === 'Draft') {
          if (!isLocalDraft) return false;
        } else {
          if (isLocalDraft) return false;
          if (String(p?.postOwnerModel || '') !== String(tableOwner)) return false;
        }
      }

      // Client-side relative/fuzzy-ish search: match if ALL tokens appear in title/content
      if (clientSearchNeedle) {
        const hay = `${String(p?.postName || p?.title || '')} ${String(p?.postContent || p?.content || '')}`
          .toLowerCase()
          .trim();

        const tokens = clientSearchNeedle.split(/\s+/).filter(Boolean);
        if (tokens.length && !tokens.every((t) => hay.includes(t))) return false;
      }

      return true;
    });
  }, [draftItems, items, status, tableOwner, clientSearchNeedle]);

  const resetFilters = () => {
    setStatus('');
    setTableOwner('');
    setSearch('');
    setPage(1);
  };

  const openPreview = (post) => {
    if (!post) return;
    setPreviewing(post);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Posts</h1>
          <p className="text-sm text-on-surface-variant">Manage all system posts and approve owner submissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-primary/20 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            New Post
          </button>
        </div>
      </header>

      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Search</div>
              <input
                className="h-10 w-full sm:w-80 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black placeholder:text-gray-500"
                placeholder="Title/content..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
              title="Reset Status/Owner/Search"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Page size</div>
              <select
                className="h-10 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black"
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error ? <div className="text-sm text-error">{error}</div> : null}
        {loading ? <div className="text-sm text-on-surface-variant">Loading...</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                <th className="py-3 pr-4">No</th>
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <select
                      className="h-8 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black"
                      value={status}
                      onChange={(e) => {
                        setPage(1);
                        setStatus(e.target.value);
                      }}
                    >
                      <option value="">All</option>
                      <option value="Draft">Draft</option>
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span>Owner</span>
                    <select
                      className="h-8 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black"
                      value={tableOwner}
                      onChange={(e) => {
                        setPage(1);
                        setTableOwner(e.target.value);
                      }}
                    >
                      <option value="">All</option>
                      <option value="Draft">Draft (Local)</option>
                      <option value="AdminAccount">Manager/Admin</option>
                      <option value="UserAccount">Owner</option>
                    </select>
                  </div>
                </th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Updated</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {displayedItems.map((p, idx) => {
                const id = p?._id || p?.id;
                const isLocalDraft = !!p?.__localDraft || String(p?.status) === 'Draft';
                return (
                  <tr key={id} className="align-top">
                    <td className="py-3 pr-4 text-xs text-on-surface-variant">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-black">{p?.postName || p?.title || '(no title)'}</div>
                      <div className="text-xs text-on-surface-variant line-clamp-2">{p?.postContent || p?.content || ''}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full border border-outline-variant px-2 py-1 text-xs">
                        {isLocalDraft ? 'Draft' : p?.status || '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {p?.ownerName || p?.ownerId?.name || p?.ownerId || '-'}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {p?.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {p?.updatedAt ? new Date(p.updatedAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openPreview(p)}
                          className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
                          title="Preview"
                        >
                          Preview
                        </button>

                        {isLocalDraft ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditDraft(id)}
                              className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => requestDraftPublish(id)}
                              className="h-9 rounded-lg px-3 text-xs font-bold bg-primary text-on-primary hover:opacity-90"
                            >
                              Publish
                            </button>

                            <button
                              type="button"
                              onClick={() => requestDraftDelete(id)}
                              className="h-9 rounded-lg px-3 text-xs font-bold border border-error text-error hover:bg-error hover:text-on-error"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!canEditPost(p)}
                              title={!canEditPost(p) ? 'Chỉ được sửa bài đăng do chính bạn tạo' : 'Edit'}
                            >
                              Edit
                            </button>

                            {String(p?.status) === 'Pending' ? (
                              <button
                                type="button"
                                onClick={() => approve(p)}
                                className="h-9 rounded-lg px-3 text-xs font-bold bg-primary text-on-primary hover:opacity-90"
                              >
                                Approve
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => remove(p)}
                              className="h-9 rounded-lg px-3 text-xs font-bold border border-error text-error hover:bg-error hover:text-on-error"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-on-surface-variant">
                    No posts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="h-10 rounded-lg px-3 text-sm border border-outline-variant hover:bg-surface disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <div className="text-sm text-on-surface-variant">Page {page}</div>
          <button
            type="button"
            className="h-10 rounded-lg px-3 text-sm border border-outline-variant hover:bg-surface disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            Next
          </button>
        </div>
      </section>

      {showForm ? (
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
                onClick={() => setShowForm(false)}
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
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Post title"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Content</div>
                    <textarea
                      className="min-h-44 w-full rounded-lg bg-white px-4 py-3 text-sm border border-outline-variant text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={form.content}
                      onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                      placeholder="Write content..."
                    />
                  </label>

                  {formError ? (
                    <div className="rounded-lg border border-error/60 bg-error/10 p-3 text-sm text-error">{formError}</div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Images</div>
                      <div className="text-xs text-on-surface-variant mt-1">Add multiple images (Max 6 images). You can remove any preview.</div>
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
                    {form.images.length ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {form.images.map((img, idx) => {
                          const src = typeof img === 'string' ? img : img?.previewUrl;
                          return (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface">
                              {src ? <img src={src} alt="preview" className="h-28 w-full object-cover" /> : null}
                              <button
                                type="button"
                                onClick={() => {
                                  if (img && typeof img === 'object' && img.previewUrl) {
                                    try {
                                      URL.revokeObjectURL(img.previewUrl);
                                    } catch {
                                      // ignore
                                    }
                                  }
                                  removeImageAt(idx);
                                }}
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
                  onClick={() => setShowForm(false)}
                  className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface"
                  disabled={formBusy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveDraftFromForm}
                  className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
                  disabled={formBusy}
                  title="Lưu nháp vào danh sách Draft (localStorage)"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={submitForm}
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
      ) : null}

      {previewing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white border border-outline-variant shadow-2xl my-10 overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6 bg-surface-container-high">
              <div>
                <h2 className="text-xl font-headline font-bold">Preview (Khách hàng sẽ thấy)</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Đây là preview theo dữ liệu hiện tại của bài đăng. (Không thay đổi dữ liệu)
                </p>
              </div>
              <button
                type="button"
                className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
                onClick={() => setPreviewing(null)}
              >
                Close
              </button>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <article className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-black break-words">{getPostTitle(previewing) || '(no title)'}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex rounded-full border border-outline-variant px-2 py-1">
                      Status: {previewing?.status || '-'}
                    </span>
                    {previewing?.updatedAt ? (
                      <span className="text-gray-600">Updated: {new Date(previewing.updatedAt).toLocaleString()}</span>
                    ) : null}
                  </div>
                </div>

                {getPostImages(previewing).length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getPostImages(previewing)
                      .slice(0, 6)
                      .map((src, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-outline-variant bg-surface">
                          <img src={src} alt={`post-${idx}`} className="w-full h-56 object-cover" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-outline-variant bg-surface p-4 text-sm text-gray-500">No images.</div>
                )}

                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-black leading-7">{getPostContent(previewing) || '(no content)'}</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      ) : null}

      {draftAction ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl">
            <div className="px-5 py-4 border-b border-outline-variant">
              <div className="text-sm font-bold text-black">Confirm</div>
              <div className="text-xs text-on-surface-variant mt-1">
                {draftAction.type === 'publish' ? 'Bạn chắc chắn muốn Publish draft này?' : 'Bạn chắc chắn muốn xoá draft này?'}
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelDraftAction}
                className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDraftAction}
                className={`h-10 rounded-lg px-4 text-sm font-bold ${
                  draftAction.type === 'publish'
                    ? 'bg-primary text-on-primary hover:opacity-90'
                    : 'bg-error text-on-error hover:opacity-90'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="fixed inset-0 z-[61] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl">
            <div className="px-5 py-4 border-b border-outline-variant">
              <div className="text-sm font-bold text-black">{confirmAction.title || 'Confirm'}</div>
              <div className="text-xs text-on-surface-variant mt-1">{confirmAction.message}</div>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelConfirm}
                className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRequestedAction}
                className={`h-10 rounded-lg px-4 text-sm font-bold ${
                  confirmAction.variant === 'danger'
                    ? 'bg-error text-on-error hover:opacity-90'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {confirmAction.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
