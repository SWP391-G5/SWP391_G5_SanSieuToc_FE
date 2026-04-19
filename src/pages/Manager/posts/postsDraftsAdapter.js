/**
 * postsDraftsAdapter.js
 * DEPRECATED: drafts are now persisted in DB (Post.status = 'Draft').
 */

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
