# AXIS COMPASS: Master Design & Implementation Specification

**Product:** Axis Compass — Student Life Operating System  
**Tagline:** Direction. Clarity. Focus.  
**Version:** 1.0  
**Status:** Production Ready  
**Date:** 2026-07-28

---

## BRAND IDENTITY

### Logo System

**Primary mark:** Compass rose (4-point star)
- Top point: `#f5cb5c` (Tuscan Sun, 45°)
- Right point: `#242423` (Carbon Black, 135°)
- Bottom point: `#f5cb5c` (Tuscan Sun, 225°)
- Left point: `#242423` (Carbon Black, 315°)
- Outer ring: `#cfdbd5` (Alabaster Grey, 2px stroke)
- Inner center: `#f5cb5c` circle (8px diameter)

**Logo formats:**
1. Vertical stacked (logo above wordmark)
2. Horizontal (logo left, wordmark right)
3. Icon only (compass mark, 48–256px)
4. Wordmark only (AXIS)
5. Minimalist version (single stroke compass)

**Minimum size:** 48px (icon), 120px (logo + wordmark)  
**Spacing:** Clear space = half the logo width on all sides  
**Colors:** Use full-color on light backgrounds, reversed on dark backgrounds, monochrome on restricted backgrounds

**Tagline placement:** Below wordmark or secondary usage, 8px gap, font 11px, all caps, letter-spacing +0.08em, color `#333533`

### Brand Values

- **Direction:** Guides without prescribing
- **Clarity:** Removes distractions, shows what matters
- **Focus:** Helps students concentrate on what's next
- **Momentum:** Celebrates progress through visual feedback

---

## COLOR SYSTEM

### Primary Palette

```css
/* Light mode */
--tuscan-sun: #f5cb5c;           /* Primary accent, warm, optimistic */
--carbon-black: #242423;         /* Primary text, deep, readable */
--graphite: #333533;             /* Secondary text, medium contrast */
--soft-linen: #e8eddf;           /* Primary background, light */
--alabaster-grey: #cfdbd5;       /* Borders, dividers, subtle */

/* Dark mode */
--surface-dark: #1a1a19;         /* Primary background */
--surface-dark-secondary: #2d2d2c; /* Secondary background */
--text-dark: #f5f5f4;            /* Primary text */
--text-dark-secondary: #a8a8a6;  /* Secondary text */

/* Semantic colors (same in both modes) */
--success: #10b981;              /* Habits, completion, streaks */
--warning: #f59e0b;              /* Due soon, caution, amber */
--danger: #ef4444;               /* Urgent, overdue, red */
--info: #3b82f6;                 /* Informational, blue */
--focus: #f5cb5c;                /* Focus/attention (same as tuscan-sun) */
```

### Usage Rules

- **Text:** `--carbon-black` on `--soft-linen`, `--text-dark` on `--surface-dark`
- **Secondary text:** `--graphite` (light) / `--text-dark-secondary` (dark), reduced opacity
- **Backgrounds:** `--soft-linen` (light cards) / `--surface-dark` (dark)
- **Borders:** `--alabaster-grey` (light, 1px) / `rgba(207, 219, 213, 0.15)` (dark)
- **Accent:** `--tuscan-sun` universally (good contrast on both grounds)
- **Interactive states:** Use semantic colors for status, `--tuscan-sun` for focus/hover

### Dark Mode Implementation

Auto-enable based on `prefers-color-scheme: dark` media query. User can override via toggle in settings (stored in localStorage as `theme: 'dark' | 'light' | 'system'`).

Never invert colors. Swap palette systematically:
- Surface colors swap
- Text colors swap
- Accent remains `--tuscan-sun`
- Semantic colors unchanged

---

## TYPOGRAPHY

### Font Stack

**Headings & UI:**
```
font-family: "Inter", -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-weight: 500, 600, 700, 800;
```

**Data/code/numbers:**
```
font-family: "JetBrains Mono", "Courier New", monospace;
font-feature-settings: "tnum" 1;  /* tabular numbers */
```

### Type Scale

| Element | Size | Weight | Letter-spacing | Line-height | Usage |
|---------|------|--------|-----------------|-------------|-------|
| Display | 32px | 700 | -0.025em | 1.2 | Scores, big metrics |
| H1 | 24px | 700 | -0.020em | 1.2 | Page titles |
| H2 | 20px | 650 | -0.015em | 1.3 | Section headers |
| H3 | 16px | 650 | 0 | 1.3 | Card titles, widget headers |
| Body | 15px | 400 | 0 | 1.6 | Main prose |
| Small | 13px | 400 | 0 | 1.6 | Secondary info, timestamps |
| Caption | 12px | 500 | 0 | 1.5 | Metadata, labels |
| Label | 11px | 600 | +0.10em | 1.4 | UPPERCASE section labels |
| Mono | 13px | 400 | 0 | 1.5 | Weights, reps, times, dates |

