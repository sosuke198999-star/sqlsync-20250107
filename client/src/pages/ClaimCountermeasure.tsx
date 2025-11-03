import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Claim } from "@shared/schema";
import FileUpload from "@/components/FileUpload";

export default function ClaimCountermeasure() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState("");

  const { data: claim, isLoading, isError } = useQuery<Claim>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/claims/${id}`, {
        remarks: comment,
        status: 'PENDING_COUNTERMEASURE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({
        title: t('countermeasure.submitSuccess'),
      });
      setLocation('/claims');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!id) return;
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/claims/${id}/upload-document`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      if (!res.ok) {
        const msg = (await res.text()) || res.statusText;
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({ title: t('countermeasure.uploadDocument') + ' OK' });
    },
    onError: (err: any) => {
      toast({
        title: 'アップロードに失敗しました',
        description: String(err?.message || err),
        variant: 'destructive',
      });
    },
  });

  // Early returns must come after all hooks to keep hook order stable
  if (!id) {
    setLocation('/claims');
    return null;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">読み込み中...</div>;
  }

  if (isError || !claim) {
    return <div className="flex items-center justify-center h-96">クレームが見つかりません</div>;
  }

  const handleSubmit = () => {
    if (!id) return;
    if (!comment) {
      toast({
        title: "エラー",
        description: "コメントを入力してください",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/claims">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            {t('countermeasure.title')}
          </h1>
          <p className="text-muted-foreground">{t('countermeasure.subtitle')}</p>
        </div>
        <StatusBadge status={claim.status as any} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('countermeasure.claimInfo')}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={() => setLocation(`/claims/${id}`)}
            title="詳細を見る"
            data-testid="button-view-detail"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('table.tcarNo')}</Label>
              <p className="font-medium" data-testid="text-tcar-no">{claim.tcarNo}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.customerDefectId')}</Label>
              <p className="font-medium" data-testid="text-customer-defect-id">
                {claim.customerDefectId || '-'}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('countermeasure.uploadDocument')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claim.driveFileUrl ? (
            <div className="text-sm">
              <Label className="text-muted-foreground">アップロード済み</Label>
              <div>
                <a
                  href={claim.driveFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                  data-testid="link-drive-file"
                >
                  Google Drive を開く
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t('countermeasure.uploadPlaceholder')}</Label>
              <FileUpload onFileAdd={(file) => uploadMutation.mutate(file)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('table.remarks')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="countermeasure-comment">{t('table.remarks')}</Label>
            <Textarea
              id="countermeasure-comment"
              placeholder="コメントを入力してください"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-32"
              data-testid="textarea-comment"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/claims">
          <Button variant="outline" data-testid="button-cancel">
            {t('newClaim.cancel')}
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !comment}
          data-testid="button-submit"
        >
          {submitMutation.isPending ? '登録中...' : t('countermeasure.submit')}
        </Button>
      </div>
    </div>
  );
}
