import ClaimCard from '../ClaimCard';

export default function ClaimCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      <ClaimCard
        tcarNo="202501-0012"
        customerDefectId="DEF-2025-001"
        customerName="トヨタ自動車株式会社"
        defectName="エンジンから異音が発生。アイドリング時に特に顕著。"
        partNumber="P-12345-A"
        defectCount={3}
        status="NEW"
        dueDate="2025-01-20"
        assignee="技術部 田中"
        onClick={() => console.log('View claim details')}
      />
      <ClaimCard
        tcarNo="202501-0034"
        customerName="日産自動車株式会社"
        defectName="ブレーキパッドの早期摩耗が報告されました。"
        defectCount={5}
        status="WAITING_TECH"
        dueDate="2025-01-25"
        assignee="技術部 佐藤"
        onClick={() => console.log('View claim details')}
      />
      <ClaimCard
        tcarNo="202412-0056"
        customerName="ホンダ技研工業株式会社"
        defectName="塗装面に色ムラが発生。品質基準を満たしていない。"
        defectCount={2}
        status="TECH_REVIEW"
        dueDate="2025-01-15"
        assignee="工場 鈴木"
        onClick={() => console.log('View claim details')}
      />
    </div>
  );
}
