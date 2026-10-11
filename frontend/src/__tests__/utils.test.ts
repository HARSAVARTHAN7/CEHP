import { describe, it, expect } from 'vitest';
import { cn, formatPercentage, gradeColor, statusColor } from '../lib/utils';

describe('Frontend Utility Helpers', () => {
  it('cn merges Tailwind classes properly', () => {
    expect(cn('px-2 py-1', 'bg-indigo-600')).toContain('bg-indigo-600');
    expect(cn('text-red-500', false && 'hidden', 'font-bold')).toBe('text-red-500 font-bold');
  });

  it('formatPercentage calculates round percentages', () => {
    expect(formatPercentage(45, 100)).toBe('45%');
    expect(formatPercentage(0, 100)).toBe('0%');
    expect(formatPercentage(10, 0)).toBe('0%');
  });

  it('gradeColor returns appropriate Tailwind styles for grades', () => {
    expect(gradeColor('O')).toContain('emerald');
    expect(gradeColor('A+')).toContain('green');
    expect(gradeColor('F')).toContain('red');
    expect(gradeColor('UNKNOWN')).toContain('gray');
  });

  it('statusColor returns appropriate badge classes', () => {
    expect(statusColor('PASS')).toContain('green');
    expect(statusColor('FAIL')).toContain('red');
    expect(statusColor('APPROVED')).toContain('blue');
    expect(statusColor('SUBMITTED')).toContain('purple');
  });
});
