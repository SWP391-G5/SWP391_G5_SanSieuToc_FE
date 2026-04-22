/**
 * ============================================================
 * FILE: src/pages/Manager/posts/postsPermissions.js
 * ============================================================
 * WHAT IS THIS FILE?
 *   Permission helpers for Manager Posts module.
 *   Pure functions only (no React, no API calls).
 *
 * RESPONSIBILITIES:
 *   - Decide whether current manager/admin can edit a given post
 *
 * DATA FLOW:
 *   ManagerPostsPage.jsx (user + post row) → canEditPost() → boolean
 *
 * USED IN:
 *   - src/pages/Manager/ManagerPostsPage.jsx
 * ============================================================
 */

// ── CHANGE [2026-04-21]: Add structured header/sections (no behavior change) ──

// ─────────────────────────────────────────────────────────────
// SECTION 1: PERMISSION CHECKS
// ─────────────────────────────────────────────────────────────

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

// ── END CHANGE ─────────────────────────────────────────────
