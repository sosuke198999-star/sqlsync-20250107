import ClaimDetailView, { type ClaimDetail } from '../ClaimDetailView';

const mockClaim: ClaimDetail = {
  id: '1',
  tcarNo: '202501-0012',
  customerDefectId: 'DEF-2025-001',
  customerName: 'トヨタ自動車株式会社',
  partNumber: 'P-12345-A',
  dc: 'DC-001',
  defectName: 'エンジンから異音が発生しています。',
  defectCount: 3,
  occurrenceDate: '2025-01-05',
  status: 'TECH_REVIEW',
  receivedDate: '2025-01-10',
  dueDate: '2025-01-20',
  remarks: '特にアイドリング時に顕著で、回転数が800rpm付近で「カタカタ」という金属音が聞こえます。',
  createdBy: '営業部 山田太郎',
  assigneeTech: '技術部 田中次郎',
  assigneeFactory: '工場 鈴木一郎',
  correctiveAction: 'エンジンマウントの締め付けトルクを再確認し、規定値に調整しました。',
  preventiveAction: '組み立て工程でのトルク管理チェックシートを新たに導入し、作業者への教育を実施予定です。',
  createdAt: '2025-01-10T09:30:00Z',
};

export default function ClaimDetailViewExample() {
  return (
    <ClaimDetailView
      claim={mockClaim}
      onUpdateStatus={(status) => console.log('Update status to:', status)}
      onSaveActions={(corrective, preventive) => console.log('Save actions:', { corrective, preventive })}
    />
  );
}
