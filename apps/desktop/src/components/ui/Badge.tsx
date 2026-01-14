import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Badge component variants
 */
const badgeVariants = cva(
  /* Base styles */
  `inline-flex items-center justify-center gap-1
   px-2.5 py-0.5 rounded-md
   text-xs font-medium
   transition-all duration-[var(--transition-fast)]
   border`,
  {
    variants: {
      variant: {
        default: `
          bg-[var(--bg-subtle)] text-[var(--fg-default)]
          border-[var(--border-default)]
        `,
        accent: `
          bg-[var(--accent)] text-[var(--fg-on-accent)]
          border-[var(--accent)]
        `,
        success: `
          bg-[var(--success-subtle)] text-[var(--success)]
          border-[var(--success)]
        `,
        warning: `
          bg-[var(--warning-subtle)] text-[var(--warning)]
          border-[var(--warning)]
        `,
        error: `
          bg-[var(--error-subtle)] text-[var(--error)]
          border-[var(--error)]
        `,
        outline: `
          bg-transparent text-[var(--fg-default)]
          border-[var(--border-default)]
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Optional icon element to display before children
   */
  icon?: React.ReactNode;
  /**
   * Optional dot indicator
   */
  dot?: boolean;
}

/**
 * Badge component - Ultra-Minimal Design System
 *
 * Small label component for statuses, tags, counts, etc.
 * Height: 20-24px, Font: 11px weight 500
 *
 * @example
 * ```tsx
 * <Badge variant="default">Default</Badge>
 * <Badge variant="accent">Primary</Badge>
 * <Badge variant="success" icon={<CheckIcon />}>Success</Badge>
 * <Badge variant="error" dot>Error</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, icon, dot, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {dot && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
        )}
        {icon && <span aria-hidden="true">{icon}</span>}
        {children && <span>{children}</span>}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
