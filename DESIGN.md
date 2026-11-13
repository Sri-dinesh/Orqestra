---
name: Orqestra
description: Intelligent Academic Timetable Generator & Operational Schedule Workstation.
colors:
  shell: "#f6f7f8"
  surface: "#ffffff"
  ink: "#121417"
  ink-muted: "#5b616b"
  hairline: "#e1e4e8"
  rail: "#d3d7dd"
  wash: "#eef0f2"
  primary: "#3b6fe0"
  primary-hover: "#2e5ccb"
  primary-soft: "#e8effc"
  primary-ink: "#ffffff"
  destructive: "#c92a2a"
  lane-0: "#d9480f"
  lane-1: "#2f9e44"
  lane-2: "#9c36b5"
  lane-3: "#0c8599"
  lane-4: "#c2255c"
  lane-5: "#b7791f"
  shell-dark: "#111112"
  surface-dark: "#18181a"
  popover-dark: "#1f1f22"
  ink-dark: "#ececec"
  ink-muted-dark: "#a1a1a6"
  hairline-dark: "#2a2a2d"
  rail-dark: "#36363a"
  wash-dark: "#232326"
  primary-dark: "#7aa2f7"
  primary-hover-dark: "#94b5f9"
  primary-soft-dark: "#18233a"
  destructive-dark: "#ff6b6b"
  lane-0-dark: "#ff8a4c"
  lane-1-dark: "#51cf66"
  lane-2-dark: "#da77f2"
  lane-3-dark: "#3bc9db"
  lane-4-dark: "#f06595"
  lane-5-dark: "#fcc419"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 12vw, 6rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "-0.025em"
  composer:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "'ss01', 'cv11'"
  nav:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  small:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "'tnum'"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  row-y: "12px"
  gutter: "16px"
  gutter-wide: "24px"
  rail: "44px"
  rail-wide: "56px"
  feed-column: "620px"
  nav-column: "256px"
  aside-column: "320px"
  shell-max: "1264px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.small}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.wash}"
  button-ghost-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  nav-item:
    textColor: "{colors.ink-muted}"
    typography: "{typography.nav}"
    rounded: "{rounded.lg}"
    padding: "12px"
  nav-item-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  nav-item-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
  page-tab:
    textColor: "{colors.ink-muted}"
    typography: "{typography.nav}"
    padding: "14px 0"
  page-tab-active:
    textColor: "{colors.ink}"
  entry-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "12px 16px 12px 0"
  graph-node:
    backgroundColor: "{colors.lane-0}"
    rounded: "{rounded.full}"
    size: "14px"
  avatar:
    backgroundColor: "{colors.wash}"
    rounded: "{rounded.full}"
    size: "40px"
---

# Design System: Orqestra Workstation

## Overview

**Creative North Star: "The Structured Operational Rail"**

Every entry is an operational event and the workspace timeline is the structured log. The system draws a clean vertical rail down the edge of structured activity: a continuous hairline rail, one ringed node per entry, the segment below each node tinted by its entity or author lane. Everything else stays out of the way so the data reads with absolute clarity. The topology is a disciplined three-column layout (navigation, a 620px primary workspace/feed column, and a 320px operational aside), stripped of arbitrary decorative chrome: no frivolous cards, no bloated trend modules, no pill-shaped blue clutter. The primary action verb is driven by one working blue (**Primary Blue**, `#3b6fe0`), with mono counts and status labels.

The register is a well-lit precision instrument rather than a playful portal or dark cosplay. A cool near-white shell (`#f6f7f8`) holds a clean white surface column (`#ffffff`) cut by hairline cool-gray rules (`#e1e4e8`); ink is near-black (`#121417`). **Geist** carries prose, labels, and human descriptions; **Geist Mono** carries everything computed or machine-printed: identifiers, short codes, timestamps, interval times, counts, capacities, error codes, and `null` values. Dark mode is a faithful mirror on graphite (`#111112` and `#18181a`), with lanes and primary lifted for luminance rather than redesigned.

