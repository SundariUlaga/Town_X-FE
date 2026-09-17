/** Score listings by similarity to a seed property the user viewed. */

export type RecommendableProperty = {
  id: number;
  locality?: string | null;
  city?: string | null;
  bhk_type?: string | null;
  property_for?: string | null;
  property_type?: string | null;
  expected_price?: number | null;
};

export function scoreSimilarToViewed(
  candidate: RecommendableProperty,
  seed: RecommendableProperty
): number {
  let score = 0;
  if (seed.locality && candidate.locality) {
    if (candidate.locality.toLowerCase() === seed.locality.toLowerCase()) score += 10;
  }
  if (seed.city && candidate.city) {
    if (candidate.city.toLowerCase() === seed.city.toLowerCase()) score += 5;
  }
  if (seed.bhk_type && candidate.bhk_type === seed.bhk_type) score += 4;
  if (seed.property_for && candidate.property_for === seed.property_for) score += 3;
  if (seed.property_type && candidate.property_type === seed.property_type) score += 2;
  if (seed.expected_price && candidate.expected_price) {
    const ratio =
      Math.abs(Number(candidate.expected_price) - Number(seed.expected_price)) /
      Math.max(Number(seed.expected_price), 1);
    if (ratio < 0.2) score += 4;
    else if (ratio < 0.4) score += 2;
  }
  return score;
}

export function pickSimilarProperties<T extends RecommendableProperty>(
  pool: T[],
  seed: RecommendableProperty | null,
  excludeIds: Set<number>,
  limit = 6
): T[] {
  const candidates = pool.filter((p) => !excludeIds.has(p.id) && p.id !== seed?.id);
  if (!seed) {
    return candidates.slice(0, limit);
  }
  return [...candidates]
    .map((p) => ({ p, score: scoreSimilarToViewed(p, seed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.p);
}
