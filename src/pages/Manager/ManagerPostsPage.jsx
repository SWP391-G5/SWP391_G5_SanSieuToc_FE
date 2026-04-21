/**
 * ============================================================
 * FILE: src/pages/Manager/ManagerPostsPage.jsx
 * ============================================================
 * WHAT IS THIS FILE?
 *   Manager Posts main screen (ORCHESTRATOR). Owns page state,
 *   data fetching, and action handlers for post moderation.
 *   Rendering is delegated to child components under `./posts/`.
 *
 * RESPONSIBILITIES:
 *   - Fetch system posts + manager drafts (status=Draft)
 *   - Apply client-side filtering/sorting/pagination
 *   - Open/close modals (create/edit/preview/confirm)
 *   - Call Manager APIs: create/update/approve/reject/delete
 *
 * DATA FLOW:
 *   MongoDB → (BE) /api/manager/posts → managerApi.getPosts()
 *           → [THIS FILE] state → PostsTable.jsx / PostPreviewModal.jsx
 *
 * CHILD COMPONENTS USED:
 *   - src/pages/Manager/posts/PostsToolbar.jsx
 *   - src/pages/Manager/posts/PostsTable.jsx
 *   - src/pages/Manager/posts/PostsPagination.jsx
 *   - src/pages/Manager/posts/PostFormModal.jsx
 *   - src/pages/Manager/posts/PostConfirmModal.jsx
 *   - src/pages/Manager/posts/PostPreviewModal.jsx
 *
 * API CALLS (via):
 *   - src/services/manager/managerApi.js
 * ============================================================
 */

/**
 * ============================================================
 * STATE MAP (ManagerPostsPage)
 * ============================================================
 * loading        {boolean}   UI flag (intentionally fixed false; see note in code)
 *                             Set by: (none)
 *                             Used by: PostsTable / PostsPagination disable states
 *
 * error          {string}    Load error message for posts API
 *                             Set by: load() catch
 *                             Used by: top-of-page error banner
 *
 * items          {Array}     Non-draft posts from API (Pending/Posted/Rejected/Deleted)
 *                             Set by: load()
 *                             Used by: merged list → table rendering
 *
 * draftItems     {Array}     Draft posts from API (status=Draft)
 *                             Set by: loadDrafts()
 *                             Used by: merged list → table rendering
 *
 * totalPages     {number}    Derived pagination metadata computed from merged list
 *                             Set by: computeTotalPages effect
 *                             Used by: PostsPagination
 *
 * page           {number}    Current page index (1-based)
 *                             Set by: pagination controls, filter resets
 *                             Used by: slice displayedItems
 *
 * status         {string}    Status filter ('', 'Draft', or server statuses)
 * tableOwner     {string}    Owner model filter ('', 'Draft', 'AdminAccount', 'UserAccount')
 * sortBy         {string}    Sort preset (created/updated asc/desc)
 * tag            {string}    Tag filter ('', or tag slug)
 * search         {string}    Raw search text from toolbar
 *
 * showForm       {boolean}   Create/Edit modal visibility
 * editing        {object}    Currently editing record (API post or draft)
 * previewing     {object}    Post selected for preview modal
 * draftAction    {object}    Draft confirm action: { type:'publish'|'delete', id }
 * confirmAction  {object}    Server confirm action: approve/reject/delete
 *
 * form           {object}    Controlled modal form: { title, content, images, tags }
 * formBusy       {boolean}   Submit in-flight flag
 * formError      {string}    Modal-level error message
 * ============================================================
 */

// ── React core ─────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';

// ── Internal: services & context ───────────────────────────
import managerApi from '../../services/manager/managerApi'; // Manager endpoints for posts CRUD/moderation
import { useAuth } from '../../context/AuthContext'; // current logged-in manager/admin
import { useNotification } from '../../context/NotificationContext'; // toast notifications

// ── Internal: child components (posts feature folder) ──────
import PostConfirmModal from './posts/PostConfirmModal';
import PostFormModal from './posts/PostFormModal';
import PostPreviewModal from './posts/PostPreviewModal';
import PostsPagination from './posts/PostsPagination';
import PostsTable from './posts/PostsTable';
import PostsToolbar from './posts/PostsToolbar';

// ── Internal: posts utilities ──────────────────────────────
import { createConfirmAction } from './posts/postConfirmActions';
import { filterPostLikeList } from './posts/postFilters';
import { isLocalDraftPost, getPostImages } from './posts/postFormatters';
import { canEditPost as canEditPostPermission } from './posts/postsPermissions';

