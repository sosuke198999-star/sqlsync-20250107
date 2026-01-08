import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupPerson = {
  name: string;
  email: string;
};

type NotificationGroup = {
  id: string;
  name: string;
  department: string;
  members: GroupPerson[];
  managers: GroupPerson[];
};

type OverdueSettings = {
  enabled: boolean;
  thresholdDays: number;
  frequency: "once" | "daily";
  sendTime: string;
};

type NotificationSettingsPayload = {
  groups: NotificationGroup[];
  overdueSettings: OverdueSettings;
};

const storageGroupsKey = "notificationGroupsV2";
const storageOverdueKey = "notificationOverdueSettings";

const defaultOverdueSettings: OverdueSettings = {
  enabled: false,
  thresholdDays: 0,
  frequency: "once",
  sendTime: "09:00",
};

const departmentOptions = [
  { value: "sales", labelKey: "notifications.department.sales" },
  { value: "technical", labelKey: "notifications.department.technical" },
  { value: "factory", labelKey: "notifications.department.factory" },
];

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [groups, setGroups] = useState<NotificationGroup[]>(() => {
    try {
      const stored = localStorage.getItem(storageGroupsKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [overdueSettings, setOverdueSettings] = useState<OverdueSettings>(() => {
    try {
      const stored = localStorage.getItem(storageOverdueKey);
      if (!stored) return defaultOverdueSettings;
      return { ...defaultOverdueSettings, ...JSON.parse(stored) };
    } catch {
      return defaultOverdueSettings;
    }
  });

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDepartment, setNewGroupDepartment] = useState<string>("");

  const isAdmin = user?.role === "admin";
  const userEmailKey = (user?.email ?? "").toLowerCase();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notification-settings", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as NotificationSettingsPayload;
        if (Array.isArray(data.groups)) {
          setGroups(data.groups);
        }
        if (data.overdueSettings) {
          setOverdueSettings({ ...defaultOverdueSettings, ...data.overdueSettings });
        }
      } catch {}
    })();
  }, []);

  const departmentMap = useMemo(() => {
    const map = new Map<string, NotificationGroup>();
    for (const group of groups) {
      map.set(group.department, group);
    }
    return map;
  }, [groups]);

  const canEditMembers = (group: NotificationGroup) => {
    if (isAdmin) return true;
    return group.managers.some((manager) => manager.email.toLowerCase() === userEmailKey);
  };

  const sanitizePeople = (people: GroupPerson[]) =>
    people
      .map((person) => ({
        name: person.name.trim(),
        email: person.email.trim(),
      }))
      .filter((person) => person.name && person.email);

  const updateGroup = (groupId: string, updater: (group: NotificationGroup) => NotificationGroup) => {
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? updater(group) : group)),
    );
  };

  const addGroup = () => {
    if (!isAdmin) return;
    const name = newGroupName.trim();
    if (!name) {
      toast({ title: t("notifications.enterGroupName"), variant: "destructive" });
      return;
    }
    if (!newGroupDepartment) {
      toast({ title: t("notifications.departmentRequired"), variant: "destructive" });
      return;
    }
    if (departmentMap.has(newGroupDepartment)) {
      toast({ title: t("notifications.departmentExists"), variant: "destructive" });
      return;
    }

    const next: NotificationGroup = {
      id: generateId(),
      name,
      department: newGroupDepartment,
      members: [],
      managers: [],
    };
    setGroups((prev) => [...prev, next]);
    setNewGroupName("");
    setNewGroupDepartment("");
  };

  const addPerson = (groupId: string, list: "members" | "managers" = "members") => {
    updateGroup(groupId, (group) => ({
      ...group,
      [list]: [...group[list], { name: "", email: "" }],
    }));
  };

  const updatePerson = (
    groupId: string,
    list: "members" | "managers",
    index: number,
    key: keyof GroupPerson,
    value: string,
  ) => {
    updateGroup(groupId, (group) => {
      const next = [...group[list]];
      next[index] = { ...next[index], [key]: value };
      return { ...group, [list]: next };
    });
  };

  const removePerson = (groupId: string, list: "members" | "managers", index: number) => {
    updateGroup(groupId, (group) => {
      const next = group[list].filter((_, idx) => idx !== index);
      return { ...group, [list]: next };
    });
  };

  const handleSave = async () => {
    const sanitizedGroups = groups.map((group) => ({
      ...group,
      members: sanitizePeople(group.members),
      managers: sanitizePeople(group.managers),
    }));

    const payload: NotificationSettingsPayload = {
      groups: sanitizedGroups,
      overdueSettings,
    };

    try {
      await apiRequest("POST", "/api/notification-settings", payload);
      localStorage.setItem(storageGroupsKey, JSON.stringify(sanitizedGroups));
      localStorage.setItem(storageOverdueKey, JSON.stringify(overdueSettings));
      setGroups(sanitizedGroups);
      toast({ title: t("notifications.saveSuccess"), description: t("notifications.saveSuccessDesc") });
    } catch (e: any) {
      toast({
        title: t("notifications.error"),
        description: String(e?.message || e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          {t("notifications.title")}
        </h1>
        <p className="text-muted-foreground">{t("notifications.subtitle")}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t("notifications.groupSectionTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("notifications.groupSectionDesc")}</p>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>{t("notifications.newGroupTitle")}</CardTitle>
              <CardDescription>{t("notifications.newGroupDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr_auto] md:items-end">
                <div>
                  <Label>{t("notifications.departmentLabel")}</Label>
                  <Select value={newGroupDepartment} onValueChange={setNewGroupDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("notifications.departmentPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-group-name">{t("notifications.groupNameLabel")}</Label>
                  <Input
                    id="new-group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t("notifications.groupNamePlaceholder")}
                  />
                </div>
                <Button onClick={addGroup} type="button">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("notifications.addGroup")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              {t("notifications.noGroups")}
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => {
            const editableMembers = canEditMembers(group);
            const entries = [
              ...group.managers.map((person, index) => ({
                role: "manager" as const,
                index,
                person,
              })),
              ...group.members.map((person, index) => ({
                role: "member" as const,
                index,
                person,
              })),
            ];

            const canEditEntry = (role: "manager" | "member") =>
              role === "manager" ? isAdmin : editableMembers;

            const updateEntryRole = (
              role: "manager" | "member",
              index: number,
              nextRole: "manager" | "member",
            ) => {
              if (!isAdmin || role === nextRole) return;
              updateGroup(group.id, (current) => {
                const currentList = [...current[role === "manager" ? "managers" : "members"]];
                const [moved] = currentList.splice(index, 1);
                const targetList = [
                  ...(nextRole === "manager" ? current.managers : current.members),
                ];
                targetList.push(moved);
                return {
                  ...current,
                  managers: role === "manager" ? currentList : nextRole === "manager" ? targetList : current.managers,
                  members: role === "member" ? currentList : nextRole === "member" ? targetList : current.members,
                };
              });
            };

            const updateEntry = (
              role: "manager" | "member",
              index: number,
              key: keyof GroupPerson,
              value: string,
            ) => {
              updatePerson(group.id, role === "manager" ? "managers" : "members", index, key, value);
            };

            const removeEntry = (role: "manager" | "member", index: number) => {
              removePerson(group.id, role === "manager" ? "managers" : "members", index);
            };

            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <span>{group.name}</span>
                    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      {t(`notifications.department.${group.department}`)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {t("notifications.memberLabel")}
                      </Label>
                      {(editableMembers || isAdmin) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPerson(group.id, isAdmin ? "managers" : "members")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {t("notifications.addPerson")}
                        </Button>
                      )}
                    </div>
                    {entries.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t("notifications.noMembers")}
                      </p>
                    )}
                    {entries.map(({ role, index, person }) => {
                      const canEdit = canEditEntry(role);
                      return (
                        <div
                          key={`${role}-${group.id}-${index}`}
                          className="grid gap-2 md:grid-cols-[160px_1fr_1fr_auto]"
                        >
                          <Select
                            value={role}
                            onValueChange={(value) =>
                              updateEntryRole(role, index, value as "manager" | "member")
                            }
                            disabled={!isAdmin}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("notifications.roleLabel")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">{t("notifications.role.manager")}</SelectItem>
                              <SelectItem value="member">{t("notifications.role.member")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={person.name}
                            onChange={(e) => updateEntry(role, index, "name", e.target.value)}
                            placeholder={t("notifications.memberNamePlaceholder")}
                            disabled={!canEdit}
                          />
                          <Input
                            type="email"
                            value={person.email}
                            onChange={(e) => updateEntry(role, index, "email", e.target.value)}
                            placeholder={t("notifications.memberEmailPlaceholder")}
                            disabled={!canEdit}
                          />
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEntry(role, index)}
                            >
                              X
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t("notifications.overdueSectionTitle")}</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("notifications.overdueSectionTitle")}</CardTitle>
              <CardDescription>{t("notifications.overdueSectionDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label>{t("notifications.overdueEnabled")}</Label>
                <Switch
                  checked={overdueSettings.enabled}
                  onCheckedChange={(checked) =>
                    setOverdueSettings((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("notifications.overdueThresholdLabel")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={overdueSettings.thresholdDays}
                    onChange={(e) =>
                      setOverdueSettings((prev) => ({
                        ...prev,
                        thresholdDays: Math.max(0, Number(e.target.value || 0)),
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.overdueThresholdHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t("notifications.overdueFrequencyLabel")}</Label>
                  <Select
                    value={overdueSettings.frequency}
                    onValueChange={(value) =>
                      setOverdueSettings((prev) => ({
                        ...prev,
                        frequency: value as OverdueSettings["frequency"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">{t("notifications.overdueFrequencyOnce")}</SelectItem>
                      <SelectItem value="daily">{t("notifications.overdueFrequencyDaily")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("notifications.overdueSendTimeLabel")}</Label>
                <Input
                  type="time"
                  value={overdueSettings.sendTime}
                  onChange={(e) =>
                    setOverdueSettings((prev) => ({ ...prev, sendTime: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" data-testid="button-save-settings">
          {t("notifications.saveSettings")}
        </Button>
      </div>
    </div>
  );
}
