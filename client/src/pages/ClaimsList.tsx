import { useState } from "react";
import ClaimsTable, { type ClaimRow } from "@/components/ClaimsTable";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useClaims } from "@/hooks/useClaims";
import type { Claim } from "@shared/schema";

type SortKey =
  | 'tcarNo'
  | 'customerDefectId'
  | 'customerName'
  | 'defectName'
  | 'partNumber'
  | 'totalQuantity'
  | 'status'
  | 'dueDate';

const isSortKey = (value: string): value is SortKey => {
  return [
    'tcarNo',
    'customerDefectId',
    'customerName',
    'defectName',
    'partNumber',
    'totalQuantity',
    'status',
    'dueDate',
  ].includes(value);
};

export default function ClaimsList() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('tcarNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data: claims, isLoading } = useClaims();

  const allClaims: ClaimRow[] = (claims || []).map((c) => ({
    id: c.id,
    tcarNo: c.tcarNo,
    customerDefectId: c.customerDefectId || undefined,
    customerName: c.customerName,
    partNumber: c.partNumber || undefined,
    dc: Array.isArray((c as any).dcItems) && (c as any).dcItems.length > 0 ? (c as any).dcItems[0].dc : undefined,
    defectName: c.defectName,
    totalQuantity: Array.isArray((c as any).dcItems)
      ? (c as any).dcItems.reduce((sum: number, item: { quantity?: number }) => sum + (item?.quantity ?? 0), 0)
      : undefined,
    occurrenceDate: c.occurrenceDate || undefined,
    status: c.status as any,
    dueDate: c.dueDate || undefined,
    assignee: c.assignee || undefined,
  }));

  const visibleClaims = allClaims.filter((claim) => claim.status !== "COMPLETED");

  const filteredClaims = visibleClaims.filter((claim) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (claim.tcarNo || '').toLowerCase().includes(q) ||
      (claim.customerName || '').toLowerCase().includes(q) ||
      (claim.defectName || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSortValue = (claim: ClaimRow, key: SortKey) => {
    switch (key) {
      case 'totalQuantity':
        return claim.totalQuantity ?? null;
      case 'dueDate': {
        if (!claim.dueDate) return null;
        const time = new Date(claim.dueDate).getTime();
        return Number.isNaN(time) ? claim.dueDate : time;
      }
      case 'customerDefectId':
        return claim.customerDefectId ?? null;
      case 'customerName':
        return claim.customerName ?? null;
      case 'defectName':
        return claim.defectName ?? null;
      case 'partNumber':
        return claim.partNumber ?? null;
      case 'status':
        return claim.status ?? null;
      case 'tcarNo':
      default:
        return claim.tcarNo ?? null;
    }
  };

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    const aValue = getSortValue(a, sortKey);
    const bValue = getSortValue(b, sortKey);
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * (sortDir === 'asc' ? 1 : -1);
    }
    return String(aValue).localeCompare(String(bValue), 'ja') * (sortDir === 'asc' ? 1 : -1);
  });

  const handleSort = (column: string) => {
    if (!isSortKey(column)) return;
    if (column === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDir('asc');
    }
  };

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
          claims={sortedClaims}
          onViewClaim={(id) => {
            const claim = filteredClaims.find(c => c.id === id);
            if (!claim) return;

            if (claim.status === 'PENDING_ACCEPTANCE') {
              setLocation(`/claims/acceptance/${id}`);
            } else if (claim.status === 'PENDING_COUNTERMEASURE') {
              setLocation(`/claims/countermeasure/${id}`);
            } else if (claim.status === 'PENDING_APPROVAL') {
              setLocation(`/approvals/${id}`);
            } else {
              setLocation(`/claims/${id}`);
            }
          }}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
