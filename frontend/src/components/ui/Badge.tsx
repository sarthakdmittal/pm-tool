import React from 'react';
import { cx, getStatusColor, formatStatusLabel } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, label, className }) => {
  return (
    <span
      className={cx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {label || formatStatusLabel(status)}
    </span>
  );
};

export default Badge;
