/**
 * postDraftStorage.js
 * Local-only drafts persistence for Manager Posts.
 *
 * Purpose:
 * - Store/retrieve/update/delete draft posts in localStorage.
 * - Keep draft objects shaped similarly to Post for table display.
 *
 * Notes:
 * - Draft images are NOT persisted (File objects cannot be safely serialized).
 */

/**
 * buildDraftStorageKey
 * Builds a per-user localStorage key for draft list.
 *
 * @param {string} userId - Current user's id
 * @returns {string} localStorage key
 */
export function buildDraftStorageKey(userId) {
  return `manager.posts.drafts.${String(userId || 'anon')}`;
}

/**
 * readDraftList
 * Reads draft list from localStorage.
 *
 * @param {string} draftStorageKey - localStorage key
 * @returns {Array<object>} draft list
 */
export function readDraftList(draftStorageKey) {
  try {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * writeDraftList
 * Writes draft list to localStorage.
 *
 * @param {string} draftStorageKey - localStorage key
 * @param {Array<object>} draftList - draft list
 * @returns {void}
 */
export function writeDraftList(draftStorageKey, draftList) {
  try {
    localStorage.setItem(draftStorageKey, JSON.stringify(Array.isArray(draftList) ? draftList : []));
  } catch {
    // ignore
  }
}

/**
 * addOrUpdateDraft
 * Adds or updates a local draft in storage.
 *
 * @param {object} args - parameters
 * @param {string} args.draftStorageKey - localStorage key
 * @param {string} args.userId - current user id
 * @param {string|null} args.draftId - existing draft id (if editing)
 * @param {string} args.postName - draft title
 * @param {string} args.postContent - draft content
 * @returns {string} saved draft id
 */
export function addOrUpdateDraft({ draftStorageKey, userId, draftId, postName, postContent }) {
  const now = new Date().toISOString();
  const list = readDraftList(draftStorageKey);

  const safeId = draftId || `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const nextDraft = {
    _id: safeId,
    postName: String(postName || '').trim(),
    postContent: String(postContent || ''),
    status: 'Draft',
    postOwnerModel: 'AdminAccount',
    postOwnerID: String(userId || ''),
    createdAt: now,
    updatedAt: now,
    __localDraft: true,
  };

  const existingIndex = list.findIndex((x) => String(x?._id) === String(safeId));
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...nextDraft, updatedAt: now };
  } else {
    list.unshift(nextDraft);
  }

  writeDraftList(draftStorageKey, list);
  return safeId;
}

/**
 * deleteDraftById
 * Deletes a local draft by id.
 *
 * @param {object} args - parameters
 * @param {string} args.draftStorageKey - localStorage key
 * @param {string} args.draftId - draft id
 * @returns {void}
 */
export function deleteDraftById({ draftStorageKey, draftId }) {
  const list = readDraftList(draftStorageKey).filter((x) => String(x?._id) !== String(draftId));
  writeDraftList(draftStorageKey, list);
}

/**
 * getDraftById
 * Retrieves a draft by id.
 *
 * @param {object} args - parameters
 * @param {string} args.draftStorageKey - localStorage key
 * @param {string} args.draftId - draft id
 * @returns {object|null} draft
 */
export function getDraftById({ draftStorageKey, draftId }) {
  const list = readDraftList(draftStorageKey);
  return list.find((x) => String(x?._id) === String(draftId)) || null;
}
