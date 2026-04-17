/**
 * PostsTable.jsx
 * Table UI for Manager Posts list including header filters.
 */

import { formatDateTime, isLocalDraftPost, normalizeOwnerLabel } from './postFormatters';

const STATUS = ['Pending', 'Posted', 'Rejected', 'Deleted'];

export default function PostsTable({
  loading,
  items,
  page,
  limit,
  status,
  onChangeStatus,
  tableOwner,
  onChangeOwner,
  onPreview,
  onEditDraft,
  onPublishDraft,
  onDeleteDraft,
  onEdit,
  canEditPost,
  onApprove,
  onDelete,
}) {
  return (
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
                  onChange={(e) => onChangeStatus?.(e.target.value)}
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
                  onChange={(e) => onChangeOwner?.(e.target.value)}
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
          {items.map((p, idx) => {
            const id = p?._id || p?.id;
            const isDraft = isLocalDraftPost(p);
            return (
              <tr key={id} className="align-top">
                <td className="py-3 pr-4 text-xs text-on-surface-variant">{(page - 1) * limit + idx + 1}</td>
                <td className="py-3 pr-4">
                  <div className="font-semibold text-black">{p?.postName || p?.title || '(no title)'}</div>
                  <div className="text-xs text-on-surface-variant line-clamp-2">{p?.postContent || p?.content || ''}</div>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex rounded-full border border-outline-variant px-2 py-1 text-xs">{isDraft ? 'Draft' : p?.status || '-'}</span>
                </td>
                <td className="py-3 pr-4 text-on-surface-variant">{normalizeOwnerLabel(p)}</td>
                <td className="py-3 pr-4 text-on-surface-variant">{p?.createdAt ? formatDateTime(p.createdAt) : '-'}</td>
                <td className="py-3 pr-4 text-on-surface-variant">{p?.updatedAt ? formatDateTime(p.updatedAt) : '-'}</td>
                <td className="py-3 text-right">
                  <div className="inline-flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => onPreview?.(p)}
                      className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
                      title="Preview"
                    >
                      Preview
                    </button>

                    {isDraft ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditDraft?.(id)}
                          className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onPublishDraft?.(id)}
                          className="h-9 rounded-lg px-3 text-xs font-bold bg-primary text-on-primary hover:opacity-90"
                        >
                          Publish
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteDraft?.(id)}
                          className="h-9 rounded-lg px-3 text-xs font-bold border border-error text-error hover:bg-error hover:text-on-error"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit?.(p)}
                          className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!canEditPost?.(p)}
                          title={!canEditPost?.(p) ? 'Chỉ được sửa bài đăng do chính bạn tạo' : 'Edit'}
                        >
                          Edit
                        </button>

                        {String(p?.status) === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => onApprove?.(p)}
                            className="h-9 rounded-lg px-3 text-xs font-bold bg-primary text-on-primary hover:opacity-90"
                          >
                            Approve
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => onDelete?.(p)}
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

          {!loading && items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center text-sm text-on-surface-variant">
                No posts found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
