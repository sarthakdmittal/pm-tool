import React from 'react';
import { cx } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card: React.FC<CardProps> = ({ children, className, padding = 'md' }) => {
  return (
    <div
      className={cx(
        'bg-white rounded-xl shadow-sm border border-gray-100',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
