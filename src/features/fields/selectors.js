import { normalizeText } from '../../utils/normalizeText';

export function getTopRatedFields(fields, limit = 3) {
  const sorted = [...(fields || [])].sort((a, b) => {
    const ra = Number(a.rating) || 0;
    const rb = Number(b.rating) || 0;
    if (rb !== ra) return rb - ra;
    return String(a.name).localeCompare(String(b.name));
  });

  return sorted.slice(0, limit);
}

export function getFieldSuggestions(fields, query, limit = 6) {
  const q = normalizeText(query);
  if (!q) return [];

  return [...(fields || [])]
    .filter((f) => normalizeText(`${f.name} ${f.address}`).includes(q))
    .sort((a, b) => {
      const ra = Number(a.rating) || 0;
      const rb = Number(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, limit);
}
