import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Claim } from "@shared/schema";
import ClaimsTable, { type ClaimRow } from "@/components/ClaimsTable";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TechnicalApprovalList() {
  const { t } = useTranslation();
  const { data: claims, isLoading } = useQuery<Claim[]>({ queryKey: ["/api/claims"] });

  // Show items pending countermeasure that already have a document uploaded
  const awaitingApproval = (claims || []).filter(
    (c) => c.status === "PENDING_COUNTERMEASURE" && !!c.driveFileUrl
  );

  const rows: ClaimRow[] = awaitingApproval.map((c) => ({
    id: c.id,
    tcarNo: c.tcarNo,
    customerDefectId: c.customerDefectId || undefined,
    customerName: c.customerName,
    partNumber: c.partNumber || undefined,
    defectName: c.defectName,
    defectCount: c.defectCount || undefined,
    status: c.status,
    dueDate: c.dueDate || undefined,
    assignee: c.assignee || undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('approvals.title')}</h1>
          <p className="text-muted-foreground">{t('approvals.subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <ClaimsTable
          claims={rows}
          onViewClaim={(id) => (window.location.href = `/approvals/${id}`)}
        />
      )}

      <div className="flex justify-end">
        <Link href="/claims">
          <Button variant="outline">{t('detail.back')}</Button>
        </Link>
      </div>
    </div>
  );
}

