import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Workflow, Plus, X, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  defaultTechAssignees,
  getStoredFactoryGroups,
  getStoredPeopleList,
  getStoredSalesGroups,
  type FactoryAssigneeGroup,
  type AssigneePerson,
  type SalesAssigneeGroup,
} from "@/lib/settingsDefaults";
import { useAuth } from "@/lib/auth";

interface NotificationGroup {
  id: string;
  name: string;
  emails: string[];
}

interface WorkflowNotificationSettings {
  onClaimCreated: string[];
  onClaimAccepted: string[];
  onCountermeasureSubmitted: string[];
  onTechnicalApproved: string[];
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { users } = useAuth();

  const manualUserValue = "__manual__";

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const selectableUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
        .map((user) => ({
          id: user.id,
          label: `${user.name} (${user.email})`,
        })),
    [users],
  );

  const applyUserSelection = (
    person: AssigneePerson | undefined,
    selectedId: string | null,
  ): AssigneePerson => {
    const base: AssigneePerson = { name: person?.name ?? "", email: person?.email ?? "", userId: person?.userId };
    if (!selectedId) {
      return { ...base, userId: undefined };
    }

    const linkedUser = userMap.get(selectedId);
    if (!linkedUser) {
      return { ...base, userId: undefined };
    }

    return {
      ...base,
      name: linkedUser.name,
      email: linkedUser.email,
      userId: selectedId,
    };
  };

  const [groups, setGroups] = useState<NotificationGroup[]>(() => {
    const saved = localStorage.getItem('notificationGroups');
    return saved ? JSON.parse(saved) : [];
  });

  const [workflowSettings, setWorkflowSettings] = useState<WorkflowNotificationSettings>(() => {
    const defaults: WorkflowNotificationSettings = {
      onClaimCreated: [],
      onClaimAccepted: [],
      onCountermeasureSubmitted: [],
      onTechnicalApproved: [],
    };
    const saved = localStorage.getItem('workflowNotificationSettings');
    if (!saved) return defaults;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });
  const [techAssigneeList, setTechAssigneeList] = useState<AssigneePerson[]>(() =>
    getStoredPeopleList('techAssigneeList', defaultTechAssignees)
  );
  const [factoryGroups, setFactoryGroups] = useState<FactoryAssigneeGroup[]>(() =>
    getStoredFactoryGroups()
  );
  const [salesGroups, setSalesGroups] = useState<SalesAssigneeGroup[]>(() =>
    getStoredSalesGroups()
  );

  // Load from server (if available) and override local state
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/notification-settings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.groups) && data.workflowSettings) {
            setGroups(data.groups);
            const defaults: WorkflowNotificationSettings = {
              onClaimCreated: [],
              onClaimAccepted: [],
              onCountermeasureSubmitted: [],
              onTechnicalApproved: [],
            };
            setWorkflowSettings({ ...defaults, ...(data.workflowSettings || {}) });
          }
        }
      } catch {}
    })();
  }, []);

  const toggleGroupInWorkflow = (workflow: keyof WorkflowNotificationSettings, groupId: string) => {
    const currentGroups = workflowSettings[workflow];
    const isSelected = currentGroups.includes(groupId);

    setWorkflowSettings({
      ...workflowSettings,
      [workflow]: isSelected
        ? currentGroups.filter(id => id !== groupId)
        : [...currentGroups, groupId],
    });
  };

  const addTechAssignee = () => {
    setTechAssigneeList([...techAssigneeList, { name: "", email: "", userId: undefined }]);
  };

  const removeTechAssignee = (index: number) => {
    setTechAssigneeList(techAssigneeList.filter((_, i) => i !== index));
  };

  const updateTechAssigneeName = (index: number, value: string) => {
    const next = [...techAssigneeList];
    next[index] = { ...next[index], name: value, userId: undefined };
    setTechAssigneeList(next);
  };

  const updateTechAssigneeEmail = (index: number, value: string) => {
    const next = [...techAssigneeList];
    next[index] = { ...next[index], email: value, userId: undefined };
    setTechAssigneeList(next);
  };

  const selectTechAssigneeUser = (index: number, selected: string) => {
    const next = [...techAssigneeList];
    next[index] = applyUserSelection(
      next[index],
      selected === manualUserValue ? null : selected,
    );
    setTechAssigneeList(next);
  };

  const addFactoryGroup = () => {
    setFactoryGroups([...factoryGroups, { name: "", members: [] }]);
  };

  const removeFactoryGroup = (index: number) => {
    setFactoryGroups(factoryGroups.filter((_, i) => i !== index));
  };

  const updateFactoryGroupName = (index: number, value: string) => {
    const next = [...factoryGroups];
    next[index] = { ...next[index], name: value };
    setFactoryGroups(next);
  };

  const addFactoryGroupMember = (groupIndex: number) => {
    const next = [...factoryGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members.push({ name: "", email: "", userId: undefined });
    next[groupIndex] = { ...next[groupIndex], members };
    setFactoryGroups(next);
  };

  const updateFactoryGroupMemberName = (groupIndex: number, memberIndex: number, value: string) => {
    const next = [...factoryGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members[memberIndex] = { ...members[memberIndex], name: value, userId: undefined };
    next[groupIndex] = { ...next[groupIndex], members };
    setFactoryGroups(next);
  };

  const updateFactoryGroupMemberEmail = (groupIndex: number, memberIndex: number, value: string) => {
    const next = [...factoryGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members[memberIndex] = { ...members[memberIndex], email: value, userId: undefined };
    next[groupIndex] = { ...next[groupIndex], members };
    setFactoryGroups(next);
  };

  const selectFactoryGroupMemberUser = (
    groupIndex: number,
    memberIndex: number,
    selected: string,
  ) => {
    const next = [...factoryGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members[memberIndex] = applyUserSelection(
      members[memberIndex],
      selected === manualUserValue ? null : selected,
    );
    next[groupIndex] = { ...next[groupIndex], members };
    setFactoryGroups(next);
  };

  const removeFactoryGroupMember = (groupIndex: number, memberIndex: number) => {
    const next = [...factoryGroups];
    const members = (next[groupIndex]?.members ?? []).filter((_, i) => i !== memberIndex);
    next[groupIndex] = { ...next[groupIndex], members };
    setFactoryGroups(next);
  };

  const addSalesGroup = () => {
    setSalesGroups([...salesGroups, { name: "", members: [] }]);
  };

  const removeSalesGroup = (index: number) => {
    setSalesGroups(salesGroups.filter((_, i) => i !== index));
  };

  const updateSalesGroupName = (index: number, value: string) => {
    const next = [...salesGroups];
    next[index] = { ...next[index], name: value };
    setSalesGroups(next);
  };

  const addSalesGroupMember = (groupIndex: number) => {
    const next = [...salesGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members.push({ name: "", email: "", userId: undefined });
    next[groupIndex] = { ...next[groupIndex], members };
    setSalesGroups(next);
  };

  const updateSalesGroupMemberName = (groupIndex: number, memberIndex: number, value: string) => {
    const next = [...salesGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members[memberIndex] = { ...members[memberIndex], name: value, userId: undefined };
    next[groupIndex] = { ...next[groupIndex], members };
    setSalesGroups(next);
  };

  const updateSalesGroupMemberEmail = (groupIndex: number, memberIndex: number, value: string) => {
    const next = [...salesGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members[memberIndex] = { ...members[memberIndex], email: value, userId: undefined };
    next[groupIndex] = { ...next[groupIndex], members };
    setSalesGroups(next);
  };

  const selectSalesGroupMemberUser = (
    groupIndex: number,
    memberIndex: number,
    selected: string,
  ) => {
    const next = [...salesGroups];
    const members = [...(next[groupIndex]?.members ?? [])];
    members[memberIndex] = applyUserSelection(
      members[memberIndex],
      selected === manualUserValue ? null : selected,
    );
    next[groupIndex] = { ...next[groupIndex], members };
    setSalesGroups(next);
  };

  const removeSalesGroupMember = (groupIndex: number, memberIndex: number) => {
    const next = [...salesGroups];
    const members = (next[groupIndex]?.members ?? []).filter((_, i) => i !== memberIndex);
    next[groupIndex] = { ...next[groupIndex], members };
    setSalesGroups(next);
  };

  const handleSave = async () => {
    // Filter out empty emails before saving
    const cleanedGroups = groups.map(g => ({
      ...g,
      emails: g.emails.filter(e => e.trim()),
    }));
    const sanitizedTech = techAssigneeList
      .map((person) => {
        const name = (person?.name ?? "").trim();
        const email = (person?.email ?? "").trim();
        const sanitized: AssigneePerson = { name, email };
        if (person?.userId) {
          sanitized.userId = person.userId;
        }
        return sanitized;
      })
      .filter((person) => person.name);
    const sanitizedFactoryGroups = factoryGroups
      .map((group) => {
        const members = (group.members ?? [])
          .map((member) => {
            const name = (member?.name ?? "").trim();
            const email = (member?.email ?? "").trim();
            const sanitized: AssigneePerson = { name, email };
            if (member?.userId) {
              sanitized.userId = member.userId;
            }
            return sanitized;
          })
          .filter((member) => member.name);
        return {
          name: group.name.trim(),
          members,
        };
      })
      .filter((group) => group.name);
    const sanitizedSalesGroups = salesGroups
      .map((group) => {
        const members = (group.members ?? [])
          .map((member) => {
            const name = (member?.name ?? "").trim();
            const email = (member?.email ?? "").trim();
            const sanitized: AssigneePerson = { name, email };
            if (member?.userId) {
              sanitized.userId = member.userId;
            }
            return sanitized;
          })
          .filter((member) => member.name);
        return {
          name: group.name.trim(),
          members,
        };
      })
      .filter((group) => group.name);

    try {
      await apiRequest('POST', '/api/notification-settings', {
        groups: cleanedGroups,
        workflowSettings,
      });
      // keep local fallback in sync
      localStorage.setItem('notificationGroups', JSON.stringify(cleanedGroups));
      localStorage.setItem('workflowNotificationSettings', JSON.stringify(workflowSettings));
      localStorage.setItem('techAssigneeList', JSON.stringify(sanitizedTech));
      localStorage.setItem('factoryAssigneeGroups', JSON.stringify(sanitizedFactoryGroups));
      localStorage.setItem('salesAssigneeGroups', JSON.stringify(sanitizedSalesGroups));
      localStorage.removeItem('factoryAssigneeList');
      setTechAssigneeList(sanitizedTech);
      setFactoryGroups(sanitizedFactoryGroups);
      setSalesGroups(sanitizedSalesGroups);
      toast({ title: t('notifications.saveSuccess'), description: t('notifications.saveSuccessDesc') });
      console.log('Notification settings saved:', {
        groups: cleanedGroups,
        workflowSettings,
        techAssigneeList: sanitizedTech,
        factoryAssigneeGroups: sanitizedFactoryGroups,
        salesAssigneeGroups: sanitizedSalesGroups,
      });
    } catch (e: any) {
      toast({ title: t('notifications.error'), description: String(e?.message || e) as string, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          {t('notifications.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('notifications.subtitle')}
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t('notifications.workflowTab')}</h2>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
