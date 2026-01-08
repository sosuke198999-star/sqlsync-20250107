# Notification and Group Management Spec

This document captures the agreed notification rules and group/role management behavior.

## 1. Group Model and Roles

- Groups represent departments (e.g., Sales, Technical, Factory).
- Group creation is restricted to system administrators only.
- Group names are fixed and cannot be renamed.
- Each user belongs to exactly one group.
- Roles within a group:
  - `manager`: multiple managers allowed per group.
  - `member`: standard user role.

## 2. Permissions

- System administrators:
  - Create groups.
  - Configure overdue notification settings (admin-only section).
- Group managers:
  - Add and edit users within their own group only.
  - Member editing includes both name and email.
- Group members:
  - View-only access to group membership.

## 3. Notification Principles

- Notifications are fully auto-determined by relationships and roles.
- Workflow selection screens are removed; no manual selection of notification groups.
- Recipients are the union of:
  - Related parties (assignees, creator).
  - All members of their group.
  - All managers of their group (always CC).
- Deduplicate recipients by email before sending.

## 4. Notification Events and Recipients

### 4.1 Claim Created

- Claim creator.
- Creator group members.
- Creator group managers.

### 4.2 Claim Accepted (Assignees Set)

- Technical assignee group members.
- Technical group managers.
- Factory assignee group members.
- Factory group managers.

### 4.3 Countermeasure Submitted / Completed

- Creator group members.
- Creator group managers.
- Technical assignee group members + managers.
- Factory assignee group members + managers.

### 4.4 Technical Approval Completed

- Creator group members.
- Creator group managers.

### 4.5 Overdue (Due Date Passed)

- Current assignee (if any).
- Assignee group members + managers.
- Creator group members + managers.

## 5. Overdue Notification Settings (Admin Section)

- Screen location: add an admin-only section inside Notification Settings.
- Editable by system administrators only.
- Configuration fields:
  - Enable / disable overdue notifications.
  - Overdue threshold (same day / next day / N days).
  - Frequency (first time only / daily).
  - Send time (e.g., 09:00 JST).