**Text wrapping:** Apply `text-wrap: balance` to all headlines (H1–H3) for better typography.

---

## COMPONENT LIBRARY

### Buttons

**Primary button**
- Background: `--carbon-black`
- Text: white, 14px, 600
- Padding: 10px 16px
- Radius: 8px
- Border: none
- Hover: background → `--graphite`
- Active: background → `--tuscan-sun`, text → `--carbon-black`
- Focus: outline 2px solid `--tuscan-sun`, offset 3px
- Disabled: opacity 0.5, cursor not-allowed
- Transition: all 140ms cubic-bezier(0.2, 0, 0, 1)

**Secondary button**
- Border: 1px solid `--graphite`
- Background: transparent
- Text: `--carbon-black`, 14px, 600
- Padding: 10px 16px
- Radius: 8px
- Hover: background → `--soft-linen`
- Focus: outline 2px solid `--tuscan-sun`

**Icon button (small)**
- Size: 36px × 36px, square
- Radius: 6px
- Border: 1px solid `--alabaster-grey`
- Background: transparent
- Icon: 18px, `--carbon-black`
- Hover: background → `--soft-linen`

**Floating Action Button (FAB)**
- Size: 48px (mobile), 56px (desktop), circular
- Background: `--tuscan-sun`
- Icon: white, 24px, centered
- Shadow: `0 4px 12px rgba(245, 203, 92, 0.3)`
- Hover: box-shadow increases to `0 8px 20px rgba(245, 203, 92, 0.4)`
- Long-press (mobile): Expands into quick action menu

### Cards

**Standard card**
- Background: `--soft-linen` (light) / `--surface-dark-secondary` (dark)
- Border: 1px solid `--alabaster-grey`
- Radius: 12px
- Padding: 20px
- Shadow: `0 2px 8px rgba(36, 36, 35, 0.06)` (light) / `0 2px 8px rgba(0, 0, 0, 0.3)` (dark)
- Hover: shadow → `0 8px 16px rgba(36, 36, 35, 0.12)`, transform: translateY(-2px)
- Transition: 140ms

**Focus card (hero, on dashboard)**
- Background: Linear gradient 135deg, from `--soft-linen` to `rgba(245, 203, 92, 0.1)`
- Border: 2px solid `--tuscan-sun`
- Padding: 24px
- Radius: 12px
- Shadow: `0 4px 12px rgba(245, 203, 92, 0.15)`
- Content:
  - Label: 11px, 600, uppercase, `--tuscan-sun`, margin-bottom 8px
  - Headline: 20px, 650, `--carbon-black`
  - Metadata: 13px, 400, `--graphite`, margin 8px 0 16px
  - Button: Full width or inline

**Lightweight widget card**
- Background: transparent or `--soft-linen` at 0.3 opacity
- Border: 1px solid `--alabaster-grey`
- Padding: 16px
- Radius: 10px
- No shadow
- Used for: Habit rows, quick stats, sidebar items

### Forms

**Text input**
- Border: 1px solid `--alabaster-grey`
- Background: `--soft-linen` (light) / `--surface-dark-secondary` (dark)
- Padding: 10px 12px
- Radius: 8px
- Font: 15px, 400
- Focus: border 2px solid `--tuscan-sun`, box-shadow `0 0 0 3px rgba(245, 203, 92, 0.1)`
- Placeholder: `--graphite` at 0.5 opacity
- Error state: left border 2px `--danger`, background tint `rgba(239, 68, 68, 0.05)`

**Label**
- Font: 11px, 600, uppercase, letter-spacing +0.10em
- Color: `--graphite`
- Margin-bottom: 6px
- Required indicator: red asterisk after label

**Checkbox**
- Size: 18px × 18px
- Border: 2px solid `--alabaster-grey`
- Radius: 4px
- Checked: background `--success`, border `--success`, checkmark white, 12px
- Hover: border → `--graphite`
- Focus: outline 2px solid `--tuscan-sun`

**Toggle/switch**
- Height: 24px, width: 44px
- Background: `--alabaster-grey`
- Radius: 999px
- Thumb: white circle, shadow `0 1px 3px rgba(0,0,0,0.1)`
- Checked: background `--success`, thumb slides right
- Transition: 140ms

**Date/Time picker**
- Calendar grid: 7 columns (Sun–Sat)
- Today cell: background `--tuscan-sun` at 0.2 opacity, border 1px solid `--tuscan-sun`
- Selected: background `--tuscan-sun`, text white
- Disabled: opacity 0.3
- Time inputs: Monospace, spinner buttons for hour/minute

### Progress Indicators

**Progress ring**
- SVG circle, 60px diameter
- Stroke: 4px, `--tuscan-sun`
- Background ring: same stroke, opacity 0.15
- Center: Percentage text (32px, 700, display font) or remaining value
- Animation on completion: Fill from 0% to 100% over 600ms, ease-out
- Respects `prefers-reduced-motion`: Instant fill instead of animated

