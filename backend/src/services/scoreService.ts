const CATEGORY_TO_NUMERIC: Record<string, number> = {
  poor: 15,
  fair: 40,
  good: 65,
  excellent: 85,
};

export function calculateWebsiteQualityScore(
  visualCategory: string,
  contentCategory: string
): number {
  const visual = CATEGORY_TO_NUMERIC[visualCategory] || 40;
  const content = CATEGORY_TO_NUMERIC[contentCategory] || 40;

  // 60% visual + 40% content
  return Math.round(visual * 0.6 + content * 0.4);
}

export function calculateLeadScore(
  googleRating: number,
  googleReviewCount: number,
  visualCategory: string,
  contentItemsPresentCount: number
): number {
  // Component 1: Reputation (max 25)
  const reputation = Math.max(0, Math.min(25, ((googleRating - 3.5) / 1.5) * 25));

  // Component 2: Establishment (max 15) — logarithmic
  const establishment =
    googleReviewCount >= 10
      ? Math.min(15, Math.log2(googleReviewCount / 10) * 5)
      : 0;

  // Component 3: Visual Opportunity (max 35) — INVERTED
  const visualOpportunity: Record<string, number> = {
    poor: 35,
    fair: 23,
    good: 10,
    excellent: 0,
  };
  const visual = visualOpportunity[visualCategory] ?? 23;

  // Component 4: Content Gaps (max 25) — INVERTED
  const missingItems = 12 - contentItemsPresentCount;
  let contentGaps = 0;
  if (missingItems >= 9) contentGaps = 25;
  else if (missingItems >= 6) contentGaps = 18;
  else if (missingItems >= 3) contentGaps = 10;

  return Math.round(reputation + establishment + visual + contentGaps);
}

export function determineLeadCategory(
  leadScore: number
): "hot" | "warm" | "cool" | "skip" {
  if (leadScore >= 75) return "hot";
  if (leadScore >= 55) return "warm";
  if (leadScore >= 35) return "cool";
  return "skip";
}
