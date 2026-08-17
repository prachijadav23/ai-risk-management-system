export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: n >= 1_000_000 ? 'compact' : 'standard',
  }).format(n);
}

export function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function riskColor(level: string): string {
  switch (level) {
    case 'Critical':
      return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-rose-200 dark:ring-rose-900';
    case 'High':
      return 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 ring-orange-200 dark:ring-orange-900';
    case 'Medium':
      return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 ring-amber-200 dark:ring-amber-900';
    default:
      return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-200 dark:ring-emerald-900';
  }
}

export const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];
