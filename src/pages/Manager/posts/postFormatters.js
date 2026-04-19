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
  const raw = post?.postImage ?? post?.images ?? [];

  // Sometimes multipart/form-data or serialization may turn arrays into JSON strings.
  // Normalize those cases so UI can still render images.
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];

    // Try parse JSON array string
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"[') && s.endsWith(']"'))) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
      } catch {
        // fallthrough
      }
    }

    // Try comma-separated
    if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean);

    // Single URL string
    return [s];
  }

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  return [];
}

/**
 * getPostTags
 * Normalizes tags list from API post.
 *
 * @param {object} post - post-like object
 * @returns {string[]} tags
 */
export function getPostTags(post) {
  const raw = post?.postTags ?? post?.tags ?? post?.tag ?? [];

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];

    // JSON array string
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
      } catch {
        // fallthrough
      }
    }

    // comma-separated
    if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean);

    return [s];
  }

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  return [];
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
 * Reads from the BE Post schema fields: postOwnerID (may be populated or raw ObjectId)
 * and postOwnerModel (e.g. 'UserAccount' | 'AdminAccount').
 *
 * @param {object} post - post-like object (API Post or local draft)
 * @returns {string} human-readable owner label
 */
export function normalizeOwnerLabel(post) {
  if (!post) return '-';

  // Local draft: no server owner
  if (post.__localDraft) return 'Draft (Local)';

  const ownerRef = post.postOwnerID;
  const ownerModel = post.postOwnerModel || '';

  // If postOwnerID was populated by Mongoose (an object with name/email fields)
  if (ownerRef && typeof ownerRef === 'object') {
    const name = ownerRef.name || ownerRef.fullName || ownerRef.email || ownerRef._id || '';
    if (name) return String(name);
  }

  // If postOwnerID is a raw ObjectId string, show it with the model label for context
  if (ownerRef && typeof ownerRef === 'string') {
    // Shorten the ObjectId to last 6 chars so it's readable in a narrow column
    const shortId = ownerRef.length > 6 ? `…${ownerRef.slice(-6)}` : ownerRef;
    return ownerModel ? `${ownerModel} (${shortId})` : shortId;
  }

  return '-';
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
