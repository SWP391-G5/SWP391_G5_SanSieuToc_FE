/**
 * adUtils.js
 * Utilities for marketing and advertisement logic.
 */

/**
 * Shuffles an array and returns a subset of N items.
 * Used to get unique random ads for a slider in a single session.
 * 
 * @param {Array} array - The pool of ad copies
 * @param {number} count - How many items to return
 * @returns {Array} Shuffled subset
 */
export function getRandomAdsFromPool(array, count = 3) {
  if (!Array.isArray(array) || array.length === 0) return [];
  
  // Clone and shuffle
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, count);
}

/**
 * Returns a single random item from a pool.
 * @param {Array} array 
 * @returns {Object}
 */
export function getRandomAd(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}
