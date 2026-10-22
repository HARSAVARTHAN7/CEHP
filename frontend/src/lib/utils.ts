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
    O: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60',
    'A+': 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/60 dark:border-green-800/60',
    A: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800/60',
    'B+': 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800/60',
    B: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800/60',
    C: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/60',
    F: 'text-red-700 bg-red-50 border-red-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800/60',
  };
  return map[grade] || 'text-gray-700 bg-gray-50 border-gray-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PASS: 'text-green-700 bg-green-50 border-green-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60',
    FAIL: 'text-red-700 bg-red-50 border-red-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800/60',
    ABSENT: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/60',
    PUBLISHED: 'text-green-700 bg-green-50 border-green-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60',
    DRAFT: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
    APPROVED: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800/60',
    SUBMITTED: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800/60',
    UNDER_REVIEW: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/60',
    ACTIVE: 'text-green-700 bg-green-50 border-green-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60',
    INACTIVE: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
    ONGOING: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800/60',
    COMPLETED: 'text-green-700 bg-green-50 border-green-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60',
    UPCOMING: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800/60',
  };
  return map[status] || 'text-gray-700 bg-gray-50 border-gray-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';
}
