import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text displayed above input
   */
  label?: string;
  /**
   * Helper text displayed below input
   */
  helperText?: string;
  /**
   * Error message (also sets error state)
   */
  error?: string;
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode;
  /**
   * Optional container class name
   */
  containerClassName?: string;
}

/**
 * Input component - Ultra-Minimal Design System
 *
 * Features:
 * - 40px height
 * - Label, placeholder, helper text support
 * - Left/right icon slots
 * - Error state with message
 * - Full keyboard navigation
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="you@example.com"
 *   helperText="We'll never share your email"
 * />
 *
 * <Input
 *   label="Search"
 *   leftIcon={<SearchIcon />}
 *   rightIcon={<CloseIcon />}
 * />
 *
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = 'text',
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const helperId = helperText || error ? `${inputId}-helper` : undefined;
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-2', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--fg-default)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helperId}
            className={cn(
              /* Base styles */
              `h-10 w-full rounded-lg px-3 py-2
               bg-[var(--bg-base)] text-[var(--fg-default)]
               border border-[var(--border-default)]
               font-normal text-sm
               placeholder:text-[var(--fg-subtle)]
               transition-all duration-[var(--transition-normal)]`,

              /* Focus state */
              `focus:outline-none focus:ring-2
               focus:ring-[var(--border-focus)] focus:ring-offset-1
               focus:border-transparent`,

              /* Hover state */
              `hover:border-[var(--border-hover)]`,

              /* Error state */
              hasError &&
                `border-[var(--error)] focus:ring-[var(--error)]
                 bg-[var(--error-subtle)]`,

              /* Disabled state */
              disabled &&
                `opacity-50 cursor-not-allowed
                 bg-[var(--bg-subtle)]`,

              /* Icon padding adjustments */
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',

              className
            )}
            {...props}
          />

          {rightIcon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p
            id={helperId}
            className={cn(
              'text-xs',
              hasError ? 'text-[var(--error)]' : 'text-[var(--fg-muted)]'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
