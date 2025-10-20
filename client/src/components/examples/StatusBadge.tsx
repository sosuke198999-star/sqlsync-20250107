import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="NEW" />
      <StatusBadge status="WAITING_TECH" />
      <StatusBadge status="REQUESTED_FACTORY" />
      <StatusBadge status="WAITING_FACTORY_REPORT" />
      <StatusBadge status="TECH_REVIEW" />
      <StatusBadge status="FACTORY_REWORK" />
      <StatusBadge status="COMPLETED" />
    </div>
  );
}
