/**
 * ============================================================
 * FILE: src/pages/Manager/posts/postFilters.js
 * ============================================================
 * WHAT IS THIS FILE?
 *   Client-side filtering helpers for Manager Posts.
 *   Pure functions used by the orchestrator to filter merged lists.
 *
 * RESPONSIBILITIES:
 *   - Normalize search needle
 *   - Filter by status/owner/tag
 *   - Match keyword tokens against title/content
 *
 * DATA FLOW:
 *   ManagerPostsPage.jsx (merged list + filters) → filterPostLikeList()
 *   → filtered array → rendered in PostsTable
 *
 * USED IN:
 *   - src/pages/Manager/ManagerPostsPage.jsx
 * ============================================================
 */

// ── CHANGE [2026-04-21]: Add sections + structured header (no behavior change) ──

// ─────────────────────────────────────────────────────────────
// SECTION 1: SEARCH HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * buildSearchNeedle
 * Produces a normalized search needle used for client-side matching.
 *
 * @param {string} rawSearch - raw search input
 * @returns {string} normalized lowercase needle
 */
export function buildSearchNeedle(rawSearch) {
  return String(rawSearch || '').trim().toLowerCase();
}

/**
 * matchesSearch
 * Fuzzy-ish search: all tokens must appear (in any order) in title/content.
 *
 * @param {object} args - parameters
 * @param {string} args.needle - normalized needle
 * @param {string} args.title - title text
 * @param {string} args.content - content text
 * @returns {boolean} matched
 */
export function matchesSearch({ needle, title, content }) {
  if (!needle) return true;

  const hay = `${String(title || '')} ${String(content || '')}`.toLowerCase().trim();
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;

  return tokens.every((t) => hay.includes(t));
}

// ─────────────────────────────────────────────────────────────
// SECTION 2: LIST FILTERING
// ─────────────────────────────────────────────────────────────

/**
 * filterPostLikeList
 * Applies table header filters to a merged list (drafts + api posts).
 *
 * @param {object} args - parameters
 * @param {Array<object>} args.merged - merged post-like list
 * @param {string} args.status - status filter value ('' or 'Draft' or BE status)
 * @param {string} args.tableOwner - owner filter value ('' | 'Draft' | 'AdminAccount' | 'UserAccount')
 * @param {string} args.searchNeedle - normalized search needle
 * @param {function(object):boolean} args.isLocalDraft - fn detects local draft
 * @param {function(object):string} args.getTitle - fn normalized title
 * @param {function(object):string} args.getContent - fn normalized content
 * @param {string} [args.tag] - optional tag filter
 * @returns {Array<object>} filtered list
 */
export function filterPostLikeList({ merged, status, tableOwner, searchNeedle, isLocalDraft, getTitle, getContent, tag }) {
  return (merged || []).filter((post) => {
    const localDraft = isLocalDraft(post);

    // Status filter
    if (status) {
      if (status === 'Draft') {
        if (!localDraft) return false;
      } else {
        if (localDraft) return false;
        if (String(post?.status) !== String(status)) return false;
      }
    }

    // Owner filter
    if (tableOwner) {
      if (tableOwner === 'Draft') {
        if (!localDraft) return false;
      } else {
        if (localDraft) return false;
        if (String(post?.postOwnerModel || '') !== String(tableOwner)) return false;
      }
    }

    // Tag filter (optional)
    if (tag) {
      const tags = Array.isArray(post?.postTags) ? post.postTags : [];
      if (!tags.includes(tag)) return false;
    }

    // Search
    if (!matchesSearch({ needle: searchNeedle, title: getTitle(post), content: getContent(post) })) return false;

    return true;
  });
}

// ── END CHANGE ─────────────────────────────────────────────