**Progress bar**
- Height: 8px
- Background: `--alabaster-grey`
- Fill: `--tuscan-sun` (primary), `--success` (habits)
- Radius: 4px
- Transition: width 300ms ease-out
- Examples: Study readiness 62%, water intake 1.25/3L

**Chart (activity graphs)**
- Library: Recharts
- Bars: `--carbon-black`, opacity 0.7
- Every 3rd bar: opacity 1.0
- Axis: Hidden
- Tooltip: Background `--soft-linen`, text `--carbon-black`, border 1px `--tuscan-sun`
- Grid: None
- ResponsiveContainer: width "100%", height 120px (mobile) / 200px (desktop)

**Heatmap (habit calendar)**
- Grid: 7 columns (Sun–Sat), 52 rows (week of year)
- Cell: 20px × 20px, radius 3px
- States:
  - Not completed: `--alabaster-grey`, 20% opacity
  - Completed: `--success`, 100% opacity
  - Partial (weekly): `--warning`, 70% opacity
- Today: Outline 2px `--tuscan-sun`
- Hover: Outline 1px `--graphite`, slight scale (1.05x)
- Tooltip: Day, date, streak count

**Table (gym logs, chapters)**
- Header row: Background `--graphite`, text white, font 12px label
- Body rows: Border-bottom 1px `--alabaster-grey`, padding 11px 15px
- Numbers: Monospace, tabular-nums enabled
- Hover row: Background `--soft-linen` (light) / `--surface-dark` (dark)
- Striping: Off (no alternating backgrounds)
- Responsive: Below 768px, convert to stacked cards (each row becomes a card)

**Status badge/pill**
- Padding: 4px 8px
- Radius: 6px
- Font: 11px, 600, uppercase
- Styles:
  - Success: background `--success`, text white
  - Warning: background `--warning`, text white
  - Danger: background `--danger`, text white
  - Neutral: background `--alabaster-grey`, text `--graphite`
  - Info: background `--info`, text white

### Navigation

**Desktop sidebar**
- Width: 240px (expanded), 60px (collapsed)
- Background: `--soft-linen` (light) / `--surface-dark` (dark)
- Border-right: 1px solid `--alabaster-grey`
- Position: Fixed, left 0, top 0, height 100vh
- Padding: 20px 16px
- Z-index: 1000

**Sidebar items**
- Spacing: 8–12px vertical between items
- Font: 14px, 400
- Padding: 8px 12px
- Radius: 8px
- Icon + label layout: flex, gap 12px

**Nav item (inactive)**
- Color: `--graphite`
- Icon: 20px, stroke-only SVG, 2px weight, `--graphite`
- Hover: background → `--soft-linen` (light) / `rgba(255,255,255,0.05)` (dark), color → `--tuscan-sun`

**Nav item (active)**
- Background: `--carbon-black`
- Text: white, font-weight 600
- Icon: white stroke
- Indicator: Left border 3px `--tuscan-sun` on active item

**Mobile bottom tab bar**
- Position: Fixed, bottom 0, left 0, right 0
- Height: 60px
- Background: `--soft-linen` (light) / `--surface-dark` (dark)
- Border-top: 1px solid `--alabaster-grey`
- Layout: Grid, 5 columns (Dashboard, Tasks, Calendar, Study, Health)
- Z-index: 999 (below FAB)

**Tab item (inactive)**
- Display: flex, flex-direction column, align-items center, justify-content center
- Icon: 20px, stroke-only SVG
- Label: 10px, 400, color `--graphite`
- Padding: 8px 4px
- Tap target: Full column width (60px+)

**Tab item (active)**
- Icon + label: color → `--tuscan-sun`
- Label font-weight: 600
- Background: Light tint of `--tuscan-sun` (0.05 opacity)
- Underline: 2px solid `--tuscan-sun` (top of item)

### Modals & Sheets

**Modal (desktop)**
- Position: Centered, fixed
- Background overlay: `rgba(36, 36, 35, 0.5)` (light) / `rgba(0, 0, 0, 0.6)` (dark)
- Modal window: `--soft-linen` / `--surface-dark-secondary`, radius 12px
- Shadow: `0 20px 40px rgba(36, 36, 35, 0.3)` (light) / `0 20px 40px rgba(0, 0, 0, 0.5)` (dark)
- Max-width: 480px
- Padding: 24px
- Slide-in animation: 200ms cubic-bezier(0.2, 0, 0, 1), from bottom at 10%

**Sheet (mobile)**
- Position: Fixed, bottom 0, left 0, right 0
- Background: `--soft-linen` / `--surface-dark-secondary`
- Radius: 20px 20px 0 0
- Drag handle: 40px bar at top with 4px × 28px rounded handle, `--alabaster-grey`
- Max-height: 90vh
- Slide-up animation: 200ms cubic-bezier(0.2, 0, 0, 1)
- Dismiss: Drag down past threshold (40px) or tap outside

