import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Claim } from "@shared/schema";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TechnicalApproval() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claim, isLoading, isError } = useQuery<Claim>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
  });

  const [defectCode, setDefectCode] = useState("");
  const [occurrenceProcess, setOccurrenceProcess] = useState("");
  const [occurrenceAction, setOccurrenceAction] = useState("");
  const [countermeasureDc, setCountermeasureDc] = useState("");
  const [defectCodeOptions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("defectCodeList");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [occurrenceProcessOptions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("occurrenceProcessList");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (claim) {
      setDefectCode(claim.defectCode || "");
      setOccurrenceProcess(claim.correctiveAction || "");
      setOccurrenceAction(claim.preventiveAction || "");
      setCountermeasureDc(claim.countermeasureDc || "");
    }
  }, [claim]);

  const resolvedDefectCodeOptions =
    defectCode && !defectCodeOptions.includes(defectCode)
      ? [...defectCodeOptions, defectCode]
      : defectCodeOptions;
  const resolvedOccurrenceProcessOptions =
    occurrenceProcess && !occurrenceProcessOptions.includes(occurrenceProcess)
      ? [...occurrenceProcessOptions, occurrenceProcess]
      : occurrenceProcessOptions;

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await apiRequest("PATCH", `/api/claims/${id}`, {
        defectCode: defectCode.trim(),
        correctiveAction: occurrenceProcess || undefined,
        preventiveAction: occurrenceAction || undefined,
        countermeasureDc: countermeasureDc || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({ title: t('approvals.updateSaved') });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await apiRequest("PATCH", `/api/claims/${id}`, {
        defectCode: defectCode.trim(),
        correctiveAction: occurrenceProcess || undefined,
        preventiveAction: occurrenceAction || undefined,
        countermeasureDc: countermeasureDc || undefined,
        status: "COMPLETED",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({ title: t('approvals.approved') });
      setLocation('/approvals');
    },
  });

  if (!id) {
    setLocation('/approvals');
    return null;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }
  if (isError || !claim) {
    return <div className="flex items-center justify-center h-96">Not found</div>;
  }

  const ensureDefectCode = () => {
    if (resolvedDefectCodeOptions.length === 0) {
      toast({ title: t('approvals.noDefectCodeOptions'), variant: "destructive" });
      return false;
    }
    if (!defectCode.trim()) {
      toast({ title: t('approvals.defectCodeRequired'), variant: "destructive" });
      return false;
    }
    return true;
  };

  const ensureOccurrenceProcess = () => {
    if (resolvedOccurrenceProcessOptions.length === 0) {
      toast({ title: t('approvals.noOccurrenceProcessOptions'), variant: "destructive" });
      return false;
    }
    if (!occurrenceProcess.trim()) {
      toast({ title: t('approvals.occurrenceProcessRequired'), variant: "destructive" });
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/approvals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('approvals.title')}</h1>
            <p className="text-muted-foreground">{t('approvals.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={claim.status as any} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('countermeasure.claimInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('table.tcarNo')}</Label>
              <p className="font-medium" data-testid="text-tcar-no">{claim.tcarNo}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('detail.createdAt')}</Label>
              <p className="font-medium" data-testid="text-created-at">
                {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('ja-JP') : '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.customerDefectId')}</Label>
              <p className="font-medium" data-testid="text-customer-defect-id">
                {claim.customerDefectId || '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('detail.receivedDate')}</Label>
              <p className="font-medium" data-testid="text-received-date">
                {claim.receivedDate || '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.customerName')}</Label>
              <p className="font-medium" data-testid="text-customer-name">{claim.customerName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.partNumber')}</Label>
              <p className="font-medium" data-testid="text-part-number">{claim.partNumber || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.dc')}</Label>
              {claim.dcItems && claim.dcItems.length > 0 ? (
                <div className="font-medium flex flex-wrap gap-2" data-testid="text-dc">
                  {claim.dcItems.map((item, index) => (
                    <span key={`${item.dc}-${index}`}>
                      {item.dc}: {item.quantity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium" data-testid="text-dc">-</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.defectCount')}</Label>
              <p className="font-medium" data-testid="text-defect-count">
                {claim.defectCount ?? (claim.dcItems?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) || '-')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.occurrenceDate')}</Label>
              <p className="font-medium" data-testid="text-occurrence-date">
                {claim.occurrenceDate || '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('detail.techAssignee')}</Label>
              <p className="font-medium" data-testid="text-tech-assignee">{claim.assigneeTech || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('detail.factoryAssignee')}</Label>
              <p className="font-medium" data-testid="text-factory-assignee">
                {claim.assigneeFactory || '-'}
              </p>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('table.defectName')}</Label>
            <p className="font-medium" data-testid="text-defect-name">{claim.defectName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('table.remarks')}</Label>
            <p className="font-medium" data-testid="text-remarks">{claim.remarks || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('approvals.updateClaim')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defect-code">{t('table.defectCode')}</Label>
            <Select
              value={defectCode}
              onValueChange={setDefectCode}
              disabled={resolvedDefectCodeOptions.length === 0}
            >
              <SelectTrigger id="defect-code" data-testid="select-defect-code">
                <SelectValue placeholder={t('approvals.selectDefectCode')} />
              </SelectTrigger>
              <SelectContent>
                {resolvedDefectCodeOptions.length === 0 ? (
                  <SelectItem value="__no-defect-code" disabled>
                    {t('approvals.noDefectCodeOptions')}
                  </SelectItem>
                ) : (
                  resolvedDefectCodeOptions.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="occurrence-process">{t('approvals.occurrenceProcess')}</Label>
            <Select
              value={occurrenceProcess}
              onValueChange={setOccurrenceProcess}
              disabled={resolvedOccurrenceProcessOptions.length === 0}
            >
              <SelectTrigger id="occurrence-process" data-testid="select-occurrence-process">
                <SelectValue placeholder={t('approvals.selectOccurrenceProcess')} />
              </SelectTrigger>
              <SelectContent>
                {resolvedOccurrenceProcessOptions.length === 0 ? (
                  <SelectItem value="__no-occurrence-process" disabled>
                    {t('approvals.noOccurrenceProcessOptions')}
                  </SelectItem>
                ) : (
                  resolvedOccurrenceProcessOptions.map((process) => (
                    <SelectItem key={process} value={process}>
                      {process}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="occurrence-action">{t('approvals.occurrenceAction')}</Label>
            <Textarea
              id="occurrence-action"
              value={occurrenceAction}
              onChange={(e) => setOccurrenceAction(e.target.value)}
              className="min-h-24"
            />
          </div>
          <div>
            <Label htmlFor="countermeasure-dc">{t('approvals.countermeasureDc')}</Label>
            <Input
              id="countermeasure-dc"
              value={countermeasureDc}
              onChange={(e) => setCountermeasureDc(e.target.value)}
              data-testid="input-countermeasure-dc"
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (!ensureDefectCode()) return;
                if (!ensureOccurrenceProcess()) return;
                updateMutation.mutate();
              }}
              disabled={updateMutation.isPending}
            >
              {t('detail.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('newClaim.attachments')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {claim.attachments && claim.attachments.length > 0 ? (
            <ul className="space-y-2">
              {claim.attachments.map((attachment, index) => (
                <li key={`${attachment.fileId}-${index}`} className="text-sm">
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {attachment.fileName || attachment.fileId}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('approvals.file')}</CardTitle>
        </CardHeader>
        <CardContent>
          {claim.driveFileUrl ? (
            <a className="text-primary underline" href={claim.driveFileUrl} target="_blank" rel="noreferrer">
              {t('common.view')}
            </a>
          ) : (
            <div className="text-muted-foreground">{t('approvals.noFile')}</div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            // Request changes: move back to pending countermeasure (no schema change needed)
            apiRequest('PATCH', `/api/claims/${id}`, { status: 'PENDING_COUNTERMEASURE' })
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
                queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
                toast({ title: t('approvals.requestedChanges') });
              });
          }}
        >
          {t('approvals.requestChanges')}
        </Button>
        <Button
          onClick={() => {
            if (!ensureDefectCode()) return;
            if (!ensureOccurrenceProcess()) return;
            approveMutation.mutate();
          }}
          disabled={approveMutation.isPending}
        >
          {t('approvals.approve')}
        </Button>
      </div>
    </div>
  );
}

