# Design Guidelines: Claim Management System

## Design Approach: Material Design System
**Rationale:** Enterprise productivity application requiring clarity, efficiency, and information density across multiple user roles (Sales, Tech, Factory). Material Design provides robust patterns for data-heavy interfaces with excellent component library support.

## Core Design Principles
1. **Clarity First**: Information hierarchy optimized for quick scanning and data entry
2. **Role-Based Visual Cues**: Distinct color coding for department-specific actions and statuses
3. **Workflow Transparency**: Clear visual indicators of claim progression through status pipeline
4. **Minimal Cognitive Load**: Familiar patterns, reduced decoration, functional interactions

---

## Color Palette

### Light Mode
- **Primary**: 25 85% 47% (Professional blue for primary actions, headers)
- **Surface**: 0 0% 98% (Clean background)
- **Surface Variant**: 220 14% 96% (Card backgrounds, elevated sections)
- **On Surface**: 220 9% 15% (Primary text)
- **On Surface Variant**: 220 9% 46% (Secondary text)
- **Border**: 220 13% 91% (Dividers, card borders)

### Dark Mode  
- **Primary**: 213 94% 68% (Brighter blue for visibility)
- **Surface**: 222 13% 11% (Deep background)
- **Surface Variant**: 217 19% 15% (Card backgrounds)
- **On Surface**: 210 20% 98% (Primary text)
- **On Surface Variant**: 215 16% 65% (Secondary text)
- **Border**: 217 19% 27% (Dividers)

### Status Colors (Works in both modes)
- **NEW**: 48 96% 53% (Amber - attention needed)
- **WAITING_TECH**: 217 91% 60% (Blue - in tech queue)
- **REQUESTED_FACTORY**: 262 52% 60% (Purple - factory assigned)
- **WAITING_FACTORY_REPORT**: 262 52% 47% (Darker purple - awaiting input)
- **TECH_REVIEW**: 142 71% 45% (Teal - under review)
- **COMPLETED**: 142 76% 36% (Green - success)
- **CRITICAL Priority**: 0 84% 60% (Red - urgent)
- **HIGH Priority**: 33 100% 50% (Orange)
- **MEDIUM Priority**: 45 93% 47% (Yellow)
- **LOW Priority**: 220 9% 46% (Gray)

---

## Typography
**Font Stack**: System fonts via Tailwind defaults
- **Headings H1**: text-3xl font-bold (Dashboard titles)
- **Headings H2**: text-2xl font-semibold (Section headers)
- **Headings H3**: text-xl font-semibold (Card titles)
- **Body**: text-base (15-16px, primary content)
- **Small/Meta**: text-sm text-on-surface-variant (timestamps, labels)
- **Data Labels**: text-xs font-medium uppercase tracking-wide (form labels, table headers)

---

## Layout System

### Spacing Primitives (Tailwind Units)
- **Micro spacing**: 1, 2 (tight groupings, icon-text gaps)
- **Component spacing**: 4, 6 (padding within cards, form fields)
- **Section spacing**: 8, 12 (gaps between major sections)
- **Page margins**: 16, 24 (outer page padding on desktop)

### Grid & Container
- **Max Width**: max-w-7xl (1280px) for main content
- **Dashboard Grid**: grid-cols-1 md:grid-cols-3 lg:grid-cols-4 (stats cards)
- **Table/List Container**: Full width within max-w-7xl
- **Form Layouts**: max-w-2xl centered for single-column forms
- **Two-Column Forms**: grid-cols-1 md:grid-cols-2 gap-6

---

## Component Library

### Navigation
- **Top Bar**: Fixed header with app title, role indicator badge, user menu
- **Sidebar Navigation** (Desktop): Left-aligned, collapsible, 240px width
  - Dashboard, Claims List, New Claim, Search, Reports (role-dependent)
- **Mobile Nav**: Bottom sheet or hamburger menu
- **Breadcrumbs**: For claim detail pages showing navigation path

### Cards & Surfaces
- **Claim Card**: Elevated surface with status badge, TCAR number prominent
- **Stats Card**: Dashboard metrics with icon, value (text-3xl font-bold), label
- **Detail Card**: White/dark surface with subtle border, rounded-lg, p-6
- **Shadow**: shadow-sm for cards, shadow-md for modals

### Data Display
- **Claims Table**: 
  - Sticky header with sortable columns
  - Row hover state (bg-surface-variant/50)
  - Status badge in dedicated column
  - Priority indicator as colored dot + text
  - Action buttons (icon-only) in final column
