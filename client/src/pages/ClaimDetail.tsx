import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ClaimDetailView, { type ClaimDetail } from "@/components/ClaimDetailView";
import { type ClaimStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Claim } from "@shared/schema";

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
    customerName: claim.customerName,
    partNumber: claim.partNumber ?? undefined,
    dc: firstDc,
    defectName: claim.defectName,
    defectCount: claim.defectCount ?? undefined,
    occurrenceDate: claim.occurrenceDate ?? undefined,
    status: claim.status as ClaimStatus,
    receivedDate: claim.receivedDate,
    dueDate: claim.dueDate ?? undefined,
    remarks: claim.remarks ?? undefined,
    createdBy: claim.createdBy ?? undefined,
    assigneeTech: claim.assigneeTech ?? undefined,
    assigneeFactory: claim.assigneeFactory ?? undefined,
    correctiveAction: claim.correctiveAction ?? undefined,
    preventiveAction: claim.preventiveAction ?? undefined,
    createdAt,
  };
}

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: claim, isLoading, isError } = useQuery<Claim>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: ClaimStatus) => {
      await apiRequest("PATCH", `/api/claims/${id}`, { status: newStatus });
    },
    onSuccess: (_data, newStatus) => {
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({
        title: t("detail.statusUpdate"),
        description: `New status: ${t(`status.${newStatus}`)}`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Failed to update status",
        description: message,
        variant: "destructive",
      });
    },
  });

  const actionsMutation = useMutation({
    mutationFn: async ({ corrective, preventive }: { corrective: string; preventive: string }) => {
      await apiRequest("PATCH", `/api/claims/${id}`, {
        correctiveAction: corrective,
        preventiveAction: preventive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({
        title: t("detail.save"),
        description: "Corrective / preventive actions saved",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Failed to save actions",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
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

      <ClaimDetailView
        claim={mappedClaim}
        onUpdateStatus={(newStatus) => statusMutation.mutate(newStatus)}
        onSaveActions={(corrective, preventive) => actionsMutation.mutate({ corrective, preventive })}
      />
    </div>
  );
}
