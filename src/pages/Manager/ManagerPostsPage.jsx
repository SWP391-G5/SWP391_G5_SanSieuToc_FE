/**
 * ManagerPostsPage.jsx
 * Manager page for system posts/blog moderation and creation.
 * Business logic (load, approve, delete, draft actions, form submit) lives here.
 * Presentation is delegated to PostsToolbar, PostsTable, and PostsPagination.
 */

// 2. Third-party
import { useEffect, useMemo, useState } from 'react';

// 3. Internal — services & context
import managerApi from '../../services/manager/managerApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// 3. Internal — sub-components (posts feature folder)
import PostConfirmModal from './posts/PostConfirmModal';
import PostFormModal from './posts/PostFormModal';
import PostPreviewModal from './posts/PostPreviewModal';
import PostsPagination from './posts/PostsPagination';
import PostsTable from './posts/PostsTable';
import PostsToolbar from './posts/PostsToolbar';

// 3. Internal — posts utilities
import { createConfirmAction } from './posts/postConfirmActions';
import { filterPostLikeList } from './posts/postFilters';
import { isLocalDraftPost, getPostImages } from './posts/postFormatters';
import { canEditPost as canEditPostPermission } from './posts/postsPermissions';

export default function ManagerPostsPage() {
  const notify = useNotification();
  const { user } = useAuth();
  const userId = String(user?._id || user?.id || '');

  // ── Loading / error ──────────────────────────────────────────────────────
  // NOTE: We intentionally do NOT toggle loading for filter/pagination changes,
  // because the loading UI was causing pagination to jump back to page 1.
  const [loading] = useState(false);
  const [error, setError] = useState('');

  // ── Data ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [draftItems, setDraftItems] = useState([]);

  // Pagination metadata (we derive from the merged list to avoid page-size mismatch)
  const [totalPages, setTotalPages] = useState(1);

  // ── Filter / pagination state ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const limit = 10; // fixed 10 items per page
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [tableOwner, setTableOwner] = useState(''); // '' | 'Draft' | 'AdminAccount' | 'UserAccount'
  const [sortBy, setSortBy] = useState('created_desc'); // created_desc | created_asc | updated_desc | updated_asc
  const [tag, setTag] = useState(''); // '' | tag slug

  // ── Modal / action state ─────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [draftAction, setDraftAction] = useState(null); // { type: 'publish'|'delete', id }
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, variant, confirmText, onConfirm }

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({ title: '', content: '', images: [], tags: [] });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Query memo ───────────────────────────────────────────────────────────
  // NOTE: Pagination is fully handled client-side (fixed 10/page) to avoid
  // autoloading/page-jump issues caused by mixing server paging with local drafts.
  const query = useMemo(
    () => ({
      status: status && status !== 'Draft' ? status : undefined,
      q: search || undefined,
      sort: sortBy,
      tag: tag || undefined,
    }),
    [status, search, sortBy, tag]
  );

  // Client-side search needle for draft filtering
  const clientSearchNeedle = useMemo(() => String(search || '').trim().toLowerCase(), [search]);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.status, query.q, query.sort]);

  useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, query.q, query.sort]);

  // ── Draft helpers (DB) ───────────────────────────────────────────────────

  const loadDrafts = async () => {
    if (!userId) return;
    try {
      // Drafts are persisted in DB as status=Draft
      const data = await managerApi.getPosts({ status: 'Draft', q: query.q, sort: query.sort });
      const list = data?.items || data?.data || data || [];
      setDraftItems(Array.isArray(list) ? list : []);
    } catch {
      // keep drafts empty if API fails
      setDraftItems([]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', images: [], tags: [] });
    setFormError('');
    setShowForm(true);
  };

  const openEditDraft = (draftId) => {
    const draft = (draftItems || []).find((x) => String(x?._id || x?.id) === String(draftId));
    if (!draft) {
      notify.notifyWarning('Draft not found.');
      return;
    }
    setEditing({ ...draft, __dbDraft: true });
    setForm({
      title: draft.postName || '',
      content: draft.postContent || '',
      // IMPORTANT: always hydrate from postImage via helper
      images: getPostImages(draft),
      tags: Array.isArray(draft?.postTags) ? draft.postTags : [],
    });
    setFormError('');
    setShowForm(true);
  };

  const saveDraftFromForm = async () => {
    // Business rule: only Draft posts can be saved as Draft
    if (editing && String(editing?.status) !== 'Draft') {
      notify.notifyWarning('Bài đăng không ở trạng thái Draft nên không thể Save Draft.');
      return;
    }

    const title = String(form?.title || '').trim();
    if (!title) {
      notify.notifyWarning('Title is required to save draft.');
      return;
    }

    setFormBusy(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.set('postName', title);
      const contentStr = form?.content ? String(form.content) : '';
      fd.set('postContent', contentStr);
      fd.set('status', 'Draft');

      (form?.tags || []).forEach((t) => fd.append('postTags', t));

      const stringImages = (form?.images || []).filter((x) => typeof x === 'string' && x.trim());
      stringImages.slice(0, 6).forEach((url) => fd.append('postImage', url));

      (form?.images || [])
        .filter((x) => x && typeof x === 'object' && x.file instanceof File)
        .slice(0, Math.max(0, 6 - stringImages.length))
        .forEach((x) => fd.append('images', x.file));

      const editId = editing?._id || editing?.id;
      if (editId && editing?.__dbDraft) {
        await managerApi.updatePost(editId, fd);
      } else {
        await managerApi.createPost(fd);
      }

      await loadDrafts();
      setShowForm(false);
      setEditing(null);
      notify.notifySuccess('Đã lưu draft vào DB');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Save draft failed';
      setFormError(msg);
      notify.notifyError(msg);
    } finally {
      setFormBusy(false);
    }
  };

  const publishDraft = async (draftId) => {
    const draft = (draftItems || []).find((x) => String(x?._id || x?.id) === String(draftId));
    if (!draft) {
      notify.notifyWarning('Draft not found.');
      return;
    }

    // Defensive validation: publishing a Draft still requires content
    const title = String(draft?.postName || draft?.title || '').trim();
    const content = String(draft?.postContent || draft?.content || '').trim();
    const tags = Array.isArray(draft?.postTags) ? draft.postTags.filter(Boolean) : [];

    if (!title) {
      notify.notifyWarning('Title is required to publish.');
      return;
    }
    if (!content) {
      notify.notifyWarning('Content is required to publish.');
      return;
    }
    if (tags.length < 1) {
      notify.notifyWarning('Tag is required to publish.');
      return;
    }

    setFormBusy(true);
    setFormError('');
    try {
      await managerApi.updatePost(draft._id || draft.id, { status: 'Posted' });
      await loadDrafts();
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

  // ── Confirm helpers ──────────────────────────────────────────────────────

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
      /* onConfirm handles notification */
    }
  };

  const confirmDraftAction = async () => {
    const action = draftAction;
    if (!action?.id) return;
    if (action.type === 'delete') {
      try {
        await managerApi.deletePost(String(action.id));
        await loadDrafts();
        notify.notifySuccess('Draft deleted');
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Delete draft failed';
        notify.notifyError(msg);
      } finally {
        setDraftAction(null);
      }
      return;
    }
    if (action.type === 'publish') {
      await publishDraft(action.id);
      setDraftAction(null);
    }
  };

  // ── API actions ──────────────────────────────────────────────────────────

  const load = async () => {
    // IMPORTANT: do not set loading=true/false here (see note above)
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
    }
  };

  const canEditPost = (post) => canEditPostPermission({ post, user });

  const openEdit = (post) => {
    if (!post) return;
    if (!canEditPost(post)) {
      notify.notifyWarning('Bạn chỉ được sửa bài đăng do chính bạn tạo.');
      return;
    }

    // If user clicks Edit on a Draft row (rare), route to draft edit logic
    if (String(post?.status) === 'Draft') {
      openEditDraft(post?._id || post?.id);
      return;
    }

    setEditing(post);
    setForm({
      title: post?.postName || post?.title || '',
      content: post?.postContent || post?.content || '',
      // show existing saved urls for edit consistency
      images: getPostImages(post),
      tags: Array.isArray(post?.postTags) ? post.postTags : [],
    });
    setFormError('');
    setShowForm(true);
  };

  const submitForm = async () => {
    // Defensive validation: Publish requires Title + Content + Tag (Images optional)
    const title = String(form?.title || '').trim();
    const content = String(form?.content || '').trim();
    const tags = Array.isArray(form?.tags) ? form.tags.filter(Boolean) : [];

    if (!title) {
      notify.notifyWarning('Title is required to publish.');
      return;
    }
    if (!content) {
      notify.notifyWarning('Content is required to publish.');
      return;
    }
    if (tags.length < 1) {
      notify.notifyWarning('Tag is required to publish.');
      return;
    }

    setFormBusy(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.set('postName', form.title);
      fd.set('postContent', form.content);

      (form?.tags || []).forEach((t) => fd.append('postTags', t));

      const stringImages = (form?.images || []).filter((x) => typeof x === 'string' && x.trim());
      stringImages.slice(0, 6).forEach((url) => fd.append('postImage', url));

      (form?.images || [])
        .filter((x) => x && typeof x === 'object' && x.file instanceof File)
        .slice(0, Math.max(0, 6 - stringImages.length))
        .forEach((x) => fd.append('images', x.file));

      if (editing?._id || editing?.id) {
        await managerApi.updatePost(editing._id || editing.id, fd);
      } else {
        await managerApi.createPost(fd);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ title: '', content: '', images: [], tags: [] });
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

  const approve = async (postOrId) => {
    const id = typeof postOrId === 'string' ? postOrId : postOrId?._id || postOrId?.id;
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

  const reject = async (post) => {
    const id = post?._id || post?.id;
    if (!id) return;

    requestConfirm(
      createConfirmAction({
        type: 'delete',
        message: 'Bạn chắc chắn muốn từ chối (Reject) bài đăng này?',
        confirmText: 'Reject',
        variant: 'danger',
        onConfirm: async () => {
          try {
            await managerApi.rejectPost(id);
            await load();
            notify.notifySuccess('Đã từ chối bài đăng');
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Reject failed';
            notify.notifyError(msg);
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
            await loadDrafts();
            notify.notifySuccess('Post deleted successfully');
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Delete failed';
            notify.notifyError(msg);
            throw e;
          }
        },
      })
    );
  };

  // ── Derived display list ─────────────────────────────────────────────────
  const filteredAndSortedItems = useMemo(() => {
    const merged = [...(draftItems || []), ...(items || [])];
    const filtered = filterPostLikeList({
      merged,
      status,
      tableOwner,
      tag,
      searchNeedle: clientSearchNeedle,
      // Draft is in DB now
      isLocalDraft: (p) => String(p?.status) === 'Draft',
      getTitle: (p) => p?.postName || p?.title || '',
      getContent: (p) => p?.postContent || p?.content || '',
    });

    // Client-side sort (keeps drafts + server items consistent)
    filtered.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy.startsWith('created_')) {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else {
        valA = new Date(a.updatedAt || 0).getTime();
        valB = new Date(b.updatedAt || 0).getTime();
      }
      return sortBy.endsWith('_desc') ? valB - valA : valA - valB;
    });

    return filtered;
  }, [draftItems, items, status, tableOwner, sortBy, clientSearchNeedle, tag]);

  // Keep totalPages in sync with the actual displayed list (after filters)
  useEffect(() => {
    const count = filteredAndSortedItems.length;
    const nextTotal = Math.max(1, Math.ceil(count / Math.max(1, limit)));
    setTotalPages(nextTotal);

    // Clamp only when out of range (do NOT force-reset to page 1)
    if (page > nextTotal) setPage(nextTotal);
    else if (page < 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAndSortedItems.length, limit, page]);

  const displayedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAndSortedItems.slice(start, start + limit);
  }, [filteredAndSortedItems, page, limit]);

  // Reset also clears tag filter
  const resetFilters = () => {
    setStatus('');
    setTableOwner('');
    setSearch('');
    setTag('');
    setSortBy('created_desc');
    setPage(1);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Posts</h1>
          <p className="text-sm text-on-surface-variant">
            Quản lý bài viết hệ thống và duyệt bài do Owner/Customer gửi (lọc theo tag).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              setPage(1);
              await Promise.all([load(), loadDrafts()]);
              notify.notifyInfo('Đã làm mới dữ liệu');
            }}
            className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-on-surface hover:bg-surface transition-all"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-primary/20 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            Thêm bài viết
          </button>
        </div>
      </header>

      {/* Main panel */}
      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-4">
        <PostsToolbar
          search={search}
          onSearchChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          onReset={resetFilters}
        />

        {/* Quick tag filter */}
        {/* <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tag</div>
            <select
              className="h-10 w-56 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-on-surface-variant"
              value={tag}
              onChange={(e) => {
                setPage(1);
                setTag(e.target.value);
              }}
            >
              <option value="">Tất cả</option>
              <option value="ThongBao">Thông báo</option>
              <option value="TimKeo">Tìm kèo</option>
              <option value="Tips">Tips / Kinh nghiệm</option>
              <option value="Review">Review</option>
              <option value="HoiDap">Hỏi đáp</option>
              <option value="GiaoLuu">Giao lưu</option>
              <option value="SuKien">Sự kiện / Giải đấu</option>
              <option value="KhuyenMai">Khuyến mãi</option>
              <option value="BaoLoi">Báo lỗi / Góp ý</option>
              <option value="Khac">Khác</option>
            </select>
          </label>
        </div> */}

        {error ? <div className="text-sm text-error">{error}</div> : null}
        {/* Loading UI removed to avoid pagination side-effects */}

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
          tag={tag}
          onChangeTag={(v) => {
            setPage(1);
            setTag(v);
          }}
          sortBy={sortBy}
          onChangeSort={(v) => {
            setSortBy(v);
          }}
          onPreview={(post) => setPreviewing(post)}
          onEditDraft={openEditDraft}
          onPublishDraft={requestDraftPublish}
          onDeleteDraft={requestDraftDelete}
          onEdit={openEdit}
          canEditPost={canEditPost}
          onApprove={approve}
          onReject={reject}
          onDelete={remove}
          userId={userId}
        />

        {/* Numeric pagination */}
        <div className="pt-2 flex justify-center">
          <PostsPagination page={page} totalPages={totalPages} loading={false} onPageChange={setPage} />
        </div>
      </section>

      {/* Modals */}
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

      {/* Draft action confirm */}
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

      {/* Server action confirm (approve / delete) */}
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
