import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import communityService from '../../../services/communityService';
import DEFAULT_FIELD_IMAGE_URL from '../../../utils/defaultFieldImage';

import CreatePostModal from './components/CreatePostModal';

function formatDateTime(dateLike) {
  if (!dateLike) return '-';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateLike));
  } catch {
    return '-';
  }
}

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'posted') return 'bg-[#8eff71]/15 text-[#8eff71] border-[#8eff71]/30';
  if (s === 'pending') return 'bg-[#ffe184]/15 text-[#ffe184] border-[#ffe184]/30';
  if (s === 'rejected') return 'bg-[#ff8a8a]/15 text-[#ff8a8a] border-[#ff8a8a]/30';
  if (s === 'draft') return 'bg-[#8fb2ff]/15 text-[#8fb2ff] border-[#8fb2ff]/30';
  return 'bg-[#abaca5]/10 text-[#abaca5] border-[#abaca5]/20';
}

export default function CommunityMyPostsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [expandedPostId, setExpandedPostId] = useState('');
  const [deletingPostId, setDeletingPostId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setError('Bạn cần đăng nhập để xem bài viết của mình.');
      return;
    }

    let alive = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await communityService.getMyPosts();
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || 'Không tải được bài viết của bạn.');
        setItems([]);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthenticated, reloadKey]);

  const requestReload = () => setReloadKey((v) => v + 1);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
  };

  const handleDelete = async (post) => {
    const postId = String(post?.id || '');
    if (!postId) return;

    const accepted = window.confirm('Bạn có chắc muốn xóa bài viết này?');
    if (!accepted) return;

    setDeletingPostId(postId);
    try {
      await communityService.deleteMyPost(postId);
      notifySuccess('Đã xóa bài viết.');
      setExpandedPostId((prev) => (prev === postId ? '' : prev));
      requestReload();
    } catch (e) {
      notifyError(e?.response?.data?.message || e?.message || 'Không thể xóa bài viết.');
    } finally {
      setDeletingPostId('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/community')}
          className="inline-flex items-center gap-2 rounded-lg border border-[#474944]/30 bg-[#121410] px-3 py-2 text-sm font-bold text-[#abaca5] transition-colors hover:text-[#8eff71]"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Về Community
        </button>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#8eff71] px-4 py-2 text-sm font-black uppercase tracking-wider text-[#0d6100] transition-transform hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Tạo bài viết
          </button>
        ) : null}
      </div>

      <div className="mb-8">
        <h1 className="font-headline text-4xl font-black tracking-tight text-[#fdfdf6]">
          Bài viết <span className="italic text-[#8eff71]">của tôi</span>
        </h1>
        <p className="mt-2 text-sm text-[#abaca5]">Bạn có thể đọc, sửa và xóa các bài viết mình đã tạo.</p>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          requestReload();
        }}
      />

      <CreatePostModal
        isOpen={isEditModalOpen}
        editingPost={editingPost}
        onClose={closeEditModal}
        onSuccess={() => {
          closeEditModal();
          notifySuccess('Cập nhật bài viết thành công.');
          requestReload();
        }}
      />

      {!isAuthenticated ? (
        <div className="rounded-xl border border-[#474944]/20 bg-[#121410] p-8 text-center">
          <div className="font-headline text-2xl font-black text-[#fdfdf6]">Bạn chưa đăng nhập</div>
          <p className="mt-2 text-sm text-[#abaca5]">Vui lòng đăng nhập để quản lý bài viết của bạn.</p>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="mt-5 rounded-lg bg-[#8eff71] px-5 py-2 text-sm font-black text-[#0d6100]"
          >
            Đăng nhập
          </button>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#ff8a8a]/30 bg-[#ff8a8a]/10 p-6 text-sm text-[#ffb2b2]">{error}</div>
      ) : loading ? (
        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6 text-sm text-[#abaca5]">Đang tải bài viết của bạn...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6 text-sm text-[#abaca5]">Bạn chưa tạo bài viết nào.</div>
      ) : (
        <div className="space-y-3">
          {items.map((post) => {
            const postId = String(post?.id || '');
            const expanded = expandedPostId === postId;
            const tags = Array.isArray(post?.tags) ? post.tags : [];

            return (
              <article key={postId} className="rounded-xl border border-[#474944]/30 bg-[#121410] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-headline text-lg font-black text-[#fdfdf6]">{post?.title || '(Không có tiêu đề)'}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusTone(post?.status)}`}>
                        {String(post?.status || 'Unknown')}
                      </span>
                    </div>

                    <div className="text-xs text-[#abaca5]">Cập nhật: {formatDateTime(post?.updatedAt || post?.createdAt)}</div>

                    {tags.length ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={`${postId}_${tag}`}
                            className="rounded-full border border-[#8eff71]/20 bg-[#8eff71]/10 px-2.5 py-1 text-[10px] font-bold text-[#8eff71]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedPostId((prev) => (prev === postId ? '' : postId))}
                      className="rounded-lg border border-[#474944]/30 px-3 py-1.5 text-xs font-bold text-[#abaca5] transition-colors hover:bg-[#242721] hover:text-[#fdfdf6]"
                    >
                      {expanded ? 'Thu gọn' : 'Xem nội dung'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPost(post);
                        setIsEditModalOpen(true);
                      }}
                      disabled={deletingPostId === postId}
                      className="rounded-lg border border-[#8eff71]/30 px-3 py-1.5 text-xs font-bold text-[#8eff71] transition-colors hover:bg-[#8eff71]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      disabled={deletingPostId === postId}
                      className="rounded-lg border border-[#ff8a8a]/40 px-3 py-1.5 text-xs font-bold text-[#ff8a8a] transition-colors hover:bg-[#ff8a8a]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingPostId === postId ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr]">
                  <div className="h-24 overflow-hidden rounded-lg border border-[#474944]/30 bg-[#0d0f0b]">
                    <img
                      src={post?.image || DEFAULT_FIELD_IMAGE_URL}
                      alt="Post"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_FIELD_IMAGE_URL;
                      }}
                    />
                  </div>

                  <div className={expanded ? 'whitespace-pre-line text-sm leading-6 text-[#abaca5]' : 'line-clamp-2 text-sm leading-6 text-[#abaca5]'}>
                    {post?.content || '(Không có nội dung)'}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
