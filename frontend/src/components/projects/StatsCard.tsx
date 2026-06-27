import React from 'react';
import { cx } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

const accentClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600',
};

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accent = 'blue',
  className,
}) => {
  return (
    <div
      className={cx(
        'bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4',
        className
      )}
    >
      {icon && (
        <div className={cx('p-3 rounded-xl flex-shrink-0', accentClasses[accent])}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
