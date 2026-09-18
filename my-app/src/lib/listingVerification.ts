export type ListingVerificationTone = "verified" | "pending" | "none";

export function listingVerificationTier(tier?: string | null): ListingVerificationTone {
  const value = String(tier || "unverified").toLowerCase();
  if (value === "verified") return "verified";
  if (value === "pending") return "pending";
  return "none";
}

export function listingVerificationLabel(tier?: string | null): string {
  const tone = listingVerificationTier(tier);
  if (tone === "verified") return "Verified listing";
  if (tone === "pending") return "Verification pending";
  return "Not verified";
}
