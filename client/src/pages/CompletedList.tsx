import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Claim, ClaimStatus } from "@shared/schema";
import ClaimsTable, { type ClaimRow } from "@/components/ClaimsTable";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type CompletedRow = ClaimRow & { year: string; sortTime: number };

const getYearFromClaim = (claim: Claim, unknownYearLabel: string) => {
  const date = claim.receivedDate || claim.occurrenceDate || "";
  if (date.length >= 4) return date.slice(0, 4);
  if (claim.createdAt) {
    const year = new Date(claim.createdAt).getFullYear();
    if (!Number.isNaN(year)) return String(year);
  }
  return unknownYearLabel;
};

const getSortTime = (claim: Claim) => {
  const date = claim.receivedDate || claim.occurrenceDate || "";
  const time = date ? new Date(date).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

export default function CompletedList() {
  const { t } = useTranslation();
  const { data: claims, isLoading } = useQuery<Claim[]>({ queryKey: ["/api/claims"] });
  const unknownYearLabel = t("completed.unknownYear");
  const [yearFilter, setYearFilter] = useState("all");

  const completedRows = useMemo(() => {
    const completed = (claims || []).filter((c) => c.status === "COMPLETED");
    const rows: CompletedRow[] = completed.map((c) => ({
      id: c.id,
      tcarNo: c.tcarNo,
      customerDefectId: c.customerDefectId || undefined,
      customerName: c.customerName,
      partNumber: c.partNumber || undefined,
      defectName: c.defectName,
      defectCount: c.defectCount || undefined,
      status: c.status as ClaimStatus,
      dueDate: c.dueDate || undefined,
      assignee: c.assignee || undefined,
      year: getYearFromClaim(c, unknownYearLabel),
      sortTime: getSortTime(c),
    }));

    rows.sort((a, b) => {
      const yearA = Number.parseInt(a.year, 10);
      const yearB = Number.parseInt(b.year, 10);
      if (!Number.isNaN(yearA) && !Number.isNaN(yearB) && yearA !== yearB) {
        return yearB - yearA;
      }
      if (!Number.isNaN(yearA) && Number.isNaN(yearB)) return -1;
      if (Number.isNaN(yearA) && !Number.isNaN(yearB)) return 1;
      return b.sortTime - a.sortTime;
    });

    return rows;
  }, [claims, unknownYearLabel]);

  const years = useMemo(() => {
    const set = new Set(completedRows.map((row) => row.year));
    const list = Array.from(set);
    list.sort((a, b) => {
      const yearA = Number.parseInt(a, 10);
      const yearB = Number.parseInt(b, 10);
      if (!Number.isNaN(yearA) && !Number.isNaN(yearB)) return yearB - yearA;
      if (!Number.isNaN(yearA) && Number.isNaN(yearB)) return -1;
      if (Number.isNaN(yearA) && !Number.isNaN(yearB)) return 1;
      return a.localeCompare(b);
    });
    return list;
  }, [completedRows]);

  const filteredRows = completedRows.filter((row) =>
    yearFilter === "all" ? true : row.year === yearFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            {t("completed.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("completed.subtitle", { count: filteredRows.length })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2 min-w-[200px]">
          <Label htmlFor="filter-year" className="text-xs">
            {t("completed.year")}
          </Label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger id="filter-year" data-testid="select-filter-year">
              <SelectValue placeholder={t("completed.allYears")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("completed.allYears")}</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <ClaimsTable
          claims={filteredRows}
          onViewClaim={(id) => (window.location.href = `/claims/${id}`)}
        />
      )}

      <div className="flex justify-end">
        <Link href="/claims">
          <Button variant="outline">{t("detail.back")}</Button>
        </Link>
      </div>
    </div>
  );
}