**Modal header**
- Font: 20px, 650
- Margin-bottom: 16px
- Close button: Top-right, 36px × 36px icon button

**Modal footer**
- Sticky if content scrolls
- Border-top: 1px solid `--alabaster-grey`
- Padding: 16px 24px
- Button layout: Flex, gap 8px, primary action right

### States & Feedback

**Disabled state**
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

**Loading state**
- Skeleton: Placeholder matching final layout exactly
- Background: `--alabaster-grey`, 40% opacity (light) / `rgba(207, 219, 213, 0.15)` (dark)
- Pulse animation: Opacity 0.5 to 1.0, repeat every 1200ms
- Never show spinner in favor of skeleton

**Error state (inline)**
- Field border: 2px `--danger`
- Field background: Tint `rgba(239, 68, 68, 0.05)`
- Error message: 12px, 400, `--danger`, below field, 6px gap
- Specific text: "Due date must be in future" not "Invalid"

**Error state (card level)**
- Card border: 2px `--danger`
- Retry button: Primary style, visible
- Error message: At top of card

**Empty state**
- Icon: 48px, stroke-only SVG, `--graphite`
- Title: 16px, 600, `--carbon-black`
- Description: 14px, 400, `--graphite`, max-width 60 characters
- CTA: Single button or "Create" link
- Centered, padding: 40px

**Success feedback**
- Toast (top-right, 8px from edge)
- Background: `--success`, text white
- Padding: 12px 16px
- Radius: 8px
- Icon: Checkmark
- Auto-dismiss: 4 seconds
- Slide-in animation: 200ms from right

**Undo toast**
- Background: `--carbon-black`
- Text: white
- Action button: `--tuscan-sun` text
- Duration: 5 seconds, closes on action or timeout

### Motion & Interactions

**Timing & easing**
- Buttons, toggles, simple state: 140ms cubic-bezier(0.2, 0, 0, 1)
- Modals, sheets, navigation: 200ms cubic-bezier(0.2, 0, 0, 1)
- Page transitions: 0ms (instant)
- Page load: No fade-in (instant)

**Micro-interactions**
- Checkbox tick: Fill stroke animation 140ms + optional haptic feedback (iOS)
- Habit completion: Color change 140ms + subtle scale pulse (0.95 to 1.0)
- Set logged in gym: Set row color shifts to `--success` 140ms, then rest timer starts
- Habit streak milestone (10/30/100 days): Ring animation (0 to 100% fill) over 600ms + scale pulse (1.0 to 1.15 and back)
- Focus session start: Timer slides up 200ms, background overlay fades in
- Water logged: Ring updates 300ms, number changes with counter animation

**Respect `prefers-reduced-motion`**
- When set, disable all animations/transitions
- Use instant state changes instead
- Keep interactive feedback (color, borders, icons)
- No pulse animations, no scale transforms

---

## SCREENS & LAYOUTS

### DASHBOARD (Home)

**Desktop layout:**
```
[Sidebar 240px] [Main content 1fr]
```

**Main content:**
1. Header bar (sticky): Greeting "Good morning, Shaurya | Tuesday 28 July" + quick actions (search, assistant, alerts)
2. Focus card: Hero element, full width, 24px margin-bottom
3. Widget grid: 3 columns, auto-fit, minimum 240px

**Widgets (in default order):**
| Widget | Width | Content | Priority |
|--------|-------|---------|----------|
| Today's tasks | 2/3 | List of 3 tasks, add button, "Clear. Add one?" if empty | P0 |
| Habits | 1/3 | Checkboxes, streak counters, "No habits yet?" if empty | P0 |
| Exams | 1/3 | Next 2 exams, days remaining, warning if <7 days | P1 |
| Study | 1/3 | Hours logged today, weekly sparkline, "0h logged?" if empty | P1 |
| Water | 1/3 | Progress ring, current/goal intake, +250/+500 buttons | P1 |
| Workout | 1/3 | Today's workout name, status, "Start session" button | P1 |
| Scores | 1/3 | Three numbers (Productivity, Study, Health) with small bars | P2 |

**Mobile dashboard:**
- Single column, full width
- Focus card first, 100% width
- Widgets stack vertically
- Tab bar fixed bottom 60px

**Focus card content:**
- Label: "Next priority" (11px label style)
- Headline: Next task/exam/study goal (20px, 650)
- Metadata: Context (e.g., "Exam in 9 days, chapter not started, 0h logged") (13px, 400, graphite)
- Button: "Start 25-min focus" or "Begin" (primary style, full width on mobile)

### TASKS / PRODUCTIVITY

**Task list view**
- View toggle: List / Board / Timeline (segment control at top)
- Each task item:
  - Checkbox (left)
  - Task name (flex: 1)
  - Time/due (right, monospace 12px)
  - Priority dot (if high/urgent, 4px circle, top-right)
  - Border-bottom: 1px `--alabaster-grey`
