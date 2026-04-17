/**
 * postUploadHelpers.js
 * Image picking helpers for Manager Posts form (client-side only).
 */

/**
 * MAX_IMAGES_PER_POST
 * Maximum number of images allowed per post.
 */
export const MAX_IMAGES_PER_POST = 6;

/**
 * buildPickedImagePreviews
 * Converts selected FileList into preview objects {file, previewUrl}.
 *
 * @param {FileList|File[]|null|undefined} files - selected files
 * @returns {Array<{file: File, previewUrl: string}>} preview items
 */
export function buildPickedImagePreviews(files) {
  return Array.from(files || []).map((file) => {
    return { file, previewUrl: URL.createObjectURL(file) };
  });
}

/**
 * countNewFiles
 * Counts how many new files exist in the current images array.
 *
 * @param {Array<any>} images - images state
 * @returns {number} count
 */
export function countNewFiles(images) {
  return (images || []).filter((x) => x && typeof x === 'object' && x.file instanceof File).length;
}

/**
 * revokePreviewUrl
 * Revokes an object URL in a safe way.
 *
 * @param {string|undefined|null} url - object URL
 * @returns {void}
 */
export function revokePreviewUrl(url) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

/**
 * appendNewImagesToFormData
 * Appends up to MAX_IMAGES_PER_POST new file objects into a FormData.
 *
 * @param {object} args - parameters
 * @param {FormData} args.formData - target form data
 * @param {Array<any>} args.images - images state
 * @returns {void}
 */
export function appendNewImagesToFormData({ formData, images }) {
  const newFiles = (images || [])
    .filter((x) => x && typeof x === 'object' && x.file instanceof File)
    .slice(0, MAX_IMAGES_PER_POST);

  newFiles.forEach((x) => formData.append('images', x.file));
}
