import { useState } from "react";
import ClaimsTable, { type ClaimRow } from "@/components/ClaimsTable";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Claim } from "@shared/schema";

export default function ClaimsList() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: claims, isLoading } = useQuery<Claim[]>({ queryKey: ["/api/claims"] });

  const allClaims: ClaimRow[] = (claims || []).map((c) => ({
    id: c.id,
    tcarNo: c.tcarNo,
    customerDefectId: c.customerDefectId || undefined,
    customerName: c.customerName,
    partNumber: c.partNumber || undefined,
    dc: Array.isArray((c as any).dcItems) && (c as any).dcItems.length > 0 ? (c as any).dcItems[0].dc : undefined,
    defectName: c.defectName,
    defectCount: c.defectCount || undefined,
    occurrenceDate: c.occurrenceDate || undefined,
    status: c.status as any,
    dueDate: c.dueDate || undefined,
    assignee: c.assignee || undefined,
  }));

  const filteredClaims = allClaims.filter((claim) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (claim.tcarNo || '').toLowerCase().includes(q) ||
      (claim.customerName || '').toLowerCase().includes(q) ||
      (claim.defectName || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('claims.title')}</h1>
          <p className="text-muted-foreground">{t('claims.subtitle', { count: filteredClaims.length })}</p>
        </div>
        <Link href="/claims/new">
          <Button data-testid="button-new-claim">
            <Plus className="h-4 w-4 mr-2" />
            {t('claims.newClaim')}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <FilterBar onStatusChange={setStatusFilter} />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">読み込み中...</div>
      ) : (
        <ClaimsTable
          claims={filteredClaims}
          onViewClaim={(id) => {
            const claim = filteredClaims.find(c => c.id === id);
            if (!claim) return;

            if (claim.status === 'PENDING_ACCEPTANCE') {
              setLocation(`/claims/acceptance/${id}`);
            } else if (claim.status === 'PENDING_COUNTERMEASURE') {
              setLocation(`/claims/countermeasure/${id}`);
            } else {
              setLocation(`/claims/${id}`);
            }
          }}
          onSort={(column) => console.log('Sort by:', column)}
        />
      )}
    </div>
  );
}
