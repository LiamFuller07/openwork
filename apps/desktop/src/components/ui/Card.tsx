import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Card component variants
 */
const cardVariants = cva(
  /* Base styles */
  `rounded-xl border transition-all duration-[var(--transition-normal)]`,
  {
    variants: {
      variant: {
        base: `
          bg-[var(--bg-base)] border-[var(--border-subtle)]
          text-[var(--fg-default)]
        `,
        elevated: `
          bg-[var(--bg-elevated)] border-[var(--border-subtle)]
          text-[var(--fg-default)]
          shadow-[var(--shadow-md)]
        `,
        interactive: `
          bg-[var(--bg-base)] border-[var(--border-default)]
          text-[var(--fg-default)]
          hover:border-[var(--border-hover)]
          hover:shadow-[var(--shadow-sm)]
          cursor-pointer
          active:scale-[0.99]
        `,
        accent: `
          bg-[var(--accent-subtle)] border-[var(--accent)]
          text-[var(--fg-default)]
          border-l-2
        `,
      },
    },
    defaultVariants: {
      variant: 'base',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Card component - Ultra-Minimal Design System
 *
 * Container component with variants for different use cases.
 * 12px border radius, customizable padding via subcomponents.
 *
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Optional description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Main content goes here
 *   </CardContent>
 *   <CardFooter>
 *     Footer content
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/* --- CardHeader --- */

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-5', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

/* --- CardTitle --- */

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Heading level (default: h3)
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight text-[var(--fg-default)]',
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

/* --- CardDescription --- */

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-[var(--fg-muted)]', className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

/* --- CardContent --- */

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-5 pt-0', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

/* --- CardFooter --- */

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-5 pt-0', className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
