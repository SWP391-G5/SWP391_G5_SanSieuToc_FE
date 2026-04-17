export function parsePriceText(priceText) {
  const digits = String(priceText ?? '').replace(/[^\d]/g, '');
  return Number(digits) || 0;
}
