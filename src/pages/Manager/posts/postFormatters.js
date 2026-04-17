/**
 * postFormatters.js
 * Presentation helpers for Manager Posts.
 */

/**
 * getPostTitle
 * Gets title from API post or local draft.
 *
 * @param {object} post - post-like object
 * @returns {string} title
 */
export function getPostTitle(post) {
  return post?.postName || post?.title || '';
}

/**
 * getPostContent
 * Gets content from API post or local draft.
 *
 * @param {object} post - post-like object
 * @returns {string} content
 */
export function getPostContent(post) {
  return post?.postContent || post?.content || '';
}

/**
 * getPostImages
 * Normalizes image list from API post.
 *
 * @param {object} post - post-like object
 * @returns {string[]} image urls
 */
export function getPostImages(post) {
  const imgs = post?.postImage || post?.images || [];
  return Array.isArray(imgs) ? imgs.filter(Boolean) : [];
}

/**
 * formatDateTime
 * Formats an ISO date string for table display.
 *
 * @param {string|undefined|null} iso - ISO datetime
 * @returns {string} formatted datetime or '-'
 */
export function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

/**
 * normalizeOwnerLabel
 * Gets a readable owner label for table display.
 *
 * @param {object} post - post-like object
 * @returns {string} label
 */
export function normalizeOwnerLabel(post) {
  return post?.ownerName || post?.ownerId?.name || post?.ownerId || '-';
}

/**
 * isLocalDraftPost
 * Whether a post-like object is a local-only draft.
 *
 * @param {object} post - post-like object
 * @returns {boolean} is local draft
 */
export function isLocalDraftPost(post) {
  return !!post?.__localDraft || String(post?.status) === 'Draft';
}
