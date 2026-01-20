import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Claim } from "@shared/schema";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/lib/auth";

export default function ClaimCountermeasure() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [comment, setComment] = useState("");

  const { data: claim, isLoading, isError } = useQuery<Claim>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
  });
  const { data: uploadLimits } = useQuery<{ maxUploadMb: number }>({
    queryKey: ['/api/upload-limits'],
  });

  useEffect(() => {
    if (claim?.remarks) {
      setComment(claim.remarks);
    }
  }, [claim]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Claim> = {};
      if (comment) {
        payload.remarks = comment;
      }

      const nextStatus = claim!.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING_APPROVAL';
      payload.status = nextStatus;

      await apiRequest('PATCH', `/api/claims/${id}`, payload);
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
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/claims/${id}`, undefined, {
        headers: {
          "x-user-name": user?.name ?? "",
          "x-user-role": user?.role ?? "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({
        title: t("detail.deleteSuccessTitle"),
        description: t("detail.deleteSuccessDesc"),
      });
      setLocation("/claims");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: t("detail.deleteFailedTitle"),
        description: message,
        variant: "destructive",
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

  const canDelete =
    !!user &&
    (user.role === "admin" ||
      (claim.createdBy && user.name === claim.createdBy) ||
      (!claim.createdBy && claim.assignee && user.name === claim.assignee));

  const handleSubmit = () => {
    if (!id) return;
    if (!comment && !claim.driveFileUrl) {
      toast({
        title: "エラー",
        description: "ファイルをアップロードするか、コメントを入力してください",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/claims">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
              {t('countermeasure.title')}
            </h1>
            <p className="text-muted-foreground">{t('countermeasure.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={claim.status as any} />
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  data-testid="button-delete-claim"
                  disabled={deleteMutation.isPending}
                >
                  {t("detail.delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("detail.deleteConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("detail.deleteConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-delete-cancel">
                    {t("newClaim.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      data-testid="button-delete-confirm"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {t("detail.deleteConfirmAction")}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
              <FileUpload
                onFileAdd={(file) => uploadMutation.mutate(file)}
                maxSizeMb={uploadLimits?.maxUploadMb}
              />
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
              disabled={!!claim.remarks}
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
          disabled={submitMutation.isPending || uploadMutation.isPending || (!comment && !claim.driveFileUrl)}
          data-testid="button-submit"
        >
          {uploadMutation.isPending ? 'アップロード中...' : (submitMutation.isPending ? '登録中...' : t('countermeasure.submit'))}
        </Button>
      </div>
    </div>
  );
}
