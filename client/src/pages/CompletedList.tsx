import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Claim, ClaimStatus } from "@shared/schema";
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
import { useClaims } from "@/hooks/useClaims";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { ArrowUpDown, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

type CompletedRow = { claim: Claim; year: string; sortTime: number };

const toDate = (value?: string | Date | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value?: string | Date | null) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('ja-JP') : '-';
};

const getYearFromClaim = (claim: Claim, unknownYearLabel: string) => {
  const date =
    toDate(claim.createdAt) ??
    toDate(claim.receivedDate) ??
    toDate(claim.occurrenceDate);
  if (!date) return unknownYearLabel;
  const year = date.getFullYear();
  return Number.isNaN(year) ? unknownYearLabel : String(year);
};

const getSortTime = (claim: Claim) => {
  const date =
    toDate(claim.createdAt) ??
    toDate(claim.receivedDate) ??
    toDate(claim.occurrenceDate);
  if (!date) return 0;
  return date.getTime();
};

const getTotalQuantity = (claim: Claim) => {
  return Array.isArray((claim as any).dcItems)
    ? (claim as any).dcItems.reduce(
        (sum: number, item: { quantity?: number }) => sum + (item?.quantity ?? 0),
        0
      )
    : undefined;
};

const escapeCsvValue = (value: string) => {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export default function CompletedList() {
  const { t } = useTranslation();
  const { data: claims, isLoading } = useClaims({ status: "COMPLETED" });
  const unknownYearLabel = t("completed.unknownYear");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("completedDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const completedRows = useMemo(() => {
    const completed = claims || [];
    const rows: CompletedRow[] = completed.map((c) => ({
      claim: c,
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

  const filteredRows = completedRows.filter((row) => {
    if (yearFilter !== "all" && row.year !== yearFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const claim = row.claim;
    const totalQuantity = getTotalQuantity(claim);
    const haystack = [
      claim.tcarNo,
      claim.customerDefectId,
      claim.customerName,
      claim.defectName,
      claim.partNumber,
      claim.defectCode,
      claim.correctiveAction,
      totalQuantity?.toString(),
      formatDate(claim.createdAt),
      formatDate(claim.updatedAt),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    const toValue = (claim: Claim, key: string) => {
      switch (key) {
        case "tcarNo":
          return claim.tcarNo ?? "";
        case "customerDefectId":
          return claim.customerDefectId ?? "";
        case "customerName":
          return claim.customerName ?? "";
        case "defectName":
          return claim.defectName ?? "";
        case "partNumber":
          return claim.partNumber ?? "";
        case "totalQuantity":
          return Array.isArray((claim as any).dcItems)
            ? (claim as any).dcItems.reduce(
                (sum: number, item: { quantity?: number }) => sum + (item?.quantity ?? 0),
                0
              )
            : 0;
        case "defectCode":
          return claim.defectCode ?? "";
        case "occurrenceProcess":
          return claim.correctiveAction ?? "";
        case "issueDate":
          return toDate(claim.createdAt)?.getTime() ?? 0;
        case "completedDate":
          return toDate(claim.updatedAt)?.getTime() ?? 0;
        case "status":
          return claim.status ?? "";
        default:
          return "";
      }
    };
    rows.sort((a, b) => {
      const aVal = toValue(a.claim, sortKey);
      const bVal = toValue(b.claim, sortKey);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return rows;
  }, [filteredRows, sortKey, sortDir]);

  const handleDownloadCsv = () => {
    const headers = [
      { key: "tcarNo", label: t("table.tcarNo") },
      { key: "customerDefectId", label: t("table.customerDefectId") },
      { key: "customerName", label: t("table.customerName") },
      { key: "defectName", label: t("table.defectName") },
      { key: "partNumber", label: t("table.partNumber") },
      { key: "totalQuantity", label: t("table.totalQuantity") },
      { key: "defectCode", label: t("table.defectCode") },
      { key: "occurrenceProcess", label: t("table.occurrenceProcess") },
      { key: "issueDate", label: t("table.issueDate") },
      { key: "completedDate", label: t("table.completedDate") },
      { key: "status", label: t("table.status") },
    ];
    const lines = [
      headers.map((header) => escapeCsvValue(header.label)).join(","),
      ...sortedRows.map(({ claim }) => {
        const totalQuantity = getTotalQuantity(claim);
        const rowValues: Record<string, string> = {
          tcarNo: claim.tcarNo ?? "",
          customerDefectId: claim.customerDefectId ?? "",
          customerName: claim.customerName ?? "",
          defectName: claim.defectName ?? "",
          partNumber: claim.partNumber ?? "",
          totalQuantity: totalQuantity === undefined ? "" : String(totalQuantity),
          defectCode: claim.defectCode ?? "",
          occurrenceProcess: claim.correctiveAction ?? "",
          issueDate: formatDate(claim.createdAt),
          completedDate: formatDate(claim.updatedAt),
          status: claim.status ? t(`status.${claim.status}`) : "",
        };
        return headers
          .map((header) => escapeCsvValue(rowValues[header.key] ?? ""))
          .join(",");
      }),
    ];
    const csv = lines.join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    link.href = url;
    link.download = `completed-claims-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

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
        <Button
          variant="outline"
          onClick={handleDownloadCsv}
          disabled={sortedRows.length === 0}
          data-testid="button-download-completed-csv"
        >
          {t("completed.downloadCsv")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
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
        <div className="space-y-2 min-w-[260px] flex-1">
          <Label htmlFor="completed-search" className="text-xs">
            {t("completed.search")}
          </Label>
          <Input
            id="completed-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("completed.searchPlaceholder")}
            data-testid="input-completed-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <div className="rounded-md border text-xs" data-testid="table-claims">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("tcarNo")}
                  >
                    {t('table.tcarNo')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden lg:table-cell px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("customerDefectId")}
                  >
                    {t('table.customerDefectId')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("customerName")}
                  >
                    {t('table.customerName')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("defectName")}
                  >
                    {t('table.defectName')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden xl:table-cell px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("partNumber")}
                  >
                    {t('table.partNumber')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden xl:table-cell text-center px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("totalQuantity")}
                  >
                    {t('table.totalQuantity')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("defectCode")}
                  >
                    {t('table.defectCode')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("occurrenceProcess")}
                  >
                    {t('table.occurrenceProcess')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("issueDate")}
                  >
                    {t('table.issueDate')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("completedDate")}
                  >
                    {t('table.completedDate')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => handleSort("status")}
                  >
                    {t('table.status')}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                    {t('claims.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map(({ claim }) => {
                  const totalQuantity = getTotalQuantity(claim);
                  return (
                    <TableRow key={claim.id} className="hover-elevate" data-testid={`row-claim-${claim.id}`}>
                      <TableCell className="font-mono font-medium px-2 py-2" data-testid="text-tcar-no">
                        {claim.tcarNo}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground px-2 py-2" data-testid="text-customer-defect-id">
                        {claim.customerDefectId || '-'}
                      </TableCell>
                      <TableCell className="px-2 py-2" data-testid="text-customer-name">{claim.customerName}</TableCell>
                      <TableCell className="max-w-xs truncate px-2 py-2" data-testid="text-defect-name">
                        {claim.defectName}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground px-2 py-2" data-testid="text-part-number">
                        {claim.partNumber || '-'}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-center px-2 py-2" data-testid="text-total-quantity">
                        {totalQuantity ?? '-'}
                      </TableCell>
                      <TableCell className="px-2 py-2" data-testid="text-defect-code">{claim.defectCode || '-'}</TableCell>
                      <TableCell className="px-2 py-2" data-testid="text-occurrence-process">{claim.correctiveAction || '-'}</TableCell>
                      <TableCell className="px-2 py-2" data-testid="text-issue-date">{formatDate(claim.createdAt)}</TableCell>
                      <TableCell className="px-2 py-2" data-testid="text-completed-date">{formatDate(claim.updatedAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={claim.status as ClaimStatus} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => (window.location.href = `/claims/${claim.id}`)}
                          data-testid={`button-view-${claim.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/claims">
          <Button variant="outline">{t("detail.back")}</Button>
        </Link>
      </div>
    </div>
  );
}
