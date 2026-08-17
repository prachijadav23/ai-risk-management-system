import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon,
  trend,
  accent = 'brand',
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  accent?: 'brand' | 'green' | 'amber' | 'rose' | 'cyan';
  index?: number;
}) {
  const accents = {
    brand: 'from-brand-500/10 to-brand-600/5 text-brand-600',
    green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600',
    rose: 'from-rose-500/10 to-rose-600/5 text-rose-600',
    cyan: 'from-cyan-500/10 to-cyan-600/5 text-cyan-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br', accents[accent])}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
    </motion.div>
  );
}
