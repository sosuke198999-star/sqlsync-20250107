import ClaimsTable, { type ClaimRow } from '../ClaimsTable';

const mockClaims: ClaimRow[] = [
  {
    id: '1',
    tcarNo: '202501-0012',
    customerDefectId: 'DEF-2025-001',
    customerName: 'トヨタ自動車株式会社',
    partNumber: 'P-12345-A',
    dc: 'DC-001',
    defectName: 'エンジンから異音が発生。アイドリング時に特に顕著。',
    defectCount: 3,
    occurrenceDate: '2025-01-05',
    status: 'NEW',
    dueDate: '2025-01-20',
    assignee: '技術部 田中',
  },
  {
    id: '2',
    tcarNo: '202501-0034',
    customerName: '日産自動車株式会社',
    defectName: 'ブレーキパッドの早期摩耗が報告されました。',
    defectCount: 5,
    status: 'WAITING_TECH',
    dueDate: '2025-01-25',
    assignee: '技術部 佐藤',
  },
  {
    id: '3',
    tcarNo: '202412-0056',
    customerName: 'ホンダ技研工業株式会社',
    defectName: '塗装面に色ムラが発生。品質基準を満たしていない。',
    defectCount: 2,
    status: 'TECH_REVIEW',
    dueDate: '2025-01-15',
    assignee: '工場 鈴木',
  },
  {
    id: '4',
    tcarNo: '202412-0078',
    customerName: 'マツダ株式会社',
    defectName: 'シート組み付け不良により隙間が発生。',
    status: 'COMPLETED',
    dueDate: '2024-12-28',
    assignee: '工場 高橋',
  },
];

export default function ClaimsTableExample() {
  return (
    <ClaimsTable
      claims={mockClaims}
      onViewClaim={(id) => console.log('View claim:', id)}
      onSort={(column) => console.log('Sort by:', column)}
    />
  );
}