// ── CHANGE [2026-04-21]: Refactor structure/comments for reviewability (no behavior changes) ──
export default function ManagerPostsPage() {
  // ─────────────────────────────────────────────────────────────
  // SECTION 1: CONTEXT
  // ─────────────────────────────────────────────────────────────
  const notify = useNotification();
  const { user } = useAuth();
  const userId = String(user?._id || user?.id || '');

  // ─────────────────────────────────────────────────────────────
  // SECTION 2: STATE (page-level)
  // ─────────────────────────────────────────────────────────────
  // NOTE: We intentionally do NOT toggle loading for filter/pagination changes,
  // because the loading UI was causing pagination to jump back to page 1.
  const [loading] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([]);
  const [draftItems, setDraftItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Filter / pagination
  const [page, setPage] = useState(1);
  const limit = 10; // fixed 10 items per page
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [tableOwner, setTableOwner] = useState(''); // '' | 'Draft' | 'AdminAccount' | 'UserAccount'
  const [sortBy, setSortBy] = useState('created_desc'); // created_desc | created_asc | updated_desc | updated_asc
  const [tag, setTag] = useState(''); // '' | tag slug

  // Modals / actions
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [draftAction, setDraftAction] = useState(null); // { type: 'publish'|'delete', id }
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, variant, confirmText, onConfirm }

  // Form state
  const [form, setForm] = useState({ title: '', content: '', images: [], tags: [] });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // SECTION 3: DERIVED VALUES
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // SECTION 4: DATA FETCHING
  // ─────────────────────────────────────────────────────────────

  /**
   * load
   * ----------------------------------------------------------
   * Loads non-draft posts (server statuses) from the manager API.
   *
   * TRIGGERS: useEffect when query.status/query.q/query.sort change.
   *
   * DATA FLOW:
   *   managerApi.getPosts(query) → setItems(list)
   *
   * ERROR PATH:
   *   - 401/403: shows "Unauthorized" message via toast + error banner.
   *   - Other errors: shows API message or fallback.
   */
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

  /**
   * loadDrafts
   * ----------------------------------------------------------
   * Loads drafts (status=Draft) for the current manager/admin.
   *
   * TRIGGERS: useEffect when userId/query.q/query.sort change.
   *
   * ERROR PATH:
   *   - If API fails, draftItems is reset to [] to keep UI stable.
   */
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

  // ─────────────────────────────────────────────────────────────
  // SECTION 5: EFFECTS
  // ─────────────────────────────────────────────────────────────

  /**
   * EFFECT: Load posts when main query changes
   * ----------------------------------------------------------
   * WHEN IT RUNS: On mount, and when query.status/query.q/query.sort change.
   * WHAT IT DOES: Calls load() to refresh non-draft posts list.
   * DEPENDENCIES:
   *   - query.status: server-side status filter
   *   - query.q:      server-side keyword filter
   *   - query.sort:   server-side sort preset
   * CLEANUP: None
   * ERROR PATH: handled inside load() (sets error + toast)
   */
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.status, query.q, query.sort]);

  /**
   * EFFECT: Load drafts when user or query changes
   * ----------------------------------------------------------
   * WHEN IT RUNS: On mount, and when userId/query.q/query.sort change.
   * WHAT IT DOES: Calls loadDrafts() to refresh Draft list for this user.
   * DEPENDENCIES:
   *   - userId:   manager/admin id
   *   - query.q:  keep draft list aligned with search keyword
   *   - query.sort: keep draft list aligned with sort preset
   * CLEANUP: None
   * ERROR PATH: handled inside loadDrafts() (falls back to [])
   */
  useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, query.q, query.sort]);

  // ─────────────────────────────────────────────────────────────
  // SECTION 6: EVENT HANDLERS (UI actions)
  // ─────────────────────────────────────────────────────────────

  const canEditPost = (post) => canEditPostPermission({ post, user });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', images: [], tags: [] });
    setFormError('');
    setShowForm(true);
  };

  const openEditDraft = (draftId) => {
    const draft = (draftItems || []).find((x) => String(x?._id || x?.id) === String(draftId));
    if (!draft) {
      notify.notifyWarning('Không tìm thấy draft.');
      return;
    }

    // Mark as db draft so save flow uses updatePost instead of createPost
    setEditing({ ...draft, __dbDraft: true });
    setForm({
      title: draft?.postName || draft?.title || '',
      content: draft?.postContent || draft?.content || '',
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

  // ── CHANGE [2026-04-21]: Removed duplicate declarations (kept Section 4/6 versions above) ──
  // REPLACED: duplicate `load` and `canEditPost` declarations below were removed to avoid
  //           "Cannot redeclare block-scoped variable" and keep one source of truth.
  // ── END CHANGE ───────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // SECTION 7: MODERATION ACTIONS (approve / reject / delete)
  // ─────────────────────────────────────────────────────────────
  // [ANCHOR] MANAGER_POSTS__MODERATION_ACTIONS__BEGIN

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

  // [ANCHOR] MANAGER_POSTS__MODERATION_ACTIONS__END

  // ─────────────────────────────────────────────────────────────
  // SECTION 8: DERIVED DISPLAY (merged list → filter/sort → paging)
  // ─────────────────────────────────────────────────────────────
  // [ANCHOR] MANAGER_POSTS__DERIVED_DISPLAY__BEGIN

  // ── Derived display list ─────────────────────────────────────────────────
  // (merged list → filter rules → client-side sort)
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

  // [ANCHOR] MANAGER_POSTS__DERIVED_DISPLAY__END

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
        cancelText="Cancel"
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
        cancelText="Cancel"
        confirmText={confirmAction?.confirmText || 'OK'}
        confirmVariant={confirmAction?.variant === 'danger' ? 'danger' : 'primary'}
        onCancel={cancelConfirm}
        onConfirm={confirmRequestedAction}
        zIndexClassName="z-[61]"
      />
    </div>
  );
}
// ── END CHANGE ─────────────────────────────────────────────
