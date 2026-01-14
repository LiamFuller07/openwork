import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * StatCard component variants
 */
const statCardVariants = cva(
  /* Base styles */
  `flex flex-col gap-2 p-5 rounded-xl
   transition-all duration-[var(--transition-normal)]`,
  {
    variants: {
      variant: {
        default: `
          bg-[var(--bg-base)] border border-[var(--border-subtle)]
        `,
        elevated: `
          bg-[var(--bg-elevated)] border border-[var(--border-subtle)]
          shadow-[var(--shadow-md)]
        `,
        accent: `
          bg-[var(--accent-subtle)] border-l-2 border-l-[var(--accent)]
          border-t border-r border-b border-[var(--border-subtle)]
        `,
        interactive: `
          bg-[var(--bg-base)] border border-[var(--border-default)]
          hover:border-[var(--border-hover)]
          hover:shadow-[var(--shadow-sm)]
          cursor-pointer
          active:scale-[0.99]
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  /**
   * Label text (displayed as 10px uppercase)
   */
  label: string;
  /**
   * Main value (displayed as 32px bold)
   */
  value: React.ReactNode;
  /**
   * Optional context text (displayed as 12px muted)
   */
  context?: React.ReactNode;
  /**
   * Optional icon element
   */
  icon?: React.ReactNode;
  /**
   * Optional trend indicator
   */
  trend?: 'up' | 'down' | 'neutral';
  /**
   * Optional trend value
   */
  trendValue?: string;
}

/**
 * StatCard component - Ultra-Minimal Design System
 *
 * Specialized card for displaying statistics and metrics.
 * Pattern: LABEL (10px uppercase) → VALUE (32px bold) → CONTEXT (12px muted)
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Users"
 *   value="1,234"
 *   context="Active this month"
 * />
 *
 * <StatCard
 *   label="Revenue"
 *   value="$45,678"
 *   context="Last 30 days"
 *   trend="up"
 *   trendValue="+12.5%"
 *   variant="accent"
 * />
 *
 * <StatCard
 *   label="Tasks"
 *   value={42}
 *   icon={<CheckIcon />}
 *   variant="interactive"
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      variant,
      label,
      value,
      context,
      icon,
      trend,
      trendValue,
      ...props
    },
    ref
  ) => {
    const getTrendIcon = () => {
      if (trend === 'up') {
        return (
          <svg
            className="h-4 w-4 text-[var(--success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        );
      }
      if (trend === 'down') {
        return (
          <svg
            className="h-4 w-4 text-[var(--error)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        );
      }
      return null;
    };

    return (
      <div
        ref={ref}
        className={cn(statCardVariants({ variant }), className)}
        {...props}
      >
        {/* Header with label and optional icon */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-medium uppercase tracking-wider text-[var(--fg-muted)]"
            aria-label={`${label} statistic`}
          >
            {label}
          </span>
          {icon && (
            <span className="text-[var(--fg-muted)]" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>

        {/* Main value */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-[32px] font-bold leading-none tracking-tight text-[var(--fg-default)]"
            aria-live="polite"
          >
            {value}
          </span>
          {trend && getTrendIcon()}
        </div>

        {/* Context and trend value */}
        {(context || trendValue) && (
          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            {trendValue && (
              <span
                className={cn(
                  'font-medium',
                  trend === 'up' && 'text-[var(--success)]',
                  trend === 'down' && 'text-[var(--error)]'
                )}
              >
                {trendValue}
              </span>
            )}
            {context && <span>{context}</span>}
          </div>
        )}
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

export { StatCard, statCardVariants };
