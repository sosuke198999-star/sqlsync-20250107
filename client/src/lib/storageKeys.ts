/**
 * Centralized localStorage keys
 * Prevents typos and makes refactoring easier
 */
export const STORAGE_KEYS = {
  CUSTOMER_LIST: 'customerList',
  FACTORY_ASSIGNEE_GROUPS: 'factoryAssigneeGroups',
  SALES_ASSIGNEE_GROUPS: 'salesAssigneeGroups',
  TECH_ASSIGNEE_GROUPS: 'techAssigneeGroups',
  LANGUAGE: 'language',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
