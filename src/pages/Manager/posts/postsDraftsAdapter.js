/**
 * ============================================================
 * FILE: src/pages/Manager/posts/postsDraftsAdapter.js
 * ============================================================
 * WHAT IS THIS FILE?
 *   DEPRECATED compatibility shim.
 *   Drafts are now persisted in DB as Post.status = 'Draft'.
 *
 * RESPONSIBILITIES:
 *   - Provide no-op/throwing functions so old imports don't crash silently
 *
 * USED IN:
 *   (Should be none; safe to keep until fully removed.)
 * ============================================================
 */

// ── CHANGE [2026-04-21]: Add structured header for deprecated shim ──

export function loadDraftItems() {
  return [];
}

export function addOrUpdateDraft() {
  throw new Error('Local draft adapter is deprecated. Use API to save Draft posts.');
}

export function deleteDraftById() {
  throw new Error('Local draft adapter is deprecated. Use API to delete Draft posts.');
}

export function getDraftById() {
  return null;
}

// ── END CHANGE ─────────────────────────────────────────────
