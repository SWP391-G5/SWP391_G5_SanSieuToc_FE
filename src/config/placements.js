// Central placement registry for marketing images (banners & ads).
// Used by Manager UI to show: which page/position it affects + preview link.

export const PLACEMENTS = [
  {
    key: 'home_hero',
    label: 'Home - Hero Slider',
    page: 'HomePage',
    position: 'Hero background slider (top of page)',
    previewPath: '/',
    maxItems: 6,
  },
  {
    key: 'fields_list_ads',
    label: 'Fields List - Ads Slider',
    page: 'FieldListPage',
    position: 'Ad section above fields grid',
    previewPath: '/fields',
    maxItems: 6,
  },
];

export function getPlacementMeta(key) {
  return PLACEMENTS.find((p) => p.key === key) || null;
}
