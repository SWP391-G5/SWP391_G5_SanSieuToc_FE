/**
 * ============================================================
 * FILE: src/pages/Manager/posts/postDraftStorage.js
 * ============================================================
 * WHAT IS THIS FILE?
 *   DEPRECATED compatibility shim.
 *   Local draft storage has been replaced by DB drafts.
 *
 * RESPONSIBILITIES:
 *   - Provide no-op/throwing functions so legacy imports remain explicit
 *
 * USED IN:
 *   (Should be none; safe to keep until fully removed.)
 * ============================================================
 */

// ── CHANGE [2026-04-21]: Add structured header for deprecated shim ──

export function buildDraftStorageKey() {
  return '__deprecated__';
}

export function readDraftList() {
  return [];
}

export function writeDraftList() {
  // no-op
}

export function addOrUpdateDraft() {
  throw new Error('Local draft storage is deprecated. Use DB drafts (status=Draft).');
}

export function deleteDraftById() {
  throw new Error('Local draft storage is deprecated. Use DB drafts (status=Draft).');
}

export function getDraftById() {
  return null;
}

// ── END CHANGE ─────────────────────────────────────────────
