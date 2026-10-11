import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatPercentage(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    O: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'A+': 'text-green-700 bg-green-50 border-green-200',
    A: 'text-blue-700 bg-blue-50 border-blue-200',
    'B+': 'text-indigo-700 bg-indigo-50 border-indigo-200',
    B: 'text-purple-700 bg-purple-50 border-purple-200',
    C: 'text-amber-700 bg-amber-50 border-amber-200',
    F: 'text-red-700 bg-red-50 border-red-200',
  };
  return map[grade] || 'text-gray-700 bg-gray-50 border-gray-200';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PASS: 'text-green-700 bg-green-50 border-green-200',
    FAIL: 'text-red-700 bg-red-50 border-red-200',
    ABSENT: 'text-amber-700 bg-amber-50 border-amber-200',
    PUBLISHED: 'text-green-700 bg-green-50 border-green-200',
    DRAFT: 'text-gray-700 bg-gray-50 border-gray-200',
    APPROVED: 'text-blue-700 bg-blue-50 border-blue-200',
    SUBMITTED: 'text-purple-700 bg-purple-50 border-purple-200',
    UNDER_REVIEW: 'text-amber-700 bg-amber-50 border-amber-200',
    ACTIVE: 'text-green-700 bg-green-50 border-green-200',
    INACTIVE: 'text-gray-700 bg-gray-50 border-gray-200',
    ONGOING: 'text-blue-700 bg-blue-50 border-blue-200',
    COMPLETED: 'text-green-700 bg-green-50 border-green-200',
    UPCOMING: 'text-purple-700 bg-purple-50 border-purple-200',
  };
  return map[status] || 'text-gray-700 bg-gray-50 border-gray-200';
}
