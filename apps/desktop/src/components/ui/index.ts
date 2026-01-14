/**
 * UI Components - Ultra-Minimal Design System
 * Phase 2: Core Components Export
 *
 * All components follow the design system specifications with:
 * - CSS variable-based theming (4 theme variants)
 * - CVA variants for consistent styling
 * - Full TypeScript support
 * - Accessibility features (ARIA, keyboard navigation)
 * - forwardRef for DOM access
 */

// Button
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

// Input
export { Input } from './Input';
export type { InputProps } from './Input';

// Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './Card';

// Badge
export { Badge, badgeVariants } from './Badge';
export type { BadgeProps } from './Badge';

// StatCard
export { StatCard, statCardVariants } from './StatCard';
export type { StatCardProps } from './StatCard';
