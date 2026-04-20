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
  {
    key: 'community_horizontal',
    label: 'Community - Horizontal Banner',
    page: 'CommunityPage',
    position: 'Top rectangular banner above community feed',
    previewPath: '/community',
    maxItems: 3,
  },
  {
    key: 'community_vertical',
    label: 'Community - Vertical Side Ads',
    page: 'CommunityPage',
    position: 'Right sidebar vertical banners (sticky)',
    previewPath: '/community',
    maxItems: 2,
  },
  {
    key: 'field_detail_banner',
    label: 'Field Detail - Side Banner',
    page: 'FieldDetailPage',
    position: 'Promotional banner inside the booking sidebar/details',
    previewPath: '/fields',
    maxItems: 1,
  },
  {
    key: 'field_detail_horizontal',
    label: 'Field Detail - Horizontal Top',
    page: 'FieldDetailPage',
    position: 'Top rectangular banner above the field content description',
    previewPath: '/fields',
    maxItems: 3,
  },
];

export function getPlacementMeta(key) {
  return PLACEMENTS.find((p) => p.key === key) || null;
}
