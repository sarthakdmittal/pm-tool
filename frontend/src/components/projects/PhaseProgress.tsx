import React from 'react';
import { Phase } from '@/types';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate } from '@/lib/utils';

interface PhaseProgressProps {
  phase: Phase;
}

const PhaseProgress: React.FC<PhaseProgressProps> = ({ phase }) => {
  const phaseLabels: Record<string, string> = {
    supply: 'Supply',
    installation: 'Installation',
    testing: 'Testing',
    handover: 'Handover',
  };

  return (
    <div className="flex flex-col gap-2 p-4 border border-gray-100 rounded-xl bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 text-sm">
            {phaseLabels[phase.phaseName] || phase.phaseName}
          </span>
          <Badge status={phase.status} />
        </div>
        <span className="text-sm font-bold text-gray-700">{Math.round(phase.completionPercent)}%</span>
      </div>
      <ProgressBar value={phase.completionPercent} size="md" />
      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
        <span>Start: {formatDate(phase.startDate)}</span>
        <span>End: {formatDate(phase.endDate)}</span>
      </div>
      {phase.notes && (
        <p className="text-xs text-gray-500 mt-1 italic">{phase.notes}</p>
      )}
    </div>
  );
};

export default PhaseProgress;