- Hover: Background → `--soft-linen`
- Click anywhere: Opens detail panel (slide from right, 200ms)

**Task detail panel**
- Width: 380px (desktop), 100% (mobile)
- Header: Task name + close button
- Scrollable body with fields:
  - Description: Rich text editor (headings, bold, italic, lists, links, images)
  - Due date: Date picker button
  - Due time: Time picker button
  - Priority: 4-level dropdown (Low/Medium/High/Urgent)
  - Tags: Multi-select, create new inline
  - Subtasks: Checklist with add/remove
  - Attachments: Drop zone + upload button
- Footer: Delete button (red, destructive confirmation)
- Save: On blur for most fields, explicit save for complex changes

**Task board view (Kanban)**
- 3 columns: Not started / In progress / Completed
- Cards: Draggable between columns
- Drag target: Show drop zone highlight
- Animation: Smooth card reorder 200ms

**Task timeline view**
- Month calendar grid (Fullcalendar style)
- Each cell: Day number (top-left) + task bars
- Task bar: 2px left border colored by status
- Today: Background `--soft-linen`
- Click cell or bar: Open task detail panel

### HABITS

**Habit row (dashboard widget)**
- Checkbox (left)
- Habit name (flex: 1)
- Frequency label (12px, `--graphite`)
- Streak counter (right, "12 🔥")
- Click checkbox: Toggles completed state
- Completed state: Checkbox filled `--success`, name text dims

**Habits page**
- Scrollable list of all habits
- Each habit expandable to show:
  - Frequency selector
  - Reminder time picker
  - Current streak + best streak
  - 52-week heatmap

**Habit heatmap (52-week calendar)**
- Grid: 7 columns (Sun–Sat), 52 rows (weeks of year)
- Each cell: 20px × 20px, radius 3px
- Color states:
  - Not completed: `--alabaster-grey`, 20% opacity
  - Completed: `--success`, 100% opacity
  - Partial: `--warning`, 70% opacity
  - Today: Outline 2px `--tuscan-sun`
- Hover: Outline 1px `--graphite`, tooltip shows date + streak

**Completion history**
- Last 30 days as list
- Format: "Jul 28 (Mon) - Completed" or "Jul 27 (Sun) - Skipped"
- Color coded: success/danger

### CALENDAR

**Calendar header buttons:** Day / Week / Month / Agenda (segment control)

**Month view**
- Grid: 7 columns (Sun–Sat), 6 rows
- Day cell: 80px height, date number top-left (12px, 600)
- Event bars: Inside cell, 2px left border colored by type
- Event bar colors:
  - Tasks: `--carbon-black`
  - Habits: `--success`
  - Exams: `--danger`
  - Workouts: `--info`
  - Birthdays: `--warning`
  - Study sessions: `--tuscan-sun`
- Today cell: Background `--soft-linen`, border 2px `--tuscan-sun`
- Hover: Event bar shows title on hover
- Click event: Opens detail panel

**Week view**
- Left column: Time labels (8am–8pm, hourly)
- 7 grid columns (Sun–Sat)
- Events: Colored blocks spanning multiple hours
- Drag event: Shadow appears, target cell highlights, snap to hour
- Double-click: Opens detail panel
- Hover: Tooltip shows event name

**Agenda view**
- Vertical list of upcoming events
- Sections: Today / This Week / Later
- Each item: Date (monospace), time, title, category badge
- Hover: Subtle background highlight
- Click: Opens detail panel

**Event detail panel**
- Title + type badge
- Date/time picker
- Description (text area)
- Category selector
- Delete button
- Save/Cancel buttons

### STUDY / SUBJECTS

**Subjects list**
- Card per subject
- Content:
  - Name (20px, 650)
  - Readiness % (32px, 700, display font)
  - Days until exam (13px)
  - Top chapters needing work
- Hover: Card lifts, shadow increases
- Click: Opens subject detail

**Subject detail page**
- Header: Subject name + readiness %
- Hero section: 
  - Readiness bar (62%)
  - Exam countdown (9 days)
  - Hours logged (14h)
  - Mastered chapters (4 of 11)
- Tabs: Syllabus / Notes / Revision / Hours
- Syllabus tree:
  - Collapsible chapters
  - Status dot per chapter (not started/learning/revised/mastered)
  - Hours logged
  - Options menu (mark status, start focus on chapter)
- Notes section:
  - Heading "Notes" with count
  - List of linked notes
  - "Link new note" action
- Revision section:
  - Last revision date
  - Next due date
  - Recommended frequency
  - "Start revision session" button

**Chapter status indicators**
- Not started: `--graphite` dot
- Learning: `--info` dot
- Revised: `--warning` dot
- Mastered: `--success` dot

### NOTES

