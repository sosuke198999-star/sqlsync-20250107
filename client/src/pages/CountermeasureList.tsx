import { useTranslation } from "react-i18next";
import type { Claim, ClaimStatus } from "@shared/schema";
import ClaimsTable, { type ClaimRow } from "@/components/ClaimsTable";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useClaims } from "@/hooks/useClaims";
import { mapClaimsToClaimRows } from "@/lib/claimMappers";

export default function CountermeasureList() {
  const { t } = useTranslation();
  const { data: claims, isLoading } = useClaims({ status: "PENDING_COUNTERMEASURE" });

  const rows: ClaimRow[] = mapClaimsToClaimRows(claims || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('countermeasureList.title')}
          </h1>
          <p className="text-muted-foreground">{t('countermeasureList.subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <ClaimsTable
          claims={rows}
          onViewClaim={(id) => (window.location.href = `/claims/countermeasure/${id}`)}
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

