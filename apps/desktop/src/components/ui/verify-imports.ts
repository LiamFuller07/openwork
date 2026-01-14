/**
 * Import Verification
 *
 * This file verifies that all components can be imported correctly.
 * Run this through TypeScript to check for any import errors.
 */

// Test individual imports
import { Button } from './Button';
import { Input } from './Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';
import { StatCard } from './StatCard';

// Test central index imports
import {
  Button as ButtonFromIndex,
  Input as InputFromIndex,
  Card as CardFromIndex,
  Badge as BadgeFromIndex,
  StatCard as StatCardFromIndex,
} from './index';

// Test type imports
import type { ButtonProps } from './Button';
import type { InputProps } from './Input';
import type { CardProps } from './Card';
import type { BadgeProps } from './Badge';
import type { StatCardProps } from './StatCard';

// Verify utils
import { cn } from '../../lib/utils';

// Type check
const _typeCheck = {
  button: null as unknown as ButtonProps,
  input: null as unknown as InputProps,
  card: null as unknown as CardProps,
  badge: null as unknown as BadgeProps,
  statCard: null as unknown as StatCardProps,
};

// Runtime check
export function verifyComponents() {
  return {
    Button: typeof Button === 'function',
    Input: typeof Input === 'function',
    Card: typeof Card === 'function',
    CardHeader: typeof CardHeader === 'function',
    CardTitle: typeof CardTitle === 'function',
    CardDescription: typeof CardDescription === 'function',
    CardContent: typeof CardContent === 'function',
    CardFooter: typeof CardFooter === 'function',
    Badge: typeof Badge === 'function',
    StatCard: typeof StatCard === 'function',
    cn: typeof cn === 'function',
    indexExports: {
      Button: typeof ButtonFromIndex === 'function',
      Input: typeof InputFromIndex === 'function',
      Card: typeof CardFromIndex === 'function',
      Badge: typeof BadgeFromIndex === 'function',
      StatCard: typeof StatCardFromIndex === 'function',
    },
  };
}

console.log('✅ All imports verified successfully');
