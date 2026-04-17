/**
 * postsDraftsAdapter.js
 * Bridges ManagerPostsPage state with the localStorage draft helpers.
 */

import {
  addOrUpdateDraft as addOrUpdateDraftRaw,
  buildDraftStorageKey,
  deleteDraftById as deleteDraftByIdRaw,
  getDraftById as getDraftByIdRaw,
  readDraftList,
} from './postDraftStorage';

/**
 * loadDraftItems
 * @param {object} args
 * @param {string} args.userId
 * @returns {Array<any>}
 */
export function loadDraftItems({ userId }) {
  const key = buildDraftStorageKey(userId);
  return readDraftList(key);
}

/**
 * addOrUpdateDraft
 * @param {object} args
 * @param {string} args.userId
 * @param {string|null} args.draftId
 * @param {string} args.postName
 * @param {string} args.postContent
 * @returns {string} saved draft id
 */
export function addOrUpdateDraft({ userId, draftId, postName, postContent }) {
  const draftStorageKey = buildDraftStorageKey(userId);
  return addOrUpdateDraftRaw({ draftStorageKey, userId, draftId, postName, postContent });
}

/**
 * deleteDraftById
 * @param {object} args
 * @param {string} args.userId
 * @param {string} args.draftId
 */
export function deleteDraftById({ userId, draftId }) {
  const draftStorageKey = buildDraftStorageKey(userId);
  deleteDraftByIdRaw({ draftStorageKey, draftId });
}

/**
 * getDraftById
 * @param {object} args
 * @param {string} args.userId
 * @param {string} args.draftId
 * @returns {any|null}
 */
export function getDraftById({ userId, draftId }) {
  const draftStorageKey = buildDraftStorageKey(userId);
  return getDraftByIdRaw({ draftStorageKey, draftId });
}
