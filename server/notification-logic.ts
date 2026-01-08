import type { Claim } from "@shared/schema";
import {
  loadNotificationSettings,
  type NotificationGroup,
  type GroupPerson,
} from "./notification-store";

export type NotificationEvent =
  | "claimCreated"
  | "claimAccepted"
  | "countermeasureSubmitted"
  | "technicalApproved"
  | "overdue";

const normalizeKey = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

const shouldDebug = () => process.env.NOTIFY_DEBUG === "1";

const debugLog = (message: string, details?: Record<string, unknown>) => {
  if (!shouldDebug()) return;
  if (details) {
    console.log(`[notify] ${message} :: ${JSON.stringify(details)}`);
    return;
  }
  console.log(`[notify] ${message}`);
};

const getGroupEmails = (group: NotificationGroup | undefined): string[] => {
  if (!group) return [];
  const emails = new Set<string>();
  for (const person of [...group.members, ...group.managers]) {
    const email = String(person.email ?? "").trim();
    if (email) emails.add(email);
  }
  return Array.from(emails);
};

const findGroupByName = (groups: NotificationGroup[], name?: string | null) => {
  const key = normalizeKey(name);
  if (!key) return undefined;
  return groups.find((group) => normalizeKey(group.name) === key);
};

const findGroupByMember = (groups: NotificationGroup[], name?: string | null) => {
  const key = normalizeKey(name);
  if (!key) return undefined;
  return groups.find((group) =>
    [...group.members, ...group.managers].some(
      (person) => normalizeKey(person.name) === key,
    ),
  );
};

const getGroupNameForMember = (groups: NotificationGroup[], name?: string | null) =>
  findGroupByMember(groups, name)?.name ?? null;

const getGroupNameForGroup = (groups: NotificationGroup[], name?: string | null) =>
  findGroupByName(groups, name)?.name ?? null;

const findPersonEmail = (groups: NotificationGroup[], name?: string | null): string | undefined => {
  const key = normalizeKey(name);
  if (!key) return undefined;
  for (const group of groups) {
    const match = [...group.members, ...group.managers].find(
      (person) => normalizeKey(person.name) === key,
    );
    if (match?.email) return match.email;
  }
  return undefined;
};

const addGroupAndPerson = (
  recipients: Set<string>,
  groups: NotificationGroup[],
  name?: string | null,
) => {
  if (!name) return;
  const group = findGroupByMember(groups, name);
  if (group) {
    for (const email of getGroupEmails(group)) recipients.add(email);
  }
  const email = findPersonEmail(groups, name);
  if (email) recipients.add(email);
};

const addGroupByName = (
  recipients: Set<string>,
  groups: NotificationGroup[],
  name?: string | null,
) => {
  if (!name) return;
  const group = findGroupByName(groups, name) ?? findGroupByMember(groups, name);
  if (!group) return;
  for (const email of getGroupEmails(group)) recipients.add(email);
};

const getCreatorGroupEmails = (groups: NotificationGroup[], creator?: string | null) => {
  const group = findGroupByMember(groups, creator);
  return getGroupEmails(group);
};

const collectAssigneeGroups = (
  recipients: Set<string>,
  groups: NotificationGroup[],
  tech?: string | null,
  factory?: string | null,
  fallbackAssignee?: string | null,
) => {
  addGroupAndPerson(recipients, groups, tech ?? null);
  addGroupByName(recipients, groups, factory ?? null);
  if (!tech && !factory && fallbackAssignee) {
    addGroupAndPerson(recipients, groups, fallbackAssignee);
  }
};

export async function getRecipientsForEvent(
  event: NotificationEvent,
  claim: Claim,
): Promise<string[]> {
  const { groups } = await loadNotificationSettings();
  const recipients = new Set<string>();

  switch (event) {
    case "claimCreated": {
      addGroupAndPerson(recipients, groups, claim.createdBy);
      debugLog("claimCreated", {
        tcarNo: claim.tcarNo,
        createdBy: claim.createdBy ?? null,
        creatorGroup: getGroupNameForMember(groups, claim.createdBy),
      });
      break;
    }
    case "claimAccepted": {
      collectAssigneeGroups(recipients, groups, claim.assigneeTech, claim.assigneeFactory, claim.assignee);
      debugLog("claimAccepted", {
        tcarNo: claim.tcarNo,
        assigneeTech: claim.assigneeTech ?? null,
        assigneeTechGroup: getGroupNameForMember(groups, claim.assigneeTech),
        assigneeFactory: claim.assigneeFactory ?? null,
        assigneeFactoryGroup: getGroupNameForGroup(groups, claim.assigneeFactory),
        assigneeFallback: claim.assignee ?? null,
        assigneeFallbackGroup: getGroupNameForMember(groups, claim.assignee),
      });
      break;
    }
    case "countermeasureSubmitted": {
      for (const email of getCreatorGroupEmails(groups, claim.createdBy)) {
        recipients.add(email);
      }
      collectAssigneeGroups(recipients, groups, claim.assigneeTech, claim.assigneeFactory, claim.assignee);
      debugLog("countermeasureSubmitted", {
        tcarNo: claim.tcarNo,
        createdBy: claim.createdBy ?? null,
        creatorGroup: getGroupNameForMember(groups, claim.createdBy),
        assigneeTech: claim.assigneeTech ?? null,
        assigneeTechGroup: getGroupNameForMember(groups, claim.assigneeTech),
        assigneeFactory: claim.assigneeFactory ?? null,
        assigneeFactoryGroup: getGroupNameForGroup(groups, claim.assigneeFactory),
      });
      break;
    }
    case "technicalApproved": {
      for (const email of getCreatorGroupEmails(groups, claim.createdBy)) {
        recipients.add(email);
      }
      debugLog("technicalApproved", {
        tcarNo: claim.tcarNo,
        createdBy: claim.createdBy ?? null,
        creatorGroup: getGroupNameForMember(groups, claim.createdBy),
      });
      break;
    }
    case "overdue": {
      for (const email of getCreatorGroupEmails(groups, claim.createdBy)) {
        recipients.add(email);
      }
      collectAssigneeGroups(recipients, groups, claim.assigneeTech, claim.assigneeFactory, claim.assignee);
      debugLog("overdue", {
        tcarNo: claim.tcarNo,
        createdBy: claim.createdBy ?? null,
        creatorGroup: getGroupNameForMember(groups, claim.createdBy),
        assigneeTech: claim.assigneeTech ?? null,
        assigneeTechGroup: getGroupNameForMember(groups, claim.assigneeTech),
        assigneeFactory: claim.assigneeFactory ?? null,
        assigneeFactoryGroup: getGroupNameForGroup(groups, claim.assigneeFactory),
      });
      break;
    }
    default:
      break;
  }

  const list = Array.from(recipients);
  debugLog("recipientsResolved", { event, tcarNo: claim.tcarNo, count: list.length, recipients: list });
  return list;
}

export function getGroupDepartments(groups: NotificationGroup[]) {
  const map = new Map<string, NotificationGroup>();
  for (const group of groups) {
    const key = normalizeKey(group.department);
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, group);
    }
  }
  return map;
}
