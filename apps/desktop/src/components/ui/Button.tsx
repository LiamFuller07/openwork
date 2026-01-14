import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Button component variants using CVA
 * Follows Ultra-Minimal Design System specifications
 */
const buttonVariants = cva(
  /* Base styles */
  `inline-flex items-center justify-center gap-2 font-medium
   transition-all duration-[var(--transition-normal)]
   focus-visible:outline-none focus-visible:ring-2
   focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50
   rounded-lg`,
  {
    variants: {
      variant: {
        primary: `
          bg-[var(--accent)] text-[var(--fg-on-accent)]
          hover:bg-[var(--accent-hover)]
          active:scale-[0.98]
          shadow-[var(--shadow-sm)]
        `,
        secondary: `
          bg-[var(--bg-subtle)] text-[var(--fg-default)]
          border border-[var(--border-default)]
          hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)]
          active:bg-[var(--bg-active)]
        `,
        ghost: `
          text-[var(--fg-default)]
          hover:bg-[var(--bg-hover)]
          active:bg-[var(--bg-active)]
        `,
        accent: `
          bg-[var(--accent-subtle)] text-[var(--accent)]
          hover:bg-[var(--accent)] hover:text-[var(--fg-on-accent)]
          active:scale-[0.98]
        `,
        destructive: `
          bg-[var(--error)] text-white
          hover:opacity-90
          active:scale-[0.98]
          shadow-[var(--shadow-sm)]
        `,
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Display loading state with spinner
   */
  loading?: boolean;
  /**
   * Optional icon element to display before children
   */
  icon?: React.ReactNode;
}

/**
 * Button component - Ultra-Minimal Design System
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="ghost" size="icon" icon={<Icon />} />
 * <Button variant="secondary" loading>Processing...</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, disabled, icon, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span aria-hidden="true">{icon}</span>}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