Color is strictly rationed. Six author/entity lane colors exist only inside the rail graph and its direct echoes (profile ring, entity badge dot). One blue does the work of action and location: the primary button, the current navigation item, the active tab underline, and text links. Motion is purposeful: a node pops onto the rail when an entry is created or scheduled, rail segments draw downward smoothly, and a deleted entry prints a concise mono removal status before its row collapses. Navigation only moves to say where you went: pages crossfade in 160ms, the Blue Wash behind the current navigation item and the active tab underline slide to their new place, and switching tabs slides the content smoothly toward the selected tab while the header stays put.

**Key Characteristics:**
- A vertical graph rail with lane-colored nodes and segments is the signature and only structural device.
- Lane color is identity; blue is action. They never trade jobs.
- Flat surfaces separated by hairlines (`#e1e4e8`), not floating cards or drop shadows.
- Mono for machine output, sans for human prose, both from the Geist family.
- Dry, literal copy; empty and terminal states speak in concise, machine precision.

---

## Colors

A cool, nearly colorless shell with one working blue and six entity lanes reserved for structural identity.

### Primary
- **Primary Blue** (Light `primary: #3b6fe0`, Dark `primary-dark: #7aa2f7`): the primary button ("Generate", "Save Changes", "Add Department", "Export PDF"), active links, focus rings, caret color, the active tab underline, and the active nav item's text.
- **Pressed Primary Blue** (`primary-hover: #2e5ccb`, Dark: `#94b5f9`): hover and active state of the primary button only.
- **Blue Wash** (`primary-soft: #e8effc`, Dark: `#18233a`): fill behind the active navigation item (the side navigation item and the bottom bar's rounded icon background) and the selected option of settings switches; also the text selection highlight.

### Secondary
- **Entity & Author Lanes** (`lane-0` through `lane-5`, each with a `-dark` lift):
  - `lane-0: #d9480f` / Dark: `#ff8a4c` (Warm Amber / Department 0)
  - `lane-1: #2f9e44` / Dark: `#51cf66` (Forest Green / Department 1)
  - `lane-2: #9c36b5` / Dark: `#da77f2` (Royal Violet / Department 2)
  - `lane-3: #0c8599` / Dark: `#3bc9db` (Deep Teal / Department 3)
  - `lane-4: #c2255c` / Dark: `#f06595` (Rich Rose / Department 4)
  - `lane-5: #b7791f` / Dark: `#fcc419` (Antique Ochre / Department 5)
  Used only for graph nodes, rail segments, the staged input node, the 8px dot before an identifier, and the 2px ring around a profile avatar. Never text, never fills behind text, never buttons.

### Tertiary
- **Destructive Red** (`destructive: #c92a2a`, Dark: `#ff6b6b`): delete affordances (trash icon on hover, inline confirm wash at 8% opacity, destructive button), constraint alerts, warning counters at 0.

### Neutral
- **Cool Shell** (`shell: #f6f7f8`, Dark: `#111112`): page background around the workspace column and side columns; also the hole punched in each node.
- **Surface White** (`surface: #ffffff`, Dark: `#18181a`): the primary column, sticky page headers, cards, and modal sheets.
- **Near-Black Ink** (`ink: #121417`, Dark: `#ececec`): all primary text.
- **Muted Ink** (`ink-muted: #5b616b`, Dark: `#a1a1a6`): identifiers, times, hashes, secondary copy, inactive nav and tabs, the rail terminator line.
- **Hairline** (`hairline: #e1e4e8`, Dark: `#2a2a2d`): every divider; column borders, row separators, tab bar, aside section rules.
- **Rail Gray** (`rail: #d3d7dd`, Dark: `#36363a`): the rail segment above the first entry, the staged input's dashed tail, aside list bullets, scrollbar thumb, and input strokes.
- **Hover Wash** (`wash: #eef0f2`, Dark: `#232326`): hover background for nav items, tabs, ghost and outline buttons; avatar placeholder.

### Named Rules
**The Lanes Are Identity Rule.** A lane color appears only where it marks an entity or author inside or beside the rail graph. If a lane color is carrying meaning that isn't identity, it is wrong.

**The One Blue Rule.** Blue means "you can act here" or "you are here". It is never decorative and never assigned to an entity lane.

---

## Typography

**Display Font:** Geist (`Geist, ui-sans-serif, system-ui, sans-serif`)  
**Body Font:** Geist (`Geist, ui-sans-serif, system-ui, sans-serif`), stylistic sets `ss01` and `cv11` enabled  
**Label/Mono Font:** Geist Mono (`Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`), tabular numerals (`tnum`)

**Character:** One family, two voices. The sans speaks for people; the mono speaks for the machine. Both are self-hosted (Geist 400/500/600/700, Geist Mono 400/500).

### Hierarchy
- **Display** (600, `clamp(3.5rem, 12vw, 6rem)`, line-height 1, `-0.04em`): the landing-page wordmark only.
- **Headline** (600, `clamp(1.75rem, 4vw, 2.5rem)`, line-height 1.25): the landing-page statement and modal dialog headers.
- **Title** (600, `1.5rem`, tight tracking `-0.025em`): primary page titles and department names.
- **Section** (600, `1.125rem`, tight tracking `-0.025em`): card headers and settings section headings; sticky page headers use 600 at 1rem.
- **Composer / Field** (400, `17px`, line-height 1.375): the main input / textarea, one step larger than the items it outputs.
- **Body** (400, `15px`, line-height 1.625): standard content, descriptions, and summaries; pre-wrapped, max line set by the 620px column.
- **Nav** (500, `15px`): side nav items and page tabs.
- **Small** (400, `0.875rem` / 14px): secondary metadata, list items, helper text, and button labels.
- **Mono** (400, `13px`; 500 for counts): codes, identifiers, short hashes, relative times, countdowns, error lines, field keys, and `null` values in settings.

### Named Rules
**The Machine Speaks Mono Rule.** If a database, solver engine, or system prints it (a code, a room identifier, a count, a timestamp, a slot coordinate, an error line, or `null`), it is set in Geist Mono at 13px with tabular figures. Human sentences never are.

**The Wordmark Rule.** Brand wordmarks keep clean casing in Geist Sans beside the mark, semibold with tight negative tracking.

---

## Layout

A centered shell (`shell-max: 1264px`) holds three columns:
1. **Left Nav:** Sticky navigation (`nav-column: 256px` at lg, 80px icon rail at md).
2. **Workspace / Primary Column:** Surface White, hairline-bordered left and right (`feed-column: 620px`).
3. **Aside Column:** Sticky operational aside (`aside-column: 320px`, xl and up only).

Below md, the navigation collapses into a fixed bottom bar and a 56px mobile header carries the wordmark and account menu; the aside disappears.

Inside the workspace, every row is `[rail | content]`. The rail column is 44px (56px from sm) and spans the full row height; content rows pad 12px vertically and 16px on the right, and the row's bottom hairline starts after the rail so the line runs uninterrupted. Page headers are sticky, 56px tall, with 16/24px horizontal gutters. The landing page reuses the same grammar at large scale with 40-48px of air between nodes.

**The Unbroken Rail Rule.** Dividers never cross the rail column. Rows are separated to the right of the graph so the line reads as one continuous history from the staged input to the root entry.

---

## Elevation & Depth

**Flat.** Depth comes from the shell/surface tone step and hairline rules, not shadows. The only shadows in the build are functional geometry: the 2px zero-offset ring that outlines each node in its lane color and the near-invisible `shadow-xs` on primitive buttons. Popovers and dialogs use the component library's default overlay treatment.

**The No Cards Rule.** Items are rows, not cards. Containment is a hairline; there are no heavy floating panels in the feed.

---

## Shapes

Soft but small:
- **sm (4px):** Compact status tags, period badges, count labels, and table cell pills.
- **md (6px):** Interactive controls, buttons, text inputs, select dropdowns, and mentions.
- **lg (8px):** Navigation items, bordered groups, overlays, modal sheets, and drawer containers.
- **full (9999px):** User avatars, graph nodes, indicator dots, and circular buttons.

Inset clipping follows the outer radius minus its inset. Person avatars, graph nodes, entity dots, and bullets remain circles. Switches, spinners, thin progress bars, and drag handles keep their functional geometry. Lines are 2px for rail segments and node rings, 1px for hairlines. The node is a ring with a 3px punched gap in the surface color, filled with the lane color for an entry and left hollow for staged and root states.

---

## Components

### Buttons
Quiet, rectangular, decisive.
- **Shape:** Gently rounded (6px); default height 36px, small 32px, large 40px (landing CTA 44px).
- **Primary:** Primary Blue fill (`#3b6fe0`), white label, 14px medium. Disabled at 50% opacity.
- **Hover / Focus:** Fill steps to Pressed Primary Blue (`#2e5ccb`); focus shows a 3px ring at 50% opacity.
- **Outline:** Hairline input stroke (`#e1e4e8`) on the shell color (`#f6f7f8`); hover transitions to wash (`#eef0f2`).
- **Ghost:** No fill until hover (`#eef0f2`). Used for "Cancel" and secondary actions.
- **Destructive:** Destructive Red fill (`#c92a2a`), white label, small size. Appears only after an explicit confirm step.

### Navigation
- **Side Nav:** 15px medium, 20px line icons, 12px padding, 8px corners. Inactive is Muted Ink (`#5b616b`); hover adds the wash (`#eef0f2`); active is Primary Blue text on Blue Wash (`#e8effc`). When navigating, the Blue Wash slides smoothly to the new item (220ms, expo-out). Labels collapse to icons at md.
- **Page Tabs:** Full-width split under a sticky header, 15px medium. Active text goes to ink (`#121417`) with a 3px Primary Blue underline hugging the label; inactive is muted (`#5b616b`). The underline slides and resizes to the new tab (280ms, ease-out), in step with content.
- **Mobile:** Fixed bottom bar of equal cells, icon over 12px label, active in Primary Blue with a 56×32 Blue Wash rectangle with 8px corners behind the icon. Background slides to the new item (220ms, expo-out).

### Inputs / Fields
- **Main Input / Field:** Borderless or clean hairline: a 17px textarea or input field that grows with content. Its state is carried by the rail: the staged node is hollow until content is typed, then fills with the author's lane; the tail below is a dashed Rail Gray line. A mono countdown sits on the right; ⌘/Ctrl+Enter submits.
- **Preview:** An eye icon button toggles the field for the draft rendered live at 15px in the exact same spot so the counter row stays put. ⌘/Ctrl+Shift+P toggles it; Esc returns to editing; ⌘/Ctrl+Enter submits.
- **Draft Preservation:** Unsaved changes in inputs and forms are kept in `localStorage` per signed-in user (cleared on save/submit, when emptied, and on logout). When a draft is restored after reload or navigation, a quiet mono indicator sits at the left of the counter row with a muted discard text button.
- **Read-Only Fields (Settings):** A hairline-bordered 8px-radius list, mono keys in a column, values in sans; missing values print a mono `null`.
- **Color Picker (Settings):** A live preview row (rail node, 48px avatar with lane ring, lane dot) above a radio group of seven 28px swatches with sans captions: an "Auto" swatch showing the hashed lane, then the six lanes. Saved with a primary "Save color" button.
- **Theme Switch:** A bordered segmented group (8px outer, 6px inner) whose selected option uses the active-nav treatment (Primary Blue text on Blue Wash). The wash slides to the picked option while the page transitions smoothly.

### Row / Entry Row (Signature)
The graph rail, then avatar/icon (40px circle), then a header line: author/entity name (600), mono identifier, a middle dot, mono relative time, and short code pushed right. The body follows at 15px, pre-wrapped. Under the body, clean action controls with mono counts.
Deleting is inline: a soft red strip asks "Delete this entry? There's no undo." with Cancel and Delete; confirming displays a concise mono removal status, then the row collapses (height and opacity, 300ms after a 400ms hold).

### Graph Rail (Signature)
A 14px circle centered on a 2px vertical line. The segment above a node takes the previous item's lane; the segment below takes this item's. The first item hangs from a Rail Gray segment beneath the staged input. The end of history is a hollow root node with no tail and a muted line ("No earlier records.").

### Empty States
Centered in the feed/container: a mono status line in Muted Ink, then one or two plain sentences (15px, max 24rem) with a single Primary Blue link when there is somewhere to go.

### Operations Console
Operations opens in place but as a focused workspace: a 240px Surface White sidebar groups pages under mono labels, with the active page on the Blue Wash like the side nav.
Panels sit on the Cool Shell in a grid of panels: Surface White, 8px, hairline-bordered, a hairline under the title row (title, mono meta, actions on the right). Panels are the console's only containers; they never shadow.
- **Status:** Status indicators use `lane-1` green (`#2f9e44`), `lane-5` ochre (`#b7791f`), and Destructive Red (`#c92a2a`). They only ever mark state (healthy, active, warning, failing) and always come with an icon or clear label.
- **Charts:** Drawn in SVG at real size, hairline gridlines, mono 11px ticks. Columns are at most 24px wide with a 2px surface gap between stacked segments.

### Error Pages
403, 404, 429, 500, and 503 render one standalone page with no shell: a broken rail with a hollow node, a mono error code line, a Headline sentence saying what happened, one muted sentence saying what to do, and a single Primary Blue button ("Back to workspace", "Go to overview", or "Try again").

### Profile Header
An 80px avatar with a 2px lane ring offset 4px from the surface, name in Title, mono handle led by the lane dot, metadata with 16px line icons, and mono counts paired with sans labels ("14 sections", "40 faculty").

### Activity Matrix
A grid of activity buckets (24 hours, 7 days, 30 days, or 52 weeks): equal-width cells, 40px tall (48px from sm), 2px-rounded with 3px gaps, filled in the entity lane at 32/56/80/100% relative to capacity/load. Under the graph, a mono 13px strip prints summary metrics with muted labels and foreground numbers.

### User & Entity Preview
Hovering an avatar or identifier (mouse only, 450ms delay, 200ms grace) opens a 304px Popover preview below the trigger: a 56px avatar ringed in the lane color, name, mono identifier with lane dot, summary details, and mono stats. Closes on scroll, Escape, or mouse leave.

### Notifications
The notification center is structured on the rail: every row hangs on a Rail Gray rail whose node is a 36px hollow circle holding the event type icon. A sticky header carries the title over page tabs with the sliding Primary Blue underline. Day markers split the rows. Groups expand in place from a Primary Blue toggle.

### Search / Command Palette
Opened by ⌘K / Ctrl+K or `/` anywhere: Popover surface, 576px max, 12vh from the top: a borderless 17px input with search icon, results as rows with active row on wash and `↵` hint, and footer key hints. Combobox semantics: arrow keys navigate, Enter selects, Escape closes.

---

## Do's and Don'ts

### Do:
- **Do** place structured lists on the continuous vertical rail, with node and lower segment in the entity's lane color.
- **Do** set identifiers, codes, period times, room numbers, counts, and error lines in Geist Mono at 13px with tabular numerals.
- **Do** keep Primary Blue (`#3b6fe0`) exclusively for primary actions, active tabs, links, focus outlines, and current location.
- **Do** separate rows and containers with 1px hairlines (`#e1e4e8`) rather than floating cards or drop shadows.
- **Do** end completed feeds and lists with a hollow root node and dry, literal copy.
- **Do** mirror dark mode token-for-token on graphite (`shell-dark: #111112`, `surface-dark: #18181a`) using the lifted `-dark` lanes and primary.
- **Do** gate rail and navigation motion behind `prefers-reduced-motion`.
- **Do** preserve input drafts in `localStorage` with quiet mono recovery indicators.

### Don't:
- **Don't** use lane colors for text, buttons, badges, or general backgrounds; they mark entities on the rail and nowhere else.
- **Don't** give a lane to blue; blue belongs to action and location only.
- **Don't** wrap rows in cards with drop shadows or heavy blur layers.
- **Don't** use arbitrary blue hues; adhere strictly to Primary Blue (`#3b6fe0`), Pressed (`#2e5ccb`), and Blue Wash (`#e8effc`).
- **Don't** set human sentences in mono to look technical; prose belongs in Geist Sans.
- **Don't** touch or alter marketing landing page styling when updating internal application components.
