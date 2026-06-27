import React from 'react';
import { cx, getProgressColor } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  colorOverride?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  size = 'md',
  className,
  colorOverride,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const barColor = colorOverride || getProgressColor(clampedValue);

  return (
    <div className={cx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-semibold text-gray-700">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={cx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
