/**
 * Component Test Page
 *
 * Quick visual test to verify all components render correctly.
 * This file can be imported temporarily for testing.
 */

import React from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  StatCard,
} from './index';

export function ComponentTestPage() {
  const [inputValue, setInputValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="min-h-screen p-8 bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--fg-default)] mb-2">
            Component Test Page
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Visual verification of all Phase 2 components
          </p>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--fg-default)]">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 2000);
              }}
            >
              {loading ? 'Loading...' : 'Test Loading'}
            </Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--fg-default)]">Inputs</h2>
          <div className="grid gap-4 max-w-md">
            <Input
              label="Email"
              placeholder="you@example.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="With Helper"
              placeholder="Type something"
              helperText="This is helper text"
            />
            <Input
              label="Error State"
              placeholder="Invalid input"
              error="This field is required"
            />
            <Input label="Disabled" value="Cannot edit" disabled />
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--fg-default)]">Cards</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card variant="base">
              <CardHeader>
                <CardTitle>Base Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--fg-muted)]">
                  Standard card with minimal styling.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--fg-muted)]">
                  Card with shadow for emphasis.
                </p>
              </CardContent>
            </Card>

            <Card variant="accent">
              <CardHeader>
                <CardTitle>Accent Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--fg-muted)]">
                  Highlighted with accent border.
                </p>
              </CardContent>
            </Card>

            <Card
              variant="interactive"
              onClick={() => alert('Card clicked!')}
            >
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--fg-muted)]">
                  Click me to test interaction!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--fg-default)]">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success" dot>With Dot</Badge>
          </div>
        </section>

        {/* StatCards */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--fg-default)]">Stat Cards</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard
              label="Total Users"
              value="1,234"
            />
            <StatCard
              label="Revenue"
              value="$45,678"
              context="Last 30 days"
              variant="elevated"
            />
            <StatCard
              label="Active Sessions"
              value="892"
              trend="up"
              trendValue="+12.5%"
              context="vs last week"
              variant="accent"
            />
          </div>
        </section>

        {/* Theme Test */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--fg-default)]">
            Theme Variables Test
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded bg-[var(--bg-base)] border border-[var(--border-default)]">
              bg-base
            </div>
            <div className="p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)]">
              bg-subtle
            </div>
            <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)]">
              bg-elevated
            </div>
            <div className="p-3 rounded bg-[var(--accent)] text-[var(--fg-on-accent)]">
              accent
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ComponentTestPage;
