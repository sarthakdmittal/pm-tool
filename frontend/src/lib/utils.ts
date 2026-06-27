import { format, parseISO, differenceInDays } from 'date-fns';
import clsx, { ClassValue } from 'clsx';

export const cx = (...inputs: ClassValue[]): string => clsx(...inputs);

export const formatDate = (d: string | Date | undefined | null): string => {
  if (!d) return 'N/A';
  try {
    const date = typeof d === 'string' ? parseISO(d) : d;
    return format(date, 'dd MMM yyyy');
  } catch {
    return 'Invalid date';
  }
};

export const formatPercent = (n: number): string => {
  return `${Math.round(n)}%`;
};

export const formatCurrency = (n: number): string => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    delayed: 'bg-red-100 text-red-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    not_started: 'bg-gray-100 text-gray-600',
    partial: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    supply: 'bg-purple-100 text-purple-800',
    installation: 'bg-blue-100 text-blue-800',
    testing: 'bg-orange-100 text-orange-800',
    handover: 'bg-green-100 text-green-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const getProgressColor = (percent: number): string => {
  if (percent >= 70) return 'bg-green-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getDaysUntil = (date: string): number => {
  try {
    return differenceInDays(parseISO(date), new Date());
  } catch {
    return 0;
  }
};

export const formatStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    active: 'Active',
    completed: 'Completed',
    delayed: 'Delayed',
    on_hold: 'On Hold',
    pending: 'Pending',
    in_progress: 'In Progress',
    done: 'Done',
    overdue: 'Overdue',
    not_started: 'Not Started',
    partial: 'Partial',
    delivered: 'Delivered',
    supply: 'Supply',
    installation: 'Installation',
    testing: 'Testing',
    handover: 'Handover',
  };
  return map[status] || status;
};