- **Status Badge**: Pill-shaped (rounded-full), status-colored background with white text, px-3 py-1, text-xs font-medium
- **Priority Indicator**: Colored dot (h-2 w-2 rounded-full) + text label

### Forms
- **Input Fields**: Consistent height (h-10), border, rounded-md, focus:ring-2 focus:ring-primary
- **Textarea**: min-h-32 for symptom description, corrective/preventive actions
- **Select Dropdowns**: Native or custom with chevron icon
- **Date Picker**: Calendar icon, clear formatting (YYYY-MM-DD)
- **Multi-step Forms**: Progress indicator for complex claim creation

### Buttons
- **Primary**: bg-primary text-white, rounded-md, px-4 py-2, font-medium
- **Secondary**: border border-border, bg-transparent, hover:bg-surface-variant
- **Icon Buttons**: p-2 rounded-full hover:bg-surface-variant (for actions in tables)
- **Danger/Destructive**: bg-red-600 text-white (delete, reject actions)

### Modals & Overlays
- **Modal Dialog**: max-w-lg, centered, backdrop blur, slide-in animation
- **Confirmation Dialogs**: Small modal (max-w-sm) with clear action buttons
- **Sidepanel**: Right-aligned drawer for claim quick view (w-96)

### Search & Filters
- **Search Bar**: Prominent in header, icon-left input, rounded-full style
- **Filter Pills**: Multi-select chips for status/priority/department filtering
- **Advanced Filters**: Collapsible panel with date range, assignee selectors

---

## Page-Specific Layouts

### Dashboard (Role-Based)
- **Stats Row**: 3-4 metric cards (total claims, pending, overdue, avg resolution time)
- **Quick Actions**: Department-specific CTA buttons (e.g., "New Claim" for Sales)
- **Recent Claims Table**: Latest 10 claims with quick action buttons
- **Status Distribution Chart**: Donut chart showing claims by status (if analytics implemented)

### Claims List
- **Filter Bar**: Top section with search, status filter, date range
- **Table View**: Sortable columns (TCAR No, Customer, Status, Due Date, Assignee)
- **Pagination**: Bottom navigation (showing "X-Y of Z claims")
- **Bulk Actions**: Checkbox selection with batch operations (Tech/Admin only)

### Claim Detail View
- **Header Section**: TCAR number (large), status badge, created/updated timestamps
- **Info Grid**: 2-column layout (Customer Name, Symptom, Created By, Assignee, etc.)
- **Timeline Section**: Vertical timeline showing status changes with timestamps
- **Actions Section**: Corrective/Preventive action text areas (expandable)
- **Action Buttons**: Sticky footer with status transition buttons (role-dependent)

### New Claim Form (Sales)
- **Single Column Layout**: max-w-2xl centered
- **Required Fields**: Customer Name*, Defect Name* (with character count)
- **Optional Fields**: Due Date, Part Number, DC, etc.
- **Auto-generated**: TCAR number displayed after submission confirmation

---

## Interactions & States

### Animations
- **Minimal Use**: Only functional animations
- **Page Transitions**: Fade-in (200ms) for route changes
- **Loading States**: Spinner for async operations
- **NO decorative animations**: No parallax, scroll-triggered effects, or elaborate transitions

### Feedback
- **Toast Notifications**: Top-right, 4s duration (success: green, error: red, info: blue)
- **Inline Validation**: Real-time for form fields with error text below
- **Loading Indicators**: Skeleton screens for table loading, spinner for button actions
- **Empty States**: Friendly illustration + message for empty lists

### Hover & Focus
- **Table Rows**: Subtle background change on hover
- **Buttons**: Slight darken on hover, ring on focus
- **Links**: Underline on hover, primary color
- **Input Focus**: 2px ring in primary color

---

## Responsive Behavior
- **Mobile (<768px)**: Single column, hamburger nav, stacked cards, simplified table (card view)
- **Tablet (768-1024px)**: 2-column grids, sidebar collapses to icons-only
- **Desktop (>1024px)**: Full sidebar, 3-4 column grids, expanded data tables

---

## Accessibility
- **Consistent Dark Mode**: All inputs, text fields, and surfaces maintain dark theme integrity
- **Color Contrast**: WCAG AA compliant (4.5:1 for text)
- **Keyboard Navigation**: Full tab order, Enter/Space for actions
- **Screen Reader**: ARIA labels for status badges, buttons, form fields
- **Focus Indicators**: Visible focus rings on all interactive elements