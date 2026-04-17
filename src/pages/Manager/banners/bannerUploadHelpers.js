/**
 * bannerUploadHelpers.js
 * Image helpers for Banner management.
 */

export const BANNER_MAX_IMAGES = 1;

export function buildPickedImagePreview(file) {
  if (!file) return null;
  return { file, previewUrl: URL.createObjectURL(file) };
}

export function revokePreviewUrl(url) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}
