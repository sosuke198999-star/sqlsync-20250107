import { useState } from "react";
import ClaimsTable, { type ClaimRow } from "@/components/ClaimsTable";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function ClaimsList() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const allClaims: ClaimRow[] = [
    {
      id: '1',
      tcarNo: '202501-0012',
      customerDefectId: 'DEF-2025-001',
      customerName: 'トヨタ自動車株式会社',
      partNumber: 'P-12345-A',
      dc: 'DC-001',
      defectName: 'エンジンから異音が発生。アイドリング時に特に顕著、E,
      defectCount: 3,
      occurrenceDate: '2025-01-05',
      status: 'PENDING_ACCEPTANCE',
      dueDate: '2025-01-20',
      assignee: '技術部 田中',
    },
    {
      id: '2',
      tcarNo: '202501-0034',
      customerName: '日産自動車株式会社',
      defectName: 'ブレーキパッド�E早期摩耗が報告されました、E,
      defectCount: 5,
      status: 'PENDING_COUNTERMEASURE',
      dueDate: '2025-01-25',
      assignee: '技術部 佐藤',
    },
    {
      id: '3',
      tcarNo: '202412-0056',
      customerName: 'ホンダ技研工業株式会社',
      defectName: '塗裁E��に色ムラが発生。品質基準を満たしてぁE��ぁE��E,
      defectCount: 2,
      status: 'PENDING_COUNTERMEASURE',
      dueDate: '2025-01-15',
      assignee: '工場 鈴木',
    },
    {
      id: '4',
      tcarNo: '202412-0078',
      customerName: 'マツダ株式会社',
      defectName: 'シート絁E��付け不良により隙間が発生、E,
      status: 'COMPLETED',
      dueDate: '2024-12-28',
      assignee: '工場 高橁E,
    },
    {
      id: '5',
      tcarNo: '202501-0090',
      customerName: 'スバル株式会社',
      defectName: 'ドアパネルの塗裁E��がれが確認されました、E,
      status: 'PENDING_COUNTERMEASURE',
      dueDate: '2025-01-22',
      assignee: '技術部 伊藤',
    },
  ];

  const filteredClaims = allClaims.filter((claim) => {
    const matchesSearch = 
      claim.tcarNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.defectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('claims.title')}</h1>
          <p className="text-muted-foreground">{t('claims.subtitle', { count: filteredClaims.length })}</p>
        </div>
        <Link href="/claims/new">
          <Button data-testid="button-new-claim">
            <Plus className="h-4 w-4 mr-2" />
            {t('claims.newClaim')}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <FilterBar
          onStatusChange={setStatusFilter}
        />
      </div>

      <ClaimsTable
        claims={filteredClaims}
        onViewClaim={(id) => {
          const claim = filteredClaims.find(c => c.id === id);
          if (!claim) return;
          
          if (claim.status === 'PENDING_ACCEPTANCE') {
            setLocation(`/claims/acceptance/${id}`);
          } else if (claim.status === 'PENDING_COUNTERMEASURE') {
            setLocation(`/claims/countermeasure/${id}`);
          } else {
            setLocation(`/claims/${id}`);
          }
        }}
        onSort={(column) => console.log('Sort by:', column)}
      />
    </div>
  );
}
