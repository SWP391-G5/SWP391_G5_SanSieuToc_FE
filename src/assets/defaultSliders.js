/**
 * defaultSliders.js
 * Central place for FE default slider images.
 * These are used when no DB-configured banners exist.
 */

import football1 from './images/football1.png';
import football2 from './images/football2.png';
import football3 from './images/football3.png';
import football4 from './images/football4.png';
import football5 from './images/football5.png';
import football6 from './images/football6.png';
import football7 from './images/football7.png';
import football8 from './images/football8.png';
import football9 from './images/football9.png';
import football10 from './images/football10.png';
import football11 from './images/football11.png';

export const DEFAULT_HOME_HERO_SLIDES = [
  football1,
  football2,
  football3,
  football4,
  football5,
  football6,
  football7,
  football8,
  football9,
  football10,
  football11,
];

// Reuse the same set for FieldList ads for now.
// You can change this later to a dedicated list if needed.
export const DEFAULT_FIELDS_LIST_ADS_SLIDES = DEFAULT_HOME_HERO_SLIDES;

// Fallbacks for newly defined placements in config/placements.js
export const DEFAULT_COMMUNITY_HORIZONTAL = [football7, football8, football9];
export const DEFAULT_COMMUNITY_VERTICAL = [football10, football11];
export const DEFAULT_FIELD_DETAIL_BANNER = [football4, football5];
export const DEFAULT_FIELD_DETAIL_HORIZONTAL = [football5, football9, football10];

// Map a placement key to its fallback array
export function getFallbackImagesForPlacement(key) {
  switch (key) {
    case 'home_hero':
      return DEFAULT_HOME_HERO_SLIDES;
    case 'fields_list_ads':
      return DEFAULT_FIELDS_LIST_ADS_SLIDES;
    case 'community_horizontal':
      return DEFAULT_COMMUNITY_HORIZONTAL;
    case 'community_vertical':
      return DEFAULT_COMMUNITY_VERTICAL;
    case 'field_detail_banner':
      return DEFAULT_FIELD_DETAIL_BANNER;
    default:
      return [football1];
  }
}
