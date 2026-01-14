/**
 * UI Components Usage Examples
 *
 * These examples demonstrate all component variants and features.
 * Copy these patterns into your application code.
 */

import React from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatCard,
} from './index';

// ============================================================================
// BUTTON EXAMPLES
// ============================================================================

export function ButtonExamples() {
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Button Examples</h2>

      {/* Variants */}
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="destructive">Delete</Button>
      </div>

      {/* Sizes */}
      <div className="flex items-center gap-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="ghost">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      {/* States */}
      <div className="flex gap-2">
        <Button disabled>Disabled</Button>
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
          }}
        >
          {loading ? 'Processing...' : 'Click to Load'}
        </Button>
      </div>

      {/* With Icons */}
      <div className="flex gap-2">
        <Button
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Item
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// INPUT EXAMPLES
// ============================================================================

export function InputExamples() {
  return (
    <div className="space-y-6 p-6 max-w-md">
      <h2 className="text-lg font-semibold">Input Examples</h2>

      {/* Basic */}
      <Input label="Email" placeholder="you@example.com" type="email" />

      {/* With Helper Text */}
      <Input
        label="Username"
        placeholder="johndoe"
        helperText="Choose a unique username"
      />

      {/* With Icons */}
      <Input
        label="Search"
        placeholder="Search..."
        leftIcon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
          </svg>
        }
      />

      {/* Error State */}
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        error="Password must be at least 8 characters"
      />

      {/* Disabled */}
      <Input label="Disabled" value="Cannot edit" disabled />
    </div>
  );
}

// ============================================================================
// CARD EXAMPLES
// ============================================================================

export function CardExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold">Card Examples</h2>

      {/* Base Card */}
      <Card variant="base" className="max-w-md">
        <CardHeader>
          <CardTitle>Base Card</CardTitle>
          <CardDescription>Simple card with minimal styling</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--fg-muted)]">
            This is the base card variant with standard border and no shadow.
          </p>
        </CardContent>
      </Card>

      {/* Elevated Card */}
      <Card variant="elevated" className="max-w-md">
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
          <CardDescription>Card with shadow elevation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--fg-muted)]">
            Elevated cards have a subtle shadow for more prominence.
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Learn More</Button>
        </CardFooter>
      </Card>

      {/* Interactive Card */}
      <Card variant="interactive" className="max-w-md" onClick={() => alert('Clicked!')}>
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Click me!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--fg-muted)]">
            Interactive cards have hover effects and are clickable.
          </p>
        </CardContent>
      </Card>

      {/* Accent Card */}
      <Card variant="accent" className="max-w-md">
        <CardHeader>
          <CardTitle>Accent Card</CardTitle>
          <CardDescription>Highlighted with accent border</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--fg-muted)]">
            Accent cards have a 2px left border for emphasis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// BADGE EXAMPLES
// ============================================================================

export function BadgeExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold">Badge Examples</h2>

      {/* Variants */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>

      {/* With Dot */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success" dot>
          Active
        </Badge>
        <Badge variant="error" dot>
          Failed
        </Badge>
        <Badge variant="warning" dot>
          Pending
        </Badge>
      </div>

      {/* With Icons */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="success"
          icon={
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        >
          Completed
        </Badge>
      </div>

      {/* Status Examples */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Draft</Badge>
        <Badge variant="accent">In Review</Badge>
        <Badge variant="success">Published</Badge>
        <Badge variant="error">Archived</Badge>
      </div>
    </div>
  );
}

// ============================================================================
// STATCARD EXAMPLES
// ============================================================================

export function StatCardExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold">StatCard Examples</h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic */}
        <StatCard label="Total Users" value="1,234" />

        {/* With Context */}
        <StatCard
          label="Revenue"
          value="$45,678"
          context="Last 30 days"
          variant="elevated"
        />

        {/* With Trend Up */}
        <StatCard
          label="Active Sessions"
          value="892"
          trend="up"
          trendValue="+12.5%"
          context="vs last week"
          variant="accent"
        />

        {/* With Trend Down */}
        <StatCard
          label="Bounce Rate"
          value="24.3%"
          trend="down"
          trendValue="-5.2%"
          context="Improvement"
          variant="default"
        />

        {/* With Icon */}
        <StatCard
          label="Tasks Completed"
          value={42}
          context="This month"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />

        {/* Interactive */}
        <StatCard
          label="Notifications"
          value={8}
          variant="interactive"
          onClick={() => alert('View notifications')}
        />
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETE DEMO
// ============================================================================

export function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--fg-default)]">
      <div className="max-w-6xl mx-auto py-12 space-y-12">
        <div className="px-6">
          <h1 className="text-3xl font-bold mb-2">UI Component Showcase</h1>
          <p className="text-[var(--fg-muted)]">
            Ultra-Minimal Design System - Phase 2 Core Components
          </p>
        </div>

        <ButtonExamples />
        <InputExamples />
        <CardExamples />
        <BadgeExamples />
        <StatCardExamples />
      </div>
    </div>
  );
}
