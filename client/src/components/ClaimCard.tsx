import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge, { type ClaimStatus } from "./StatusBadge";
import { Calendar, User, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ClaimCardProps {
  tcarNo: string;
  customerDefectId?: string | null;
  customerName: string;
  defectName: string;
  partNumber?: string | null;
  defectCount?: number | null;
  status: ClaimStatus;
  dueDate?: string | null;
  assignee?: string | null;
  onClick?: () => void;
}

export default function ClaimCard({
  tcarNo,
  customerDefectId,
  customerName,
  defectName,
  partNumber,
  defectCount,
  status,
  dueDate,
  assignee,
  onClick,
}: ClaimCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover-elevate" data-testid={`card-claim-${tcarNo}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-foreground mb-1" data-testid="text-tcar-no">
            {tcarNo}
          </div>
          <div className="text-sm text-muted-foreground" data-testid="text-customer-name">
            {customerName}
          </div>
          {customerDefectId && (
            <div className="text-xs text-muted-foreground mt-1">
              ID: {customerDefectId}
            </div>
          )}
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{t('table.defectName')}</div>
          <div className="text-sm line-clamp-2" data-testid="text-defect-name">{defectName}</div>
        </div>
        
        {partNumber && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-3 w-3" />
            <span data-testid="text-part-number">{partNumber}</span>
            {defectCount && <span className="ml-2">({defectCount}件)</span>}
          </div>
        )}
        
        <div className="flex items-center justify-between gap-4">
          {assignee && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span data-testid="text-assignee">{assignee}</span>
            </div>
          )}
          {dueDate && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span data-testid="text-due-date">{dueDate}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-end gap-2 pt-3">
        <Button 
          size="sm" 
          variant="outline"
          onClick={onClick}
          data-testid="button-view-detail"
        >
          {t('common.view')}
        </Button>
      </CardFooter>
    </Card>
  );
}