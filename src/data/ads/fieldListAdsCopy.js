// Hard-coded ad copy for FieldListPage slider.
// We keep this FE-only to avoid DB changes.

/**
 * @typedef {Object} FieldListAdCopy
 * @property {string} badge
 * @property {string} title
 * @property {string} highlight
 * @property {string} desc
 * @property {string} cta
 * @property {string} to - navigation target path (used by react-router)
 */

/**
 * Keep copy generic & always-true (avoid advertising features that may not exist).
 * Routes should only point to pages we are confident exist in the app.
 */

/** @type {FieldListAdCopy[]} */
export const FIELD_LIST_ADS_COPY = [
  {
    badge: 'Quick Tip',
    title: 'Compare Fields In One Place',
    highlight: 'Fast search',
    desc: 'Use filters to find the right field by location, size, and price range.',
    cta: 'Browse Fields',
    to: '/fields',
  },
  {
    badge: 'Trending',
    title: 'Spot Popular Choices',
    highlight: 'Top rated',
    desc: 'Sort by rating to discover fields people love to book.',
    cta: 'View Top Rated',
    to: '/fields',
  },
  {
    badge: 'Planning',
    title: 'Pick The Right Size',
    highlight: '5 / 7 / 11',
    desc: 'Choose the field size that matches your team and play style.',
    cta: 'Filter By Size',
    to: '/fields',
  },
  {
    badge: 'Save Time',
    title: 'Keep Favorites Handy',
    highlight: 'Wishlist',
    desc: 'Like a field to quickly return later and compare options.',
    cta: 'Continue Browsing',
    to: '/fields',
  },
  {
    badge: 'Voucher',
    title: 'Find Promotions In Community',
    highlight: 'Posts',
    desc: 'Check community posts for voucher updates and shared deals.',
    cta: 'Go To Community',
    to: '/community',
  },
  {
    badge: 'Update',
    title: 'New Fields & Posts',
    highlight: 'Keep watching',
    desc: 'Come back anytime to see the latest updates across the platform.',
    cta: 'Open Community',
    to: '/community',
  },
];
