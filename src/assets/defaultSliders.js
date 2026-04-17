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
