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
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (claim) {
      setDefectCode((claim as any).defectCode || "");
      setCorrectiveAction(claim.correctiveAction || "");
      setPreventiveAction(claim.preventiveAction || "");
      setRemarks(claim.remarks || "");
    }
  }, [claim]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await apiRequest("PATCH", `/api/claims/${id}`, {
        defectCode: defectCode || undefined,
        correctiveAction: correctiveAction || undefined,
        preventiveAction: preventiveAction || undefined,
        remarks,
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

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>{t('approvals.updateClaim')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">TCAR</Label>
              <div className="font-medium">{claim.tcarNo}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.customerName')}</Label>
              <div className="font-medium">{claim.customerName}</div>
            </div>
          </div>

          <div>
            <Label htmlFor="defect-code">{t('table.defectCode')}</Label>
            <Input id="defect-code" value={defectCode} onChange={(e) => setDefectCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="corrective-action">{t('detail.correctiveAction')}</Label>
            <Textarea
              id="corrective-action"
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              className="min-h-24"
            />
          </div>
          <div>
            <Label htmlFor="preventive-action">{t('detail.preventiveAction')}</Label>
            <Textarea
              id="preventive-action"
              value={preventiveAction}
              onChange={(e) => setPreventiveAction(e.target.value)}
              className="min-h-24"
            />
          </div>
          <div>
            <Label htmlFor="remarks">{t('table.remarks')}</Label>
            <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {t('detail.save')}
            </Button>
          </div>
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
        <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
          {t('approvals.approve')}
        </Button>
      </div>
    </div>
  );
}

