/**
 * ManagerPostsPage.jsx
 * Manager page for system posts/blog moderation and creation.
 */

import { useEffect, useMemo, useState } from 'react';

import managerApi from '../../services/manager/managerApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

import PostConfirmModal from './posts/PostConfirmModal';
import PostFormModal from './posts/PostFormModal';
import PostPreviewModal from './posts/PostPreviewModal';
import PostsTable from './posts/PostsTable';

import { createConfirmAction } from './posts/postConfirmActions';
import { filterPostLikeList } from './posts/postFilters';
import { isLocalDraftPost } from './posts/postFormatters';
import { addOrUpdateDraft, deleteDraftById, getDraftById, loadDraftItems } from './posts/postsDraftsAdapter';
import { canEditPost as canEditPostPermission } from './posts/postsPermissions';

const STATUS = ['Pending', 'Posted', 'Rejected', 'Deleted'];

export default function ManagerPostsPage() {
  const notify = useNotification();
  const { user } = useAuth();

  const userId = String(user?._id || user?.id || '');

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

  const [draftAction, setDraftAction] = useState(null); // { type: 'publish'|'delete', id: string }
  const [confirmAction, setConfirmAction] = useState(null); // {title,message,variant,confirmText,onConfirm}

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

  const clientSearchNeedle = useMemo(() => String(search || '').trim().toLowerCase(), [search]);

  useEffect(() => {
    refreshDraftItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const refreshDraftItems = () => {
    setDraftItems(loadDraftItems({ userId }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', images: [] });
    setFormError('');
    setShowForm(true);
  };

  const openEditDraft = (draftId) => {
    const draft = getDraftById({ userId, draftId: String(draftId) });
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
    } catch {
      // onConfirm is responsible for notifying
    }
  };

  const publishDraft = async (draftId) => {
    const draft = getDraftById({ userId, draftId: String(draftId) });
    if (!draft) {
      notify.notifyWarning('Draft not found.');
      return;
    }

    setFormBusy(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.set('postName', draft.postName || '');
      fd.set('postContent', draft.postContent || '');
      await managerApi.createPost(fd);

      deleteDraftById({ userId, draftId: String(draftId) });
      refreshDraftItems();
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

  const confirmDraftAction = async () => {
    const action = draftAction;
    if (!action?.id) return;

    if (action.type === 'delete') {
      deleteDraftById({ userId, draftId: String(action.id) });
      refreshDraftItems();
      notify.notifySuccess('Draft deleted');
      setDraftAction(null);
      return;
    }

    if (action.type === 'publish') {
      await publishDraft(action.id);
      setDraftAction(null);
    }
  };

  const saveDraftFromForm = () => {
    const title = String(form?.title || '').trim();
    if (!title) {
      notify.notifyWarning('Title is required to save draft.');
      return;
    }

    const existingId = editing?.__localDraft ? editing?._id || editing?.id : null;
    const savedId = addOrUpdateDraft({
      userId,
      draftId: existingId,
      postName: title,
      postContent: form?.content || '',
    });

    refreshDraftItems();
    setEditing((prev) => (prev?.__localDraft ? { ...prev, _id: savedId } : prev));
    notify.notifySuccess('Đã lưu draft vào danh sách');
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await managerApi.getPosts(query);
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

  const canEditPost = (post) => canEditPostPermission({ post, user });

  const openEdit = (post) => {
    if (!post) return;

    if (!canEditPost(post)) {
      notify.notifyWarning('Bạn chỉ được sửa bài đăng do chính bạn tạo.');
      return;
    }

    setEditing(post);
    setForm({
      title: post?.postName || post?.title || '',
      content: post?.postContent || post?.content || '',
      images: [],
    });
    setFormError('');
    setShowForm(true);
  };

  const submitForm = async () => {
    setFormBusy(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.set('postName', form.title);
      fd.set('postContent', form.content);

      // images are appended inside BE form parser; UI adds previews only
      // Keep backward compatible with current managerApi which expects multipart/form-data
      (form?.images || [])
        .filter((x) => x && typeof x === 'object' && x.file instanceof File)
        .slice(0, 6)
        .forEach((x) => fd.append('images', x.file));

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

    requestConfirm(
      createConfirmAction({
        type: 'approve',
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
      })
    );
  };

  const remove = async (post) => {
    const id = post?._id || post?.id;
    if (!id) return;

    requestConfirm(
      createConfirmAction({
        type: 'delete',
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
      })
    );
  };

  const displayedItems = useMemo(() => {
    const merged = [...(draftItems || []), ...(items || [])];

    return filterPostLikeList({
      merged,
      status,
      tableOwner,
      searchNeedle: clientSearchNeedle,
      isLocalDraft: isLocalDraftPost,
      getTitle: (p) => p?.postName || p?.title || '',
      getContent: (p) => p?.postContent || p?.content || '',
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

        <PostsTable
          loading={loading}
          items={displayedItems}
          page={page}
          limit={limit}
          status={status}
          onChangeStatus={(v) => {
            setPage(1);
            setStatus(v);
          }}
          tableOwner={tableOwner}
          onChangeOwner={(v) => {
            setPage(1);
            setTableOwner(v);
          }}
          onPreview={openPreview}
          onEditDraft={openEditDraft}
          onPublishDraft={requestDraftPublish}
          onDeleteDraft={requestDraftDelete}
          onEdit={openEdit}
          canEditPost={canEditPost}
          onApprove={approve}
          onDelete={remove}
        />

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

      <PostFormModal
        open={showForm}
        editing={editing}
        form={form}
        setForm={setForm}
        formBusy={formBusy}
        formError={formError}
        onClose={() => setShowForm(false)}
        onSaveDraft={saveDraftFromForm}
        onPublish={submitForm}
        notify={notify}
      />

      <PostPreviewModal open={!!previewing} post={previewing} onClose={() => setPreviewing(null)} />

      <PostConfirmModal
        open={!!draftAction}
        title="Confirm"
        message={draftAction?.type === 'publish' ? 'Bạn chắc chắn muốn Publish draft này?' : 'Bạn chắc chắn muốn xoá draft này?'}
        confirmText="OK"
        confirmVariant={draftAction?.type === 'publish' ? 'primary' : 'danger'}
        onCancel={cancelDraftAction}
        onConfirm={confirmDraftAction}
        zIndexClassName="z-[60]"
      />

      <PostConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title || 'Confirm'}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText || 'OK'}
        confirmVariant={confirmAction?.variant === 'danger' ? 'danger' : 'primary'}
        onCancel={cancelConfirm}
        onConfirm={confirmRequestedAction}
        zIndexClassName="z-[61]"
      />
    </div>
  );
}
