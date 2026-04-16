/**
 * ManagerPostsPage.jsx
 * Manager page for system posts/blog moderation and creation.
 */

import { useEffect, useMemo, useState } from 'react';
import managerApi from '../../services/manager/managerApi';
import { useNotification } from '../../context/NotificationContext';

const STATUS = ['Pending', 'Posted', 'Rejected', 'Deleted'];

export default function ManagerPostsPage() {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', images: [] });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const query = useMemo(
    () => ({ page, limit, status: status || undefined, search: search || undefined }),
    [page, limit, status, search]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', images: [] });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (post) => {
    setEditing(post);
    setForm({
      title: post?.title || '',
      content: post?.content || '',
      // Existing images are URLs (strings). New picks are {file, previewUrl}
      images: Array.isArray(post?.images) ? post.images : [],
    });
    setFormError('');
    setShowForm(true);
  };

  async function load() {
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
        ? 'Unauthorized: API requires login token. If you are testing without DB/auth, enable bypass or use seeded token.'
        : e?.response?.data?.message || e?.message || 'Failed to load posts';

      setError(msg);
      setItems([]);
      notify.notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.status, query.search]);

  const onPickFiles = async (files) => {
    setFormError('');
    try {
      const list = Array.from(files || []);
      if (list.length === 0) return;

      // Keep File objects for multipart upload; create object URLs only for preview
      const previews = list.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) }));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...previews] }));
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
      const newFiles = form.images.filter((x) => x && typeof x === 'object' && x.file instanceof File);
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
      notify.notifySuccess('Post saved successfully');
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
    if (!window.confirm('Approve this post?')) return;
    try {
      await managerApi.approvePost(id);
      await load();
      notify.notifySuccess('Post approved successfully');
    } catch (e) {
      notify.notifyError(e?.response?.data?.message || e?.message || 'Approve failed');
    }
  };

  const remove = async (post) => {
    const id = post?._id || post?.id;
    if (!id) return;
    if (!window.confirm('Delete (soft) this post?')) return;
    try {
      await managerApi.deletePost(id);
      await load();
      notify.notifySuccess('Post deleted successfully');
    } catch (e) {
      notify.notifyError(e?.response?.data?.message || e?.message || 'Delete failed');
    }
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
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</div>
              <select
                className="h-10 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

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
          </div>

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

        {error ? <div className="text-sm text-error">{error}</div> : null}
        {loading ? <div className="text-sm text-on-surface-variant">Loading...</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Owner</th>
                <th className="py-3 pr-4">Updated</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((p) => {
                const id = p?._id || p?.id;
                return (
                  <tr key={id} className="align-top">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-black">{p?.title || '(no title)'}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{p?.content || ''}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full border border-outline-variant px-2 py-1 text-xs">
                        {p?.status || '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700">
                      {p?.ownerName || p?.ownerId?.name || p?.ownerId || '-'}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700">
                      {p?.updatedAt ? new Date(p.updatedAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
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
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && items.length === 0 ? (
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
                  Images are uploaded as data-uri base64.
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
                      <div className="text-xs font-bold uppercase tracking-widest text-black">Images</div>
                      <div className="text-xs text-gray-600 mt-1">Add multiple images. You can remove any preview.</div>
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
                  onClick={submitForm}
                  className="h-11 rounded-lg px-6 text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
                  disabled={formBusy}
                >
                  {formBusy ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
