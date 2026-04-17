// Normalizes banner item shape from API.

export function getId(x) {
  return x?._id || x?.id;
}

export function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeBannerItem(x) {
  return {
    id: getId(x),
    title: x?.title || '',
    placement: x?.placement || '',
    order: toNumber(x?.order, 0),
    isActive: !!x?.isActive,
    imageUrl: x?.imageUrl || '',
    createdAt: x?.createdAt,
    updatedAt: x?.updatedAt,
  };
}
