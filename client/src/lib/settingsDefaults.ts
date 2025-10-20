export type AssigneePerson = {
  name: string;
  email: string;
  userId?: string;
};

export const defaultTechAssignees: AssigneePerson[] = [
  { name: "技術部 田中次郎", email: "" },
  { name: "技術部 佐藤花子", email: "" },
  { name: "技術部 高橋太郎", email: "" },
];

const clonePeople = (people: AssigneePerson[]) =>
  people.map((person) => ({
    ...person,
    userId: person.userId ?? undefined,
  }));

const sanitizePeople = (value: unknown): AssigneePerson[] | null => {
  if (!Array.isArray(value)) return null;
  const sanitized: AssigneePerson[] = [];

  for (const entry of value) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (!name) continue;
      sanitized.push({ name, email: "", userId: undefined });
      continue;
    }

    if (!entry || typeof entry !== "object") continue;
    const rawName = (entry as { name?: unknown }).name;
    const rawEmail = (entry as { email?: unknown }).email;
    const rawUserId = (entry as { userId?: unknown }).userId;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const userIdRaw = typeof rawUserId === "string" ? rawUserId.trim() : "";
    const userId = userIdRaw ? userIdRaw : undefined;
    if (!name) continue;
    sanitized.push({ name, email, userId });
  }

  return sanitized.length ? sanitized : [];
};

export function getStoredPeopleList(key: string, fallback: AssigneePerson[]) {
  if (typeof window === "undefined") return clonePeople(fallback);
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return clonePeople(fallback);
    const parsed = JSON.parse(stored);
    const sanitized = sanitizePeople(parsed);
    if (sanitized && sanitized.length > 0) return sanitized;
    return clonePeople(fallback);
  } catch {
    return clonePeople(fallback);
  }
}

export type FactoryAssigneeGroup = {
  name: string;
  members: AssigneePerson[];
};

export type SalesAssigneeGroup = {
  name: string;
  members: AssigneePerson[];
};

export const defaultFactoryAssigneeGroups: FactoryAssigneeGroup[] = [
  {
    name: "工場 第1グループ",
    members: [
      { name: "工場 鈴木一郎", email: "" },
      { name: "工場 山本和夫", email: "" },
    ],
  },
  {
    name: "工場 第2グループ",
    members: [{ name: "工場 中村美咲", email: "" }],
  },
];

const cloneFactoryGroups = (groups: FactoryAssigneeGroup[]) =>
  groups.map((group) => ({
    name: group.name,
    members: clonePeople(group.members),
  }));

const sanitizeFactoryGroups = (value: unknown): FactoryAssigneeGroup[] | null => {
  if (!Array.isArray(value)) return null;
  const sanitized: FactoryAssigneeGroup[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const rawName = (entry as { name?: unknown }).name;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) continue;

    const membersRaw = (entry as { members?: unknown }).members;
    const membersSanitized = sanitizePeople(membersRaw);

    sanitized.push({
      name,
      members: (membersSanitized ?? []).map((member) => ({
        ...member,
        userId: member.userId ?? undefined,
      })),
    });
  }

  return sanitized;
};

export function getStoredFactoryGroups(): FactoryAssigneeGroup[] {
  const fallback = cloneFactoryGroups(defaultFactoryAssigneeGroups);
  if (typeof window === "undefined") return fallback;

  try {
    const storedGroups = localStorage.getItem("factoryAssigneeGroups");
    if (storedGroups) {
      const parsed = JSON.parse(storedGroups);
      const sanitized = sanitizeFactoryGroups(parsed);
      if (sanitized) return sanitized;
      return fallback;
    }

    const legacy = localStorage.getItem("factoryAssigneeList");
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy)) {
        const converted = parsedLegacy
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
          .map<FactoryAssigneeGroup>((name) => ({ name, members: [] }));
        if (converted.length > 0) return converted;
        return [];
      }
    }
  } catch (error) {
    console.warn("Failed to load factory assignee groups", error);
  }

  return fallback;
}

export const defaultSalesAssigneeGroups: SalesAssigneeGroup[] = [
  {
    name: "営業 第1グループ",
    members: [
      { name: "営業 田中健", email: "" },
      { name: "営業 佐藤彩", email: "" },
    ],
  },
  {
    name: "営業 第2グループ",
    members: [{ name: "営業 鈴木英樹", email: "" }],
  },
];

const cloneSalesGroups = (groups: SalesAssigneeGroup[]) =>
  groups.map((group) => ({
    name: group.name,
    members: clonePeople(group.members),
  }));

const sanitizeSalesGroups = (value: unknown): SalesAssigneeGroup[] | null => {
  if (!Array.isArray(value)) return null;
  const sanitized: SalesAssigneeGroup[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const rawName = (entry as { name?: unknown }).name;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) continue;

    const membersRaw = (entry as { members?: unknown }).members;
    const membersSanitized = sanitizePeople(membersRaw);

    sanitized.push({
      name,
      members: (membersSanitized ?? []).map((member) => ({
        ...member,
        userId: member.userId ?? undefined,
      })),
    });
  }

  return sanitized;
};

export function getStoredSalesGroups(): SalesAssigneeGroup[] {
  const fallback = cloneSalesGroups(defaultSalesAssigneeGroups);
  if (typeof window === "undefined") return fallback;

  try {
    const storedGroups = localStorage.getItem("salesAssigneeGroups");
    if (storedGroups) {
      const parsed = JSON.parse(storedGroups);
      const sanitized = sanitizeSalesGroups(parsed);
      if (sanitized) return sanitized;
      return fallback;
    }
  } catch (error) {
    console.warn("Failed to load sales assignee groups", error);
  }

  return fallback;
}
