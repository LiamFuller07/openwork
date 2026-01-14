# UI Components - Ultra-Minimal Design System

Phase 2 Core Components for OpenWork Desktop Application.

## Overview

This directory contains the foundational UI components following the Ultra-Minimal Design System specifications. All components are:

- **Theme-aware**: Work with all 4 theme variants (cool-light, cool-dark, warm-light, warm-dark)
- **Type-safe**: Full TypeScript support with exported types
- **Accessible**: ARIA attributes, keyboard navigation, focus management
- **Composable**: Built with CVA (class-variance-authority) for easy customization
- **Lightweight**: Minimal dependencies, CSS variable-based theming

## Components

### 1. Button (`Button.tsx`)

Interactive button component with multiple variants and states.

**Variants**: `primary`, `secondary`, `ghost`, `accent`, `destructive`
**Sizes**: `sm` (32px), `md` (40px), `lg` (48px), `icon` (40x40)
**States**: default, hover, active, focus, disabled, loading

```tsx
import { Button } from '@/components/ui';

// Basic usage
<Button variant="primary">Click me</Button>

// With loading state
<Button loading>Processing...</Button>

// With icon
<Button icon={<Icon />}>Add Item</Button>

// Icon only
<Button size="icon" variant="ghost">
  <Icon />
</Button>
```

**Props**:
- `variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'destructive'`
- `size?: 'sm' | 'md' | 'lg' | 'icon'`
- `loading?: boolean`
- `icon?: React.ReactNode`
- All standard `<button>` props

---

### 2. Input (`Input.tsx`)

Text input component with label, icons, and error handling.

**Features**: Label, placeholder, helper text, left/right icons, error state
**Height**: 40px
**States**: default, hover, focus, error, disabled

```tsx
import { Input } from '@/components/ui';

// With label and helper text
<Input
  label="Email"
  placeholder="you@example.com"
  helperText="We'll never share your email"
/>

// With icons
<Input
  label="Search"
  leftIcon={<SearchIcon />}
  rightIcon={<CloseIcon />}
/>

// Error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

**Props**:
- `label?: string`
- `helperText?: string`
- `error?: string` (sets error state)
- `leftIcon?: React.ReactNode`
- `rightIcon?: React.ReactNode`
- `containerClassName?: string`
- All standard `<input>` props

---

### 3. Card (`Card.tsx`)

Container component with multiple variants and subcomponents.

**Variants**: `base`, `elevated`, `interactive`, `accent`
**Border radius**: 12px
**Subcomponents**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Interactive card
<Card variant="interactive" onClick={handleClick}>
  {/* ... */}
</Card>

// Accent card (with 2px left border)
<Card variant="accent">
  {/* ... */}
</Card>
```

**Props**:
- `variant?: 'base' | 'elevated' | 'interactive' | 'accent'`
- All standard `<div>` props

---

### 4. Badge (`Badge.tsx`)

Small label component for statuses, tags, and counts.

**Variants**: `default`, `accent`, `success`, `warning`, `error`, `outline`
**Size**: 20-24px height
**Font**: 11px, weight 500

```tsx
import { Badge } from '@/components/ui';

// Variants
<Badge variant="default">Draft</Badge>
<Badge variant="accent">Featured</Badge>
<Badge variant="success">Published</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>

// With dot indicator
<Badge variant="success" dot>Active</Badge>

// With icon
<Badge variant="success" icon={<CheckIcon />}>
  Completed
</Badge>
```

**Props**:
- `variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'outline'`
- `icon?: React.ReactNode`
- `dot?: boolean`
- All standard `<div>` props

---

### 5. StatCard (`StatCard.tsx`)

Specialized card for displaying statistics and metrics.

**Pattern**: LABEL (10px uppercase) → VALUE (32px bold) → CONTEXT (12px muted)
**Variants**: `default`, `elevated`, `accent`, `interactive`

