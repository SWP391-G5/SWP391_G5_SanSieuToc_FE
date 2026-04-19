/**
 * postDraftStorage.js
 * DEPRECATED: drafts are now persisted in DB (Post.status = 'Draft').
 * Kept as a compatibility shim; should be removed once no longer imported.
 */

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
