import StatsCard from "@/components/StatsCard";
import ClaimCard from "@/components/ClaimCard";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Claim } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { type ClaimStatus } from "@/components/StatusBadge";

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: claims, isLoading } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const incompleteClaims = claims?.filter(claim => claim.status !== 'COMPLETED') || [];

  const thisMonthClaims = incompleteClaims.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    return claimDate.getMonth() === currentMonth && claimDate.getFullYear() === currentYear;
  });

  const lastMonthClaims = incompleteClaims.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    return claimDate.getMonth() === lastMonth && claimDate.getFullYear() === lastMonthYear;
  });

  const olderClaims = incompleteClaims.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    const isCurrentMonth = claimDate.getMonth() === currentMonth && claimDate.getFullYear() === currentYear;
    const isLastMonth = claimDate.getMonth() === lastMonth && claimDate.getFullYear() === lastMonthYear;
    return !isCurrentMonth && !isLastMonth;
  });

  const sortedThisMonth = [...thisMonthClaims].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const sortedLastMonth = [...lastMonthClaims].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const sortedOlder = [...olderClaims].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const thisMonthIssued = claims?.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    return claimDate.getMonth() === currentMonth && claimDate.getFullYear() === currentYear;
  }).length || 0;

  const lastMonthIssued = claims?.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    return claimDate.getMonth() === lastMonth && claimDate.getFullYear() === lastMonthYear;
  }).length || 0;

  const thisMonthInProgress = thisMonthClaims.length;
  const lastMonthInProgress = lastMonthClaims.length;

  const thisMonthCompleted = claims?.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    return claim.status === 'COMPLETED' && 
           claimDate.getMonth() === currentMonth && 
           claimDate.getFullYear() === currentYear;
  }).length || 0;

  const lastMonthCompleted = claims?.filter(claim => {
    const claimDate = new Date(claim.createdAt);
    return claim.status === 'COMPLETED' && 
           claimDate.getMonth() === lastMonth && 
           claimDate.getFullYear() === lastMonthYear;
  }).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title={t('dashboard.thisMonth')} 
          value={thisMonthIssued}
          description={`${t('dashboard.inProgress')}: ${thisMonthInProgress} • ${t('dashboard.completed')}: ${thisMonthCompleted}`}
          icon={FileText} 
          data-testid="stats-this-month"
        />
        <StatsCard 
          title={t('dashboard.lastMonth')} 
          value={lastMonthIssued}
          description={`${t('dashboard.inProgress')}: ${lastMonthInProgress} • ${t('dashboard.completed')}: ${lastMonthCompleted}`}
          icon={Clock}
          data-testid="stats-last-month"
        />
        <StatsCard 
          title={t('dashboard.totalIncomplete')} 
          value={incompleteClaims.length.toString()} 
          icon={AlertCircle} 
          iconColor="text-status-waitingTech"
          data-testid="stats-incomplete"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4" data-testid="heading-this-month">
            {t('dashboard.thisMonth')} ({thisMonthClaims.length})
          </h2>
          {thisMonthClaims.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-claims-this-month">
              {t('dashboard.noIncomplete')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedThisMonth.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  {...claim}
                  status={claim.status as ClaimStatus}
                  onClick={() => window.location.href = `/claims/${claim.id}`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4" data-testid="heading-last-month">
            {t('dashboard.lastMonth')} ({lastMonthClaims.length})
          </h2>
          {lastMonthClaims.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-claims-last-month">
              {t('dashboard.noIncomplete')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedLastMonth.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  {...claim}
                  status={claim.status as ClaimStatus}
                  onClick={() => window.location.href = `/claims/${claim.id}`}
                />
              ))}
            </div>
          )}
        </div>

        {olderClaims.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4" data-testid="heading-older">
              {t('dashboard.older')} ({olderClaims.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedOlder.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  {...claim}
                  status={claim.status as ClaimStatus}
                  onClick={() => window.location.href = `/claims/${claim.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
