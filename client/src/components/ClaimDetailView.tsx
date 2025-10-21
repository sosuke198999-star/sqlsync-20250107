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
{