**Notes list page**
- Left sidebar (240px): Folder tree with item counts
  - iCloud section (collapsible)
  - Favorites section
  - Tags section
- Main area:
  - Search bar at top
  - View toggle: Grid / List
  - Notes grid or list view

**Note card**
- Title (16px, 650)
- Timestamp (12px, `--graphite`)
- Preview snippet (13px, max 2 lines)
- Tags as pills below
- Hover: Subtle lift
- Click: Opens note editor full-page

**Note editor**
- Breadcrumb navigation
- Toolbar: Heading dropdown, bold/italic, bullets/numbers, link, image, code, quote
- Rich text area: Auto-save every 3 seconds to IndexedDB
- Right sidebar:
  - Chapter binding (dropdown)
  - Tags (multi-select)
  - Attachments (drag-drop or upload)

**Supported blocks**
- Headings (H1, H2, H3)
- Paragraph
- Bullet/numbered/checkbox lists
- Code block (with language selector)
- Quote
- Image (with optional caption)
- Table
- Divider
- Link (preview card style)

### GYM TRACKER

**Workouts list (mobile & desktop)**
- Card per workout
- Content:
  - Day + workout name (20px, 650)
  - Muscle groups (13px, `--graphite`)
  - Exercise count
  - Status: Completed (✓ green), Scheduled (clock), Skipped
- Tap/click: Opens session screen

**Gym session screen (mobile-first design)**
- Header:
  - Back button + workout name
  - Timer (monospace, 00:00:00, 32px)
- Exercise card:
  - Name (20px, 650)
  - "N of X sets" (13px, `--graphite`)
- Set table (mobile: cards, desktop: table):
  - Columns: Set #, Weight (monospace), Reps (monospace), Status
  - Current row: Background light `--tuscan-sun`
  - Completed row: Opacity 0.6
  - Hover: Background highlight
- Spinners (below table):
  - Minus Weight Plus (spinners)
  - Minus Reps Plus (spinners)
- "Log set" button: Primary style, full width, fills `--success` on tap
- Rest timer: Monospace, shows countdown, auto-starts after set logged
- Volume display: Monospace, small, bottom right

**Recovery & PRs**
- Personal record card:
  - Exercise name
  - Max weight
  - Date (monospace)
  - Badge: "New PR" if recent
- Muscle group recovery map:
  - Grid of muscle groups
  - Each: Days since last work (number)
  - Color: Green (recovered) to red (fatigued)
  - Heatmap style

**Progress photos**
- Gallery: Timeline view, newest to oldest
- Each photo: Thumbnail, date (monospace)
- Tap: Lightbox full screen
- Comparison: Slider toggle between two photos
- Add photo: Camera button or gallery upload

### WATER TRACKER

**Quick log (dashboard widget)**
- Progress ring: Current / Goal (13px monospace)
- Quick buttons: +250ml / +500ml / +Custom
- Tap: Instant update
- Haptic feedback on mobile

**Water detail page**
- Large ring at top: Current / Goal
- 7-day bar chart: Daily totals
- Quick log buttons
- History list: Timestamps (monospace) + amounts
- Goal editor: Current goal + adjustment spinners

### SKINCARE TRACKER

**Routine card (dashboard widget)**
- AM routine: 3 steps (facewash, moisturizer, sunscreen)
- PM routine: 3 steps (facewash, treatment, cream)
- Each step: Empty circle (not done) / filled circle (done)
- Tap row: Toggles entire routine OR expands to individual steps

**Skincare detail page**
- Routine builder: Add/remove/reorder steps
- Completion calendar: 30-day grid, colored by completion
- Streak display: Current + longest
- Acne tracker (optional):
  - Photo upload: Camera capture or gallery
  - Photo timeline: Reverse chronological
  - Comparison view: Ghost overlay of previous photo
  - AI analysis (if integrated): Severity score, type, trend
  - Disclaimer: "For educational purposes only. Consult a dermatologist."

### PROFILE / ANALYTICS

**Overview tab**
- Three score cards:
  - Productivity: X% (formula on tap)
  - Study: X% (formula on tap)
  - Health: X% (formula on tap)
- XP total: Large number, recent gains (+150 XP this week)
- Streak wall: Grid of habit name + current streak number

**Statistics tab**
- Cards showing:
  - Study hours (this week / this month / total)
  - Focus sessions (count + total time)
  - Workout volume (total weight moved)
  - Water consistency (days goal met / 30)
  - Habit completion (% this week)
  - Skincare completion (% this month)
- Each card: Number + sparkline (7-day trend)

**Achievements tab**
- Grid of achievement badges
- Each badge:
  - Icon (SVG)
  - Badge name
  - Date earned (monospace)
  - Progress ring (if multi-tier)
- Example achievements:
  - First task, 10 tasks, 100 tasks
  - 7-day streak, 30-day streak, 100-day streak
  - 100 focus hours, 1000 focus minutes
  - First PR
  - Hydration master (30 days goal met)
  - Skincare champion (60 days complete)

**Settings tab**
- Theme toggle: Light / Dark / System
- Daily goals: Study hours, focus time, water intake, workouts
- Notifications: Toggles per type (tasks, habits, exams, workouts, water, skincare)
- Data export: Download as JSON
- Account: Sign out, delete account

---

## MOBILE DESIGN (NOT A SHRINK-DOWN)

### Principles

- One-handed operation for all logging
- Fastest capture possible (under 3 seconds)
- Progressive disclosure (secondary fields hidden by default)
- Haptic feedback on meaningful interactions
- Prefilled data from previous sessions

### Mobile patterns

**Quick capture (FAB)**
- Position: Bottom-right, 12px from edge
- Tap: Modal sheet slides up from bottom
- Content:
  - Single text input, full width
  - Keyboard auto-focuses
  - Placeholder: "Physics ch4 hw fri 6pm high"
  - Parsing: Chips below showing parsed values
- Flow:
  1. Type complete sentence
  2. Chips appear: Task type, date, subject, priority
  3. Edit any chip by tapping
  4. Press Enter or tap Save
- Time: 3 seconds maximum

**Habit completion**
- Dashboard: Swipe right on habit row
- Haptic feedback (tap)
- Undo toast appears for 5 seconds
- Streak counter updates immediately

**Water logging**
- Dashboard widget or lock-screen action
- Tap +250/+500/+Custom
- Ring updates instantly (optimistic)
- No modal, no confirmation
- Toast confirms: "Logged 250ml"

**Gym session**
- Session screen: Full screen
- Set table: Stacked cards on mobile
- Spinners for weight/reps
- "Log set" button fills `--success` on tap
- Rest timer auto-starts, no modal
- Swipe down to close

**Notes**
- Quick note modal (bottom sheet)
- Title field + rich editor
- Auto-save every 3 seconds
- Checkbox to link to study chapter

### Responsive breakpoints

- **Mobile:** <768px
  - Bottom tab bar (5 items)
  - Single column layouts
  - Full-width cards
  - Modals as bottom sheets
- **Tablet:** 768px–1023px
  - Sidebar collapses to icon rail (60px)
  - Expands on hover
  - 2-column grids
  - Modals as centered dialogs
- **Desktop:** ≥1024px
  - Full 240px sidebar
  - 3-column grids
  - Centered modals
  - Hover states active

---

## DARK MODE

**Activation:**
- Auto-detect: `prefers-color-scheme: dark` media query
- Manual override: Settings toggle, stores in localStorage as `theme: 'dark' | 'light' | 'system'`

**Dark mode palette:**
```css
--surface-dark: #1a1a19;
--surface-dark-secondary: #2d2d2c;
--text-dark: #f5f5f4;
--text-dark-secondary: #a8a8a6;
```

**Rules:**
- Swap surface colors (light ↔ dark)
- Swap text colors (black ↔ light)
- Accent `--tuscan-sun` unchanged (good contrast on both)
- Borders: `rgba(207, 219, 213, 0.15)` (alabaster with opacity)
- Shadows: Darker base, higher opacity
- No color inversion; all hues preserved

---

## ICONS

### Icon system

**Style:** Stroke-only, no fill, 2px stroke weight  
**Corners:** Rounded caps (stroke-linecap: round) and joins (stroke-linejoin: round)  
**Grid:** All icons on 24×24 base  
**Sizes:** 16px (labels), 20px (default), 24px (headers)  
**Color:** Inherit from parent element

**Icon set (minimal, all required):**
- Navigation: Home, checkmark, calendar, book, heart
- Actions: Plus, settings, search, bell, share, more (three dots)
- Status: Clock, checkmark (can be filled), circle (can be filled), alert, lock
- Utilities: Collapse, expand, close, back, menu
- Data: Flame (streaks), ring (progress), bar (chart), user, eye
- Gym: Dumbbell, muscle group outlines

---

## OFFLINE & SYNC

**Local storage:**
- IndexedDB (web), SQLite (mobile)
- All tables replicate to local: tasks, habits, notes, exams, workouts, etc.
- Outbox table: `{ id, table, action, data, timestamp }`

**Sync flow:**
1. User creates/updates/deletes → written to local + outbox
2. UI shows optimistic update immediately
3. Background sync attempts upload
4. Conflict: Last-write-wins by timestamp
5. User notified if remote differs

**Sync indicator (sidebar footer):**
- Dot + status text
- States:
  - "Syncing…" (spinner)
  - "Synced" (green dot)
  - "3 pending" (orange dot)
  - "Offline" (grey dot)
- Tap to expand details: Which tables pending, manual retry button

---

## ACCESSIBILITY (WCAG 2.1 AA)

### Text contrast
- Body text on background: 4.5:1 minimum
- Interactive elements: 3:1 minimum
- All text passes in both light and dark modes

