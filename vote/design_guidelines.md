# Design Guidelines: React Voting Application

## Design Approach
**System-Based Design (Material Design)**
This voting application prioritizes clarity, trust, and accessibility. Material Design provides the clean, professional foundation needed for civic/organizational voting interfaces where functionality and user confidence are paramount.

## Core Design Principles
- **Trust & Clarity**: Clean, unambiguous interface that inspires confidence
- **Efficiency**: Minimal clicks to complete voting actions
- **Accessibility**: High contrast, clear typography, obvious interactive states
- **Data Visualization**: Clear, immediate understanding of results

## Typography
**Font Stack**: Google Fonts - Inter (primary) + Roboto Mono (voter IDs)
- **Headings**: Inter Bold, 24px (h1), 20px (h2)
- **Body Text**: Inter Regular, 16px
- **Voter IDs**: Roboto Mono Regular, 14px
- **Button Text**: Inter Medium, 16px
- **Results Labels**: Inter Semibold, 14px

## Layout System
**Spacing Units**: Tailwind spacing - 2, 4, 6, 8, 16, 24
- Consistent padding/margins using these increments
- Component spacing: p-6 for cards, p-4 for modal content
- Section gaps: gap-8 between major sections

**Grid Structure**:
- Two-column layout on desktop (lg:grid-cols-2)
- Voter list section: 40% width
- Results section: 60% width
- Single column on mobile (stack vertically)

## Component Library

### Voter List Section
**Container**: White card with subtle shadow (shadow-lg), rounded-lg borders
- Header: "Registered Voters" with count badge
- Voter rows: Each row contains voter name, ID (monospace), and vote button
- Row spacing: py-4, hover state with subtle background change
- Dividers: thin border-b between voters

**Vote Button**: 
- Primary blue button, rounded-md, px-6 py-2
- State when voted: Disabled with checkmark icon, muted appearance
- State when not voted: Bright, inviting call-to-action

### Voting Modal
**Structure**:
- Overlay: Semi-transparent dark backdrop (backdrop-blur-sm)
- Modal: Centered white card, max-w-lg, rounded-lg, shadow-2xl
- Header: Question text (18px, semibold) with close X button
- Options: Radio button list with generous spacing (space-y-4)
- Each option: Full-width clickable area, hover background, clear selected state
- Footer: Two buttons side-by-side - "Cancel" (outline) and "Submit Vote" (solid primary)

### Results Section
**Container**: White card matching voter list styling
- Header: "Election Results" with status indicator
- Status indicator: Pill-shaped badge showing "Open" (green) or "Closed" (gray)
- When Open: "Results will be visible when election closes" placeholder
- When Closed: Bar chart visualization

**Bar Chart**:
- Horizontal bars with labels on left
- Option names: 14px, semibold
- Vote counts and percentages: 12px, right-aligned
- Bars: Filled with primary blue, height proportional to votes
- Bars background: Light gray track showing full width
- Spacing between bars: mb-4

### Control Section
**Container**: Bottom controls area with border-top, py-6
- Two action buttons: "Open Election" and "Close Election"
- Buttons: Large (px-8 py-3), rounded-md
- Active state: Solid primary, inactive state: outline
- Centered alignment or left-aligned based on viewport

## Spacing & Rhythm
- Page container: max-w-7xl, px-6, py-8
- Card internal padding: p-6
- Section gaps: space-y-8 vertically
- Button groups: gap-4 horizontally

## Interactive States
- **Buttons**: Subtle scale on hover (hover:scale-105), transition-all duration-200
- **Voter Rows**: hover:bg-gray-50 for better targeting
- **Radio Options**: Clear focus rings, smooth transitions
- **Modal**: Fade in/out with backdrop blur animation

## Accessibility
- All interactive elements have visible focus states
- Radio inputs properly labeled with for/id attributes
- Modal has proper ARIA labels and escape key handling
- Results use semantic HTML for screen readers
- Color contrast meets WCAG AA standards

## Data Visualization
**Bar Chart Specifications**:
- Bar height: h-8 for each option
- Maximum bar width: w-full relative to container
- Animation: Bars fill from left with 500ms ease-out transition on close
- Hover state: Slight opacity change on bars
- Labels positioned with flexbox for alignment

## Images
**No hero images needed** - This is a functional application focused on data and interaction, not visual storytelling. The clean, minimal interface is appropriate.

## Animations
**Minimal, purposeful only**:
- Modal fade in/out (200ms)
- Bar chart fill animation on election close (500ms)
- Button hover states (150ms)
- No scroll animations or decorative effects

## Critical UX Flows
1. **Voting**: Click vote → Modal opens → Select option → Submit → Modal closes → Button shows "Voted" state
2. **Results Toggle**: Close election → Results fade in with bar animation → Bars show vote distribution
3. **Election Control**: Toggle between open/closed states with clear visual feedback

This design creates a trustworthy, efficient voting experience where every interaction is clear and purposeful.