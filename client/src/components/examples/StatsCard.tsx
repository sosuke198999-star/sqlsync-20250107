import StatsCard from '../StatsCard';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="総クレーム数" value="147" icon={FileText} />
      <StatsCard title="対応中" value="23" icon={Clock} iconColor="text-status-waitingTech" />
      <StatsCard title="完了" value="98" icon={CheckCircle2} iconColor="text-status-completed" />
      <StatsCard title="期限超過" value="5" icon={AlertCircle} iconColor="text-destructive" />
    </div>
  );
}
