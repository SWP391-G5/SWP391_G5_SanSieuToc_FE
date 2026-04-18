/**
 * postsPermissions.js
 * Permission checks for Manager Posts screen.
 */

/**
 * canEditPost
 * Manager can only edit posts created by themselves.
 *
 * @param {object} params
 * @param {any} params.post - post record
 * @param {any} params.user - current user
 * @returns {boolean}
 */
export function canEditPost({ post, user }) {
  const myId = String(user?._id || user?.id || '');
  
  let rawOwner = post?.postOwnerID || post?.postOwnerId || post?.ownerId || post?.postOwner || '';
  let ownerId = '';
  
  if (typeof rawOwner === 'object' && rawOwner !== null) {
    ownerId = String(rawOwner._id || rawOwner.id || '');
  } else {
    ownerId = String(rawOwner);
  }

  if (!myId || !ownerId) return false;
  // manager-created posts are stored under AdminAccount; enforce both id + model when available
  if (post?.postOwnerModel && String(post.postOwnerModel) !== 'AdminAccount') return false;

  return myId === ownerId;
}
