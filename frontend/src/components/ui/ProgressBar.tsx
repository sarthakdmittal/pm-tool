import React from 'react';
import { cx } from '@/lib/utils';

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

// Use inline style so the color is never purged by Tailwind's JIT scanner
function barBgColor(percent: number): string {
  if (percent >= 70) return '#22c55e'; // green-500
  if (percent >= 40) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  size = 'md',
  className,
  colorOverride,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

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
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%`, backgroundColor: colorOverride || barBgColor(clampedValue) }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
