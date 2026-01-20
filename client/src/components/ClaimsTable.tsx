import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge, { type ClaimStatus } from "./StatusBadge";
import { ArrowUpDown, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ClaimRow {
  id: string;
  tcarNo: string;
  customerDefectId?: string;
  customerName: string;
  partNumber?: string;
  dc?: string;
  defectName: string;
  totalQuantity?: number;
  occurrenceDate?: string;
  status: ClaimStatus;
  dueDate?: string;
  assignee?: string;
}

interface ClaimsTableProps {
  claims: ClaimRow[];
  onViewClaim?: (id: string) => void;
  onSort?: (column: string) => void;
}

export default function ClaimsTable({ claims, onViewClaim, onSort }: ClaimsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border" data-testid="table-claims">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[130px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('tcarNo')}
                data-testid="button-sort-tcar"
              >
                {t('table.tcarNo')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('customerDefectId')}
                data-testid="button-sort-customer-defect-id"
              >
                {t('table.customerDefectId')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('customerName')}
                data-testid="button-sort-customer-name"
              >
                {t('table.customerName')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('defectName')}
                data-testid="button-sort-defect-name"
              >
                {t('table.defectName')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('partNumber')}
                data-testid="button-sort-part-number"
              >
                {t('table.partNumber')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="hidden xl:table-cell text-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('totalQuantity')}
                data-testid="button-sort-total-quantity"
              >
                {t('table.totalQuantity')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('status')}
                data-testid="button-sort-status"
              >
                {t('table.status')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSort?.('dueDate')}
                data-testid="button-sort-due-date"
              >
                {t('table.dueDate')}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                {t('claims.noResults')}
              </TableCell>
            </TableRow>
          ) : (
            claims.map((claim) => (
              <TableRow key={claim.id} className="hover-elevate" data-testid={`row-claim-${claim.id}`}>
                <TableCell className="font-mono font-medium" data-testid="text-tcar-no">
                  {claim.tcarNo}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" data-testid="text-customer-defect-id">
                  {claim.customerDefectId || '-'}
                </TableCell>
                <TableCell data-testid="text-customer-name">{claim.customerName}</TableCell>
                <TableCell className="max-w-xs truncate" data-testid="text-defect-name">
                  {claim.defectName}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground" data-testid="text-part-number">
                  {claim.partNumber || '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-center" data-testid="text-total-quantity">
                  {claim.totalQuantity ?? '-'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={claim.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" data-testid="text-due-date">
                  {claim.dueDate || '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewClaim?.(claim.id)}
                    data-testid={`button-view-${claim.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
