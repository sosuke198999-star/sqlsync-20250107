import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { ClaimStatus } from "@shared/schema";

export type { ClaimStatus };

interface StatusBadgeProps {
  status: ClaimStatus;
}

const statusConfig: Record<ClaimStatus, { translationKey: string; className: string }> = {
  PENDING_ACCEPTANCE: { translationKey: "status.PENDING_ACCEPTANCE", className: "bg-status-new text-white" },
  PENDING_COUNTERMEASURE: { translationKey: "status.PENDING_COUNTERMEASURE", className: "bg-status-waitingTech text-white" },
  COMPLETED: { translationKey: "status.COMPLETED", className: "bg-status-completed text-white" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  
  return (
    <Badge 
      className={`${config.className} text-xs font-medium px-3 py-1`}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {t(config.translationKey)}
    </Badge>
  );
}
