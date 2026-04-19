import DEFAULT_FIELD_IMAGE_URL from '../../../utils/defaultFieldImage';

function formatRelativeTime(dateLike) {
  if (!dateLike) return 'just now';

  const ts = new Date(dateLike).getTime();
  if (!Number.isFinite(ts)) return 'just now';

  const diffMs = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}d ago`;
  if (diffMs < 4 * week) return `${Math.floor(diffMs / week)}w ago`;

  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(ts));
  } catch {
    return 'just now';
  }
}

export function adaptPostToCommunityItem(post) {
  const title = String(post?.title || post?.postName || '').trim() || '(no title)';
  const excerpt = String(post?.excerpt || post?.postContent || post?.content || '').trim();
  const content = String(post?.content || post?.postContent || excerpt).trim();
  const tag = String(post?.tag || '').trim() || 'Community';
  const author = String(post?.author || '').trim() || 'Community Member';

  return {
    id: String(post?.id || post?._id || ''),
    tag,
    title,
    excerpt,
    author,
    time: formatRelativeTime(post?.createdAt),
    image: post?.image || DEFAULT_FIELD_IMAGE_URL,
    imageAlt: post?.imageAlt || 'Post image',
    content,
  };
}
