import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="PENDING_ACCEPTANCE" />
      <StatusBadge status="PENDING_COUNTERMEASURE" />
      <StatusBadge status="COMPLETED" />
    </div>
  );
}