### Keyboard navigation
- Tab: Move forward
- Shift+Tab: Move backward
- Enter: Activate button
- Space: Toggle checkbox/toggle
- Arrow keys: Navigate lists, grid, date picker
- Escape: Close modal/sheet
- All interactive elements focusable with visible outline

### Screen readers
- Semantic HTML (button, input, label elements)
- ARIA labels on icon buttons ("Search", "Settings")
- Form labels properly associated
- Status updates announced (habit completed, set logged)

### Color accessibility
- Status never encoded by color alone
- Icons + color + text work together
- Tested with color-blindness simulator (protanopia, deuteranopia, tritanopia)

### Motion
- Respect `prefers-reduced-motion: reduce`
- When set, disable all animations/transitions
- Use instant state changes
- Keep interactive feedback (color, borders, icons) present

### Touch targets
- Minimum 44px × 44px (mobile)
- Minimum 36px × 36px (desktop)
- Adequate spacing between targets

---

## PERFORMANCE TARGETS

- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s
- **Lighthouse score:** >90
- **Mobile Lighthouse:** >85

**Optimizations:**
- Skeleton loaders matching final layout (no layout shift)
- Optimistic mutations (updates show immediately)
- Code splitting per route (Productivity, Calendar, Study, Health separate)
- Image compression: Max 1200px width, modern formats (WebP with fallback)
- No third-party analytics scripts (use Plausible if needed)
- IndexedDB for offline storage (no service worker needed for MVP)

---

## ERROR HANDLING & DATA VALIDATION

**Client-side validation:**
- Real-time feedback on input blur
- Red border on error
- Specific messages: "Due date must be in future" not "Invalid"
- Prevent form submission if required fields empty

**Server-side validation:**
- Re-validate all input (never trust client)
- Rate limiting: Max 100 mutations per user per minute
- Soft delete: Mark deleted, purge after 30 days

**Error UX:**
- Inline field error: 2px red left border, background tint `rgba(239, 68, 68, 0.05)`
- Card-level error: 2px red border, retry button visible
- Offline: Clear message "Changes saved locally, will sync when online"
- Server error: Toast "Something went wrong. Retrying…" + manual retry button

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundations (Week 1)
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Tailwind CSS with design tokens
- [ ] Implement color system (light/dark mode)
- [ ] Build base components: Button, Input, Card, Container

### Phase 2: Navigation & Layout (Week 2)
- [ ] Desktop sidebar navigation
- [ ] Mobile bottom tab bar
- [ ] Responsive grid system
- [ ] Modal/sheet components

### Phase 3: Dashboard (Week 3)
- [ ] Dashboard layout
- [ ] Focus card component
- [ ] Widget grid with reorderable items
- [ ] All 7 dashboard widgets

### Phase 4: Core Features (Weeks 4–6)
- [ ] Quick capture (FAB + modal)
- [ ] Tasks (list, board, detail panel)
- [ ] Habits (heatmap, streaks)
- [ ] Calendar (month, week, agenda)
- [ ] Study (subjects, chapters, readiness)

### Phase 5: Health & Tracking (Week 7)
- [ ] Gym session logging
- [ ] Water tracker
- [ ] Skincare routines
- [ ] Progress photos

### Phase 6: Analytics & Polish (Week 8)
- [ ] Profile with scores and achievements
- [ ] Statistics dashboard
- [ ] Micro-interactions (haptics, animations)
- [ ] Error states, empty states, loading states

### Phase 7: Optimization (Week 9)
- [ ] Performance audit
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile testing on real devices
- [ ] Dark mode refinement

---

## FINAL CHECKLIST

Before shipping, verify:

- [ ] Logo applied to all branded surfaces (header, favicon, app icon, login screen)
- [ ] Color palette consistent across all screens (use CSS variables, never hardcoded)
- [ ] Typography scale applied (no arbitrary sizes, use scale only)
- [ ] Dark mode functional (toggle works, no color inversion)
- [ ] Mobile layouts tested on real phones (<768px, 768–1023px, ≥1024px)
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Space, Escape)
- [ ] Focus states visible (2px outline)
- [ ] Contrast ratios verified (4.5:1 body, 3:1 interactive)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Touch targets minimum 44px (mobile), 36px (desktop)
- [ ] Offline mode works (all mutations queue locally)
- [ ] Sync flow tested (connectivity loss, recovery)
- [ ] All error messages specific ("Due date must be in future" not "Error")
- [ ] Haptic feedback on mobile (tap on set logged, habit completed, etc.)
- [ ] Lighthouse score >90 (desktop), >85 (mobile)
- [ ] No console errors or warnings
- [ ] Security: All user input sanitized, no SQL injection, XSS, CSRF

---

**Design approved:** [Approval date]  
**Approved by:** [Name]  
**Status:** Ready for implementation  

Developers: Use this specification as a living document. Update if clarifications needed, but maintain consistency with the core palette, typography, and component contracts.
