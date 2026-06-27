import React from 'react';
import Link from 'next/link';
import { MapPinIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { Project } from '@/types';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate, getDaysUntil } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const daysRemaining = getDaysUntil(project.endDate);
  const completion = project.overallCompletion ?? 0;

  return (
    <Link href={`/projects/${project._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">{project.name}</h3>
            {project.projectCode && (
              <p className="text-xs text-gray-400 mt-0.5">{project.projectCode}</p>
            )}
          </div>
          <Badge status={project.status} className="ml-2 flex-shrink-0" />
        </div>

        {project.clientName && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{project.clientName}</span>
          </div>
        )}

        {project.location && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span>{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500">Overall Progress</span>
            <span className="text-xs font-semibold text-gray-700">{Math.round(completion)}%</span>
          </div>
          <ProgressBar value={completion} size="sm" />

          <div className="mt-3 flex items-center justify-between">
            <span
              className={
                daysRemaining < 0
                  ? 'text-xs text-red-600 font-medium'
                  : daysRemaining <= 14
                  ? 'text-xs text-orange-600 font-medium'
                  : 'text-xs text-gray-500'
              }
            >
              {daysRemaining < 0
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0
                ? 'Due today'
                : `${daysRemaining} days remaining`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
