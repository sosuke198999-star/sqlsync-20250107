export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  LOW: { label: "低", color: "bg-priority-low" },
  MEDIUM: { label: "中", color: "bg-priority-medium" },
  HIGH: { label: "高", color: "bg-priority-high" },
  CRITICAL: { label: "緊急", color: "bg-priority-critical" },
};

export default function PriorityIndicator({ priority, showLabel = true }: PriorityIndicatorProps) {
  const config = priorityConfig[priority];
  
  return (
    <div className="flex items-center gap-2" data-testid={`priority-${priority.toLowerCase()}`}>
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
