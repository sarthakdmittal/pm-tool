'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Project } from '@/types';
import StatsCard from '@/components/projects/StatsCard';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate, getDaysUntil } from '@/lib/utils';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get<Project[]>('/api/projects');
        setProjects(res.data);
      } catch {
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const delayedProjects = projects.filter((p) => p.status === 'delayed').length;

  const recentProjects = projects.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of all your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Total Projects"
          value={totalProjects}
          icon={<FolderIcon className="h-6 w-6" />}
          accent="blue"
        />
        <StatsCard
          label="Active"
          value={activeProjects}
          icon={<ClockIcon className="h-6 w-6" />}
          accent="blue"
        />
        <StatsCard
          label="Completed"
          value={completedProjects}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          accent="green"
        />
        <StatsCard
          label="Delayed"
          value={delayedProjects}
          icon={<ExclamationTriangleIcon className="h-6 w-6" />}
          accent="red"
        />
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Projects</h3>
          <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No projects yet</p>
            <p className="text-sm mt-1">
              <Link href="/projects/new" className="text-blue-600 hover:underline">
                Create your first project
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Progress</th>
                  <th className="px-6 py-3 font-medium">End Date</th>
                  <th className="px-6 py-3 font-medium">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentProjects.map((project) => {
                  const days = getDaysUntil(project.endDate);
                  const completion = project.overallCompletion ?? 0;
                  return (
                    <tr key={project._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/projects/${project._id}`} className="hover:text-blue-600">
                          <p className="font-medium text-gray-900">{project.name}</p>
                          {project.clientName && (
                            <p className="text-xs text-gray-400">{project.clientName}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={project.status} />
                      </td>
                      <td className="px-6 py-4 w-40">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={completion} size="sm" className="flex-1" />
                          <span className="text-xs text-gray-600 w-8 text-right">
                            {Math.round(completion)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(project.endDate)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            days < 0
                              ? 'text-xs font-medium text-red-600'
                              : days <= 14
                              ? 'text-xs font-medium text-orange-600'
                              : 'text-xs text-gray-600'
                          }
                        >
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
