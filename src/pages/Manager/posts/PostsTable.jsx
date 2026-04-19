/**
 * PostsTable.jsx
 * Fixed-layout table UI for the Manager Posts list.
 * Column widths are locked so that long titles do not break the grid.
 * Header cells include inline Status and Owner filter dropdowns.
 */

// 3. Internal
import { formatDateTime, isLocalDraftPost, normalizeOwnerLabel } from './postFormatters';

// All server-side statuses (Draft is a local-only pseudo-status)
const SERVER_STATUSES = ['Pending', 'Posted', 'Rejected', 'Deleted'];

const CREATED_SORT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'created_desc', label: 'Mới nhất' },
  { value: 'created_asc', label: 'Cũ nhất' },
];

const UPDATED_SORT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'updated_desc', label: 'Mới nhất' },
  { value: 'updated_asc', label: 'Cũ nhất' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * StatusBadge
 * Colored pill badge for a post status string.
 *
 * @param {object} props
 * @param {string} props.status - e.g. 'Pending' | 'Posted' | 'Rejected' | 'Deleted' | 'Draft'
 */
function StatusBadge({ status }) {
  // Map each status to a Tailwind color pair
  const colorMap = {
    Draft: 'border-outline-variant text-on-surface-variant',
    Pending: 'border-yellow-400  text-yellow-600',
    Posted: 'border-green-500   text-green-600',
    Rejected: 'border-red-400     text-red-500',
    Deleted: 'border-gray-400    text-gray-400 line-through',
  };

  const classes = colorMap[status] || 'border-outline-variant text-on-surface-variant';

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${classes}`}>
      {status || '-'}
    </span>
  );
}

/**
 * ActionGroup
 * Renders the action buttons for one post row. Draft and server posts have
 * different button sets and all buttons are kept in a fixed-size flex container.
 *
 * @param {object}   props
 * @param {object}   props.post
 * @param {boolean}  props.isDraft
 * @param {Function} props.onPreview
 * @param {Function} props.onEditDraft
 * @param {Function} props.onPublishDraft
 * @param {Function} props.onDeleteDraft
 * @param {Function} props.onEdit
 * @param {Function} props.canEditPost
 * @param {Function} props.onApprove
 * @param {Function} props.onDelete
 */
function ActionGroup({
  post,
  isDraft,
  onPreview,
  onEditDraft,
  onPublishDraft,
  onDeleteDraft,
  onEdit,
  canEditPost,
  onApprove,
  onDelete,
  onReject,
  userId,
}) {
  const id = post?._id || post?.id;
  const isPending = String(post?.status) === 'Pending';

  const base = 'h-8 rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap';
  const ghost = `${base} border border-outline-variant text-on-surface-variant hover:bg-surface`;
  const primary = `${base} bg-primary text-on-primary hover:opacity-90`;
  const danger = `${base} border border-error text-error hover:bg-error hover:text-on-error`;

  const canEdit = !isDraft ? !!canEditPost?.(post) : false;

  const postOwnerModel = String(post?.postOwnerModel || '').trim();
  const isOwnerPost = postOwnerModel === 'UserAccount';

  const rawOwner = post?.postOwnerID || post?.postOwnerId || post?.ownerId || post?.postOwner || '';
  const ownerId = typeof rawOwner === 'object' && rawOwner !== null ? String(rawOwner._id || rawOwner.id || '') : String(rawOwner || '');
  const isMyManagerPost = postOwnerModel === 'AdminAccount' && ownerId && userId && String(ownerId) === String(userId);

  // Pending posts: business rule → manager should Reject, not Delete
  const showReject = !isDraft && isPending;

  // Non-pending posts: allow delete for
  // - Owner posts (UserAccount)
  // - Manager posts only if it is my own manager post
  const showDelete = !isDraft && !isPending && (isOwnerPost || isMyManagerPost);

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <button type="button" onClick={() => onPreview?.(post)} className={ghost} title="Preview">
        Xem
      </button>

      {isDraft ? (
        /* ── Draft row buttons ── */
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onEditDraft?.(id)} className={ghost}>
            Sửa
          </button>
          <button type="button" onClick={() => onPublishDraft?.(id)} className={primary}>
            Đăng
          </button>
          <button type="button" onClick={() => onDeleteDraft?.(id)} className={danger}>
            Xóa
          </button>
        </div>
      ) : (
        /* ── Server post row buttons ── */
        <div className="flex gap-1.5">
          {canEdit ? (
            <button type="button" onClick={() => onEdit?.(post)} className={ghost}>
              Sửa
            </button>
          ) : null}

          {isPending ? (
            <button
              type="button"
              onClick={() => onApprove?.(post)}
              className={primary}
              title="Approve"
            >
              Duyệt
            </button>
          ) : null}

          {showReject ? (
            <button type="button" onClick={() => onReject?.(post)} className={danger}>
              Từ chối
            </button>
          ) : null}

          {showDelete ? (
            <button type="button" onClick={() => onDelete?.(post)} className={danger}>
              Xóa
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * PostsTable component
 * @param {boolean}  loading         - Show loading state
 * @param {Array}    items           - Merged list of draft + server posts
 * @param {number}   page            - Current page (for row numbering)
 * @param {number}   limit           - Items per page (for row numbering)
 * @param {string}   status          - Active status filter value
 * @param {Function} onChangeStatus  - Status filter change callback
 * @param {string}   tableOwner      - Active owner filter value
 * @param {Function} onChangeOwner   - Owner filter change callback
 * @param {string}   sortBy          - Sort key (created/update + asc/desc)
 * @param {Function} onChangeSort    - Sort change callback
 * @param {Function} onPreview       - Open preview modal
 * @param {Function} onEditDraft     - Open draft edit form
 * @param {Function} onPublishDraft  - Trigger draft publish confirm
 * @param {Function} onDeleteDraft   - Trigger draft delete confirm
 * @param {Function} onEdit          - Open server post edit form
 * @param {Function} canEditPost     - Returns true if current user may edit a post
 * @param {Function} onApprove       - Trigger approve confirm
 * @param {Function} onDelete        - Trigger delete confirm
 * @param {Function} onReject        - Trigger reject confirm
 * @param {string}   userId         - Current user's ID
 */
export default function PostsTable({
  loading,
  items,
  page,
  limit,
  status,
  onChangeStatus,
  tableOwner,
  onChangeOwner,
  sortBy,
  onChangeSort,
  onPreview,
  onEditDraft,
  onPublishDraft,
  onDeleteDraft,
  onEdit,
  canEditPost,
  onApprove,
  onDelete,
  onReject,
  userId,
}) {
  // Make ALL header filters uniform.
  // Use full width of the column and keep labels visible (stacked).
  const filterClass =
    'h-8 w-full min-w-[120px] rounded-lg bg-surface px-2 text-xs border border-outline-variant text-on-surface-variant';

  const createdSortValue = sortBy?.startsWith('created_') ? sortBy : '';
  const updatedSortValue = sortBy?.startsWith('updated_') ? sortBy : '';

  return (
    <div className="overflow-x-auto">
      {/*
        table-fixed + explicit column widths lock the column grid so content
        length cannot make columns shift. Without this, a long title causes other
        columns to shrink unpredictably.
      */}
      <table className="w-full table-fixed text-sm min-w-[980px]">
        <colgroup>
          <col style={{ width: '3rem' }} />
          <col />
          <col style={{ width: '11rem' }} />
          <col style={{ width: '11rem' }} />
          <col style={{ width: '14rem' }} />
          <col style={{ width: '14rem' }} />
          <col style={{ width: '11rem' }} />
        </colgroup>

        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
            <th className="py-3 pr-4">No</th>
            <th className="py-3 pr-4">Tiêu đề</th>

            {/* Status */}
            <th className="py-3 pr-4">
              <div className="flex flex-col gap-1">
                <span>Trạng thái</span>
                <select className={filterClass} value={status} onChange={(e) => onChangeStatus?.(e.target.value)}>
                  <option value="">Tất cả</option>
                  <option value="Draft">Nháp</option>
                  {SERVER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </th>

            {/* Owner */}
            <th className="py-3 pr-4">
              <div className="flex flex-col gap-1">
                <span>Người sở hữu</span>
                <select className={filterClass} value={tableOwner} onChange={(e) => onChangeOwner?.(e.target.value)}>
                  <option value="">Tất cả</option>
                  <option value="Draft">Nháp</option>
                  <option value="AdminAccount">Quản lý</option>
                  <option value="UserAccount">Người dùng</option>
                </select>
              </div>
            </th>

            {/* Created */}
            <th className="py-3 pr-4">
              <div className="flex flex-col gap-1">
                <span>Ngày tạo</span>
                <select
                  className={filterClass}
                  value={createdSortValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChangeSort?.(v || '');
                  }}
                  title="Sort by CreatedAt"
                >
                  {CREATED_SORT_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </th>

            {/* Updated */}
            <th className="py-3 pr-4">
              <div className="flex flex-col gap-1">
                <span>Ngày cập nhật</span>
                <select
                  className={filterClass}
                  value={updatedSortValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChangeSort?.(v || '');
                  }}
                  title="Sort by UpdatedAt"
                >
                  {UPDATED_SORT_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </th>

            <th className="py-3 text-right">Hành động</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-outline-variant">
          {items.map((post, idx) => {
            const id = post?._id || post?.id;
            const isDraft = isLocalDraftPost(post);

            return (
              <tr key={id || idx} className="align-top">
                {/* Row number */}
                <td className="py-3 pr-4 text-xs text-on-surface-variant">
                  {(page - 1) * limit + idx + 1}
                </td>

                {/* Title + content snippet */}
                <td className="py-3 pr-4">
                  {/* Title cell is a bordered white area → text-black is correct here */}
                  <div
                    className="font-semibold text-on-surface-variant truncate"
                    title={post?.postName || post?.title || ''}
                  >
                    {post?.postName || post?.title || '(no title)'}
                  </div>
                  <div className="mt-0.5 text-xs text-on-surface-variant line-clamp-2 break-words">
                    {post?.postContent || post?.content || ''}
                  </div>
                </td>

                {/* Status badge */}
                <td className="py-3 pr-4">
                  <StatusBadge status={isDraft ? 'Draft' : post?.status} />
                </td>

                {/* Owner label */}
                <td className="py-3 pr-4 text-xs text-on-surface-variant break-words">
                  {normalizeOwnerLabel(post)}
                </td>

                {/* Created date */}
                <td className="py-3 pr-4 text-xs text-on-surface-variant">
                  {post?.createdAt ? formatDateTime(post.createdAt) : '-'}
                </td>

                {/* Updated date */}
                <td className="py-3 pr-4 text-xs text-on-surface-variant">
                  {post?.updatedAt ? formatDateTime(post.updatedAt) : '-'}
                </td>

                {/* Action buttons */}
                <td className="py-3 text-right">
                  <ActionGroup
                    post={post}
                    isDraft={isDraft}
                    onPreview={onPreview}
                    onEditDraft={onEditDraft}
                    onPublishDraft={onPublishDraft}
                    onDeleteDraft={onDeleteDraft}
                    onEdit={onEdit}
                    canEditPost={canEditPost}
                    onApprove={onApprove}
                    onDelete={onDelete}
                    onReject={onReject}
                    userId={userId}
                  />
                </td>
              </tr>
            );
          })}

          {/* Empty state */}
          {!loading && items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-sm text-on-surface-variant">
                Không tìm thấy bài viết nào.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
