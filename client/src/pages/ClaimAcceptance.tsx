import { useMemo, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Claim } from "@shared/schema";
import {
  defaultTechAssignees,
  getStoredFactoryGroups,
  getStoredPeopleList,
  type AssigneePerson,
  type FactoryAssigneeGroup,
} from "@/lib/settingsDefaults";

export default function ClaimAcceptance() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [techAssignee, setTechAssignee] = useState("");
  const [factoryAssignee, setFactoryAssignee] = useState("");
  const techAssigneeOptions = useMemo<AssigneePerson[]>(
    () => getStoredPeopleList('techAssigneeList', defaultTechAssignees),
    []
  );
  const factoryAssigneeGroups = useMemo<FactoryAssigneeGroup[]>(
    () => getStoredFactoryGroups(),
    []
  );

  const { data: claim, isLoading, isError } = useQuery<Claim>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
  });

  // Hooks must be declared unconditionally and in the same order
  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/claims/${id}`, {
        assigneeTech: techAssignee,
        assigneeFactory: factoryAssignee,
        status: 'PENDING_COUNTERMEASURE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
      toast({
        title: t('acceptance.acceptSuccess'),
      });
      setLocation('/claims');
    },
  });

  if (!id) {
    setLocation('/claims');
    return null;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">読み込み中...</div>;
  }

  if (isError || !claim) {
    return <div className="flex items-center justify-center h-96">クレームが見つかりません</div>;
  }

  const handleAccept = () => {
    if (!id) return;
    if (techAssigneeOptions.length === 0 || factoryAssigneeGroups.length === 0) {
      toast({
        title: t('acceptance.noAssigneesTitle'),
        description: t('acceptance.noAssigneesDesc'),
        variant: "destructive",
      });
      return;
    }
    if (!techAssignee || !factoryAssignee) {
      toast({
        title: "エラー",
        description: "担当者を選択してください",
        variant: "destructive",
      });
      return;
    }
    acceptMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/claims">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            {t('acceptance.title')}
          </h1>
          <p className="text-muted-foreground">{t('acceptance.subtitle')}</p>
        </div>
        <StatusBadge status={claim.status as any} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('acceptance.claimInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('table.tcarNo')}</Label>
              <p className="font-medium" data-testid="text-tcar-no">{claim.tcarNo}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.customerDefectId')}</Label>
              <p className="font-medium" data-testid="text-customer-defect-id">
                {claim.customerDefectId || '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.customerName')}</Label>
              <p className="font-medium" data-testid="text-customer-name">{claim.customerName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.partNumber')}</Label>
              <p className="font-medium" data-testid="text-part-number">{claim.partNumber || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.dc')}</Label>
              <p className="font-medium" data-testid="text-dc">
                {claim.dcItems?.map(item => `${item.dc} (${item.quantity})`).join(', ') || '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('table.defectCount')}</Label>
              <p className="font-medium" data-testid="text-defect-count">{claim.defectCount || '-'}</p>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('table.defectName')}</Label>
            <p className="font-medium" data-testid="text-defect-name">{claim.defectName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('table.remarks')}</Label>
            <p className="text-sm" data-testid="text-remarks">{claim.remarks || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('acceptance.assignSection')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tech-assignee">{t('acceptance.techAssignee')}</Label>
            <Select
              value={techAssignee}
              onValueChange={setTechAssignee}
              disabled={techAssigneeOptions.length === 0}
            >
              <SelectTrigger id="tech-assignee" data-testid="select-tech-assignee">
                <SelectValue placeholder={t('acceptance.selectTech')} />
              </SelectTrigger>
              <SelectContent>
                {techAssigneeOptions.length === 0 ? (
                  <SelectItem value="__no-tech" disabled>
                    {t('acceptance.noTechAssignees')}
                  </SelectItem>
                ) : (
                  techAssigneeOptions.map((person) => (
                    <SelectItem key={person.name} value={person.name}>
                      <div className="flex flex-col">
                        <span>{person.name}</span>
                        {person.email && (
                          <span className="text-xs text-muted-foreground">{person.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {techAssigneeOptions.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('acceptance.assigneeSettingsHint')}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="factory-assignee">{t('acceptance.factoryAssignee')}</Label>
            <Select
              value={factoryAssignee}
              onValueChange={setFactoryAssignee}
              disabled={factoryAssigneeGroups.length === 0}
            >
              <SelectTrigger id="factory-assignee" data-testid="select-factory-assignee">
                <SelectValue placeholder={t('acceptance.selectFactory')} />
              </SelectTrigger>
              <SelectContent>
                {factoryAssigneeGroups.length === 0 ? (
                  <SelectItem value="__no-factory" disabled>
                    {t('acceptance.noFactoryAssignees')}
                  </SelectItem>
                ) : (
                  factoryAssigneeGroups.map((group) => (
                    <SelectItem key={group.name} value={group.name}>
                      <div className="flex flex-col">
                        <span>{group.name}</span>
                        {group.members.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {group.members
                              .map((member) =>
                                member.email
                                  ? `${member.name} <${member.email}>`
                                  : member.name
                              )
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {factoryAssigneeGroups.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('acceptance.assigneeSettingsHint')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/claims">
          <Button variant="outline" data-testid="button-cancel">
            {t('newClaim.cancel')}
          </Button>
        </Link>
        <Button
          onClick={handleAccept}
          disabled={acceptMutation.isPending || !techAssignee || !factoryAssignee}
          data-testid="button-accept"
        >
          {t('acceptance.accept')}
        </Button>
      </div>
    </div>
  );
}
