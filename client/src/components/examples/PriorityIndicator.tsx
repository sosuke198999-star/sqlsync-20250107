import PriorityIndicator from '../PriorityIndicator';

export default function PriorityIndicatorExample() {
  return (
    <div className="flex flex-col gap-3">
      <PriorityIndicator priority="CRITICAL" />
      <PriorityIndicator priority="HIGH" />
      <PriorityIndicator priority="MEDIUM" />
      <PriorityIndicator priority="LOW" />
    </div>
  );
}
