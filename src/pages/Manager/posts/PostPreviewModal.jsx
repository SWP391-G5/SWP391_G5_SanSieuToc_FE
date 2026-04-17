/**
 * PostPreviewModal.jsx
 * Customer-facing preview modal for Manager Posts.
 */

import { formatDateTime, getPostContent, getPostImages, getPostTitle } from './postFormatters';

export default function PostPreviewModal({ open, post, onClose }) {
  if (!open || !post) return null;

  const images = getPostImages(post).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white border border-outline-variant shadow-2xl my-10 overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6 bg-surface-container-high">
          <div>
            <h2 className="text-xl font-headline font-bold">Preview (Khách hàng sẽ thấy)</h2>
            <p className="text-sm text-on-surface-variant mt-1">Đây là preview theo dữ liệu hiện tại của bài đăng. (Không thay đổi dữ liệu)</p>
          </div>
          <button
            type="button"
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <article className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-black break-words">{getPostTitle(post) || '(no title)'}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex rounded-full border border-outline-variant px-2 py-1">Status: {post?.status || '-'}</span>
                {post?.updatedAt ? <span className="text-gray-600">Updated: {formatDateTime(post.updatedAt)}</span> : null}
              </div>
            </div>

            {images.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((src, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-outline-variant bg-surface">
                    <img src={src} alt={`post-${idx}`} className="w-full h-56 object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-outline-variant bg-surface p-4 text-sm text-gray-500">No images.</div>
            )}

            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-black leading-7">{getPostContent(post) || '(no content)'}</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
