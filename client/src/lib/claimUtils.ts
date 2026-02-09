import type { Claim } from "@shared/schema";

/**
 * Calculate total quantity from dcItems array
 * Handles missing or malformed dcItems gracefully
 *
 * @param claim - The claim object to calculate quantity from
 * @returns Total quantity or undefined if no dcItems exist
 */
export function calculateTotalQuantity(claim: Claim): number | undefined {
  if (!claim.dcItems || claim.dcItems.length === 0) {
    return undefined;
  }

  return claim.dcItems.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );
}

/**
 * Get the first DC from dcItems array
 * Used for displaying primary DC in list views
 *
 * @param claim - The claim object to extract DC from
 * @returns First DC string or undefined if no dcItems exist
 */
export function getFirstDc(claim: Claim): string | undefined {
  if (!claim.dcItems || claim.dcItems.length === 0) {
    return undefined;
  }

  return claim.dcItems[0]?.dc;
}
