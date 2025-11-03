import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import StatusBadge, { type ClaimStatus } from "./StatusBadge";
import { Calendar, User, Building2, FileText, Clock, CheckCircle2, Package, Hash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface ClaimDetail {
  id: string;
  tcarNo: string;
  customerDefectId?: string;
  customerName: string;
  partNumber?: string;
  dc?: string;
  defectName: string;
  defectCount?: number;
  occurrenceDate?: string;
  status: ClaimStatus;
  receivedDate: string;
  dueDate?: string;
  remarks?: string;
  createdBy?: string;
  assigneeTech?: string;
  assigneeFactory?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  createdAt: string;
}

interface ClaimDetailViewProps {
  claim: ClaimDetail;
  onUpdateStatus?: (newStatus: ClaimStatus) => void;
  onSaveActions?: (corrective: string, preventive: string) => void;
}

export default function ClaimDetailView({ claim, onUpdateStatus, onSaveActions }: ClaimDetailViewProps) {
  const { t } = useTranslation();
  const [correctiveAction, setCorrectiveAction] = useState(claim.correctiveAction || '');
  const [preventiveAction, setPreventiveAction] = useState(claim.preventiveAction || '');

  const handleSave = () => {
    onSaveActions?.(correctiveAction, preventiveAction);
    console.log('Saved actions:', { correctiveAction, preventiveAction });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold" data-testid="text-tcar-no">
              {claim.tcarNo}
            </CardTitle>
            {claim.customerDefectId && (
              <div className="text-sm text-muted-foreground">
                {t('table.customerDefectId')}: {claim.customerDefectId}
              </div>
            )}
            <div className="flex items-center gap-3">
              <StatusBadge status={claim.status} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{t('detail.createdAt')}: {new Date(claim.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {t('table.customerName')}
                </div>
                <div className="font-medium" data-testid="text-customer-name">{claim.customerName}</div>
              </div>

              {claim.partNumber && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {t('table.partNumber')}
                  </div>
                  <div className="font-medium" data-testid="text-part-number">{claim.partNumber}</div>
                </div>
              )}

              {claim.dc && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {t('table.dc')}
                  </div>
                  <div className="font-medium" data-testid="text-dc">{claim.dc}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('detail.receivedDate')}
                </div>
                <div className="font-medium" data-testid="text-received-date">{claim.receivedDate}</div>
              </div>

              {claim.dueDate && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('table.dueDate')}
                  </div>
                  <div className="font-medium" data-testid="text-due-date">{claim.dueDate}</div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {claim.defectCount !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {t('table.defectCount')}
                  </div>
                  <div className="font-medium" data-testid="text-defect-count">{claim.defectCount}</div>
                </div>
              )}

              {claim.occurrenceDate && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('table.occurrenceDate')}
                  </div>
                  <div className="font-medium" data-testid="text-occurrence-date">{claim.occurrenceDate}</div>
                </div>
              )}

              {claim.createdBy && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('detail.createdBy')}
                  </div>
                  <div className="font-medium" data-testid="text-created-by">{claim.createdBy}</div>
                </div>
              )}

              {claim.assigneeTech && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('detail.techAssignee')}
                  </div>
                  <div className="font-medium" data-testid="text-assignee-tech">{claim.assigneeTech}</div>
                </div>
              )}

              {claim.assigneeFactory && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('detail.factoryAssignee')}
                  </div>
                  <div className="font-medium" data-testid="text-assignee-factory">{claim.assigneeFactory}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {t('table.defectName')}
            </div>
            <div className="text-sm leading-relaxed" data-testid="text-defect-name">
              {claim.defectName}
            </div>
          </div>

          {claim.remarks && (
            <>
              <Separator />
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {t('table.remarks')}
                </div>
                <div className="text-sm leading-relaxed" data-testid="text-remarks">
                  {claim.remarks}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            是正処置・予防処置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="corrective-action">{t('detail.correctiveAction')}</Label>
            <Textarea
              id="corrective-action"
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder={t('detail.correctivePlaceholder')}
              className="min-h-24"
              data-testid="input-corrective-action"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preventive-action">{t('detail.preventiveAction')}</Label>
            <Textarea
              id="preventive-action"
              value={preventiveAction}
              onChange={(e) => setPreventiveAction(e.target.value)}
              placeholder={t('detail.preventivePlaceholder')}
              className="min-h-24"
              data-testid="input-preventive-action"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} data-testid="button-save-actions">
              {t('detail.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.statusUpdate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus?.('WAITING_TECH')}
              data-testid="button-status-waiting-tech"
            >
              {t('action.waitingTech')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus?.('REQUESTED_FACTORY')}
              data-testid="button-status-requested-factory"
            >
              {t('action.requestFactory')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus?.('WAITING_FACTORY_REPORT')}
              data-testid="button-status-waiting-report"
            >
              {t('action.waitingReport')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus?.('TECH_REVIEW')}
              data-testid="button-status-tech-review"
            >
              {t('action.techReview')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus?.('FACTORY_REWORK')}
              data-testid="button-status-rework"
            >
              {t('action.rework')}
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdateStatus?.('COMPLETED')}
              className="bg-status-completed"
              data-testid="button-status-completed"
            >
              {t('action.complete')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
