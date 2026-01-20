import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ClaimDetailView, { type ClaimDetail } from "@/components/ClaimDetailView";
import { type ClaimStatus } from "@/components/StatusBadge";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Claim } from "@shared/schema";
import { useAuth } from "@/lib/auth";

function toClaimDetail(claim: Claim): ClaimDetail {
  const firstDc = Array.isArray((claim as any).dcItems) && claim.dcItems.length > 0
    ? claim.dcItems[0].dc
    : undefined;

  const createdAt =
    claim.createdAt instanceof Date
      ? claim.createdAt.toISOString()
      : typeof claim.createdAt === "string"
        ? claim.createdAt
        : new Date().toISOString();

  return {
    id: claim.id,
    tcarNo: claim.tcarNo,
    customerDefectId: claim.customerDefectId ?? undefined,
    defectCode: claim.defectCode ?? undefined,
    customerName: claim.customerName,
    partNumber: claim.partNumber ?? undefined,
    dc: firstDc,
    dcItems: claim.dcItems ?? undefined,
    defectName: claim.defectName,
    defectCount: claim.defectCount ?? undefined,
    occurrenceDate: claim.occurrenceDate ?? undefined,
    status: claim.status as ClaimStatus,
    receivedDate: claim.receivedDate,
    dueDate: claim.dueDate ?? undefined,
    remarks: claim.remarks ?? undefined,
    assignee: claim.assignee ?? undefined,
    createdBy: claim.createdBy ?? undefined,
    assigneeTech: claim.assigneeTech ?? undefined,
    assigneeFactory: claim.assigneeFactory ?? undefined,
    occurrenceProcess: claim.correctiveAction ?? undefined,
    occurrenceAction: claim.preventiveAction ?? undefined,
    countermeasureDc: claim.countermeasureDc ?? undefined,
    driveFileUrl: claim.driveFileUrl ?? undefined,
    attachments: claim.attachments ?? undefined,
    createdAt,
  };
}

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: claim, isLoading, isError } = useQuery<Claim>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
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
        title: t("notifications.error"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const detailUpdateMutation = useMutation({
    mutationFn: async (payload: {
      customerDefectId: string;
      customerName: string;
      partNumber: string;
      defectName: string;
      defectCount: string;
      occurrenceDate: string;
      receivedDate: string;
      dueDate: string;
      assignee: string;
      defectCode: string;
      dcItems: Claim["dcItems"];
      occurrenceProcess: string;
      occurrenceAction: string;
      countermeasureDc: string;
      remarks: string;
    }) => {
      const parsedDefectCount = payload.defectCount.trim()
        ? Number.parseInt(payload.defectCount, 10)
        : undefined;
      await apiRequest("PATCH", `/api/claims/${id}`, {
        customerDefectId: payload.customerDefectId.trim() || undefined,
        customerName: payload.customerName.trim() || undefined,
        partNumber: payload.partNumber.trim() || undefined,
        defectName: payload.defectName.trim() || undefined,
        defectCount: Number.isNaN(parsedDefectCount) ? undefined : parsedDefectCount,
        occurrenceDate: payload.occurrenceDate.trim() || undefined,
        receivedDate: payload.receivedDate.trim() || undefined,
        dueDate: payload.dueDate.trim() || undefined,
        assignee: payload.assignee.trim() || undefined,
        defectCode: payload.defectCode.trim() || undefined,
        dcItems: payload.dcItems,
        correctiveAction: payload.occurrenceProcess || undefined,
        preventiveAction: payload.occurrenceAction || undefined,
        countermeasureDc: payload.countermeasureDc || undefined,
        remarks: payload.remarks || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({
        title: t("detail.save"),
        description: t("approvals.updateSaved"),
      });
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
  if (!id) {
    setLocation("/claims");
    return null;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">読み込み中...</div>;
  }

  if (isError || !claim) {
    return <div className="flex items-center justify-center h-96">クレームが見つかりません</div>;
  }

  const mappedClaim = toClaimDetail(claim);
  const canDelete =
    !!user &&
    (user.role === "admin" ||
      (claim.createdBy && user.name === claim.createdBy) ||
      (!claim.createdBy && claim.assignee && user.name === claim.assignee));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/claims">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
              {t("detail.title")}
            </h1>
            <p className="text-muted-foreground">{t("detail.subtitle")}</p>
          </div>
        </div>
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

      <ClaimDetailView
        claim={mappedClaim}
        onSaveDetails={(payload) => detailUpdateMutation.mutate(payload)}
        isSaving={detailUpdateMutation.isPending}
        canEdit={user?.role === "admin"}
      />
    </div>
  );
}
