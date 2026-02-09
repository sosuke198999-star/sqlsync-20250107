import type { Claim } from "@shared/schema";
import type { ClaimRow } from "@/components/ClaimsTable";
import { calculateTotalQuantity, getFirstDc } from "./claimUtils";

/**
 * Convert a Claim object to ClaimRow format for table display
 * Centralizes the mapping logic used across multiple list views
 *
 * @param claim - The claim object to convert
 * @returns ClaimRow object ready for table display
 */
export function mapClaimToClaimRow(claim: Claim): ClaimRow {
  return {
    id: claim.id,
    tcarNo: claim.tcarNo,
    customerDefectId: claim.customerDefectId || undefined,
    customerName: claim.customerName,
    partNumber: claim.partNumber || undefined,
    dc: getFirstDc(claim),
    defectName: claim.defectName,
    totalQuantity: calculateTotalQuantity(claim),
    occurrenceDate: claim.occurrenceDate || undefined,
    status: claim.status as any,
    dueDate: claim.dueDate || undefined,
    assignee: claim.assignee || undefined,
  };
}

/**
 * Convert an array of Claims to ClaimRows
 *
 * @param claims - Array of claim objects
 * @returns Array of ClaimRow objects
 */
export function mapClaimsToClaimRows(claims: Claim[]): ClaimRow[] {
  return claims.map(mapClaimToClaimRow);
}
