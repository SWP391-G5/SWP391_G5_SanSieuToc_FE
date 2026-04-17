import { PLACEMENTS } from '../../../config/placements';

export { PLACEMENTS };

export const DEFAULT_PLACEMENT = PLACEMENTS[0]?.key || 'home_hero';

export function placementLabel(key) {
  return PLACEMENTS.find((p) => p.key === key)?.label || key;
}
