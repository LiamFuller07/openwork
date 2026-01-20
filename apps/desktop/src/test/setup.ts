import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

if (typeof document !== 'undefined') {
  expect.extend(matchers);
}