```tsx
import { StatCard } from '@/components/ui';

// Basic
<StatCard
  label="Total Users"
  value="1,234"
/>

// With context
<StatCard
  label="Revenue"
  value="$45,678"
  context="Last 30 days"
  variant="elevated"
/>

// With trend
<StatCard
  label="Active Sessions"
  value="892"
  trend="up"
  trendValue="+12.5%"
  context="vs last week"
  variant="accent"
/>

// Interactive
<StatCard
  label="Tasks"
  value={42}
  variant="interactive"
  onClick={handleClick}
/>
```

**Props**:
- `label: string` (required)
- `value: React.ReactNode` (required)
- `context?: React.ReactNode`
- `icon?: React.ReactNode`
- `trend?: 'up' | 'down' | 'neutral'`
- `trendValue?: string`
- `variant?: 'default' | 'elevated' | 'accent' | 'interactive'`
- All standard `<div>` props

---

## File Structure

```
/Users/liam/openwork/apps/desktop/src/components/ui/
├── Button.tsx       # Button component with CVA variants
├── Input.tsx        # Input with label, icons, error states
├── Card.tsx         # Card with subcomponents
├── Badge.tsx        # Badge/label component
├── StatCard.tsx     # Statistics display card
├── index.ts         # Central export file
├── examples.tsx     # Usage examples (for development)
└── README.md        # This file
```

## Usage

Import components from the central index file:

```tsx
import { Button, Input, Card, Badge, StatCard } from '@/components/ui';
```

Or import individually:

```tsx
import { Button } from '@/components/ui/Button';
```

## Theme Variables

All components use CSS variables from the design system. The theme is controlled via:

- `data-mode="light"` or `data-mode="dark"`
- `data-temp="cool"` or `data-temp="warm"`

Or use combined theme selectors:

- `data-theme="cool-light"` (default)
- `data-theme="cool-dark"`
- `data-theme="warm-light"`
- `data-theme="warm-dark"`

### Key CSS Variables

```css
/* Backgrounds */
--bg-base
--bg-subtle
--bg-muted
--bg-elevated
--bg-hover
--bg-active

/* Foreground */
--fg-default
--fg-muted
--fg-subtle
--fg-on-accent

/* Borders */
--border-default
--border-subtle
--border-hover
--border-focus

/* Accent */
--accent
--accent-hover
--accent-subtle

/* Semantic */
--success
--warning
--error
--success-subtle
--warning-subtle
--error-subtle

/* Effects */
--shadow-sm
--shadow-md
--shadow-lg
--transition-fast
--transition-normal
--transition-slow
```

## Dependencies

- **class-variance-authority**: CVA for variant management
- **clsx**: Conditional class names
- **tailwind-merge**: Tailwind class merging

Install via:

```bash
pnpm add class-variance-authority clsx tailwind-merge
```

## Accessibility

All components include:

- Proper ARIA attributes (`aria-label`, `aria-describedby`, `aria-invalid`)
- Keyboard navigation support
- Focus management with visible focus rings
- Screen reader announcements where appropriate
- Disabled state handling

## Examples

See `examples.tsx` for comprehensive usage examples of all components.

To view the showcase (development only):

```tsx
import { ComponentShowcase } from '@/components/ui/examples';

function App() {
  return <ComponentShowcase />;
}
```

## Design System Compliance

These components implement the Ultra-Minimal Design System specifications:

- ✅ Phase 1.1: CSS Variables Foundation (4 themes)
- ✅ Phase 2: Core Components (Button, Input, Card, Badge, StatCard)
- ⏳ Phase 3: Complex Components (Select, Dialog, Dropdown, etc.)

## Related Files

- **CSS Variables**: `/Users/liam/openwork/apps/desktop/src/index.css`
- **Utils**: `/Users/liam/openwork/apps/desktop/src/lib/utils.ts`
- **Tailwind Config**: `/Users/liam/openwork/apps/desktop/tailwind.config.js`

---

**Last Updated**: 2026-01-13
**Design System Version**: Phase 2
**Component Count**: 5 core components
