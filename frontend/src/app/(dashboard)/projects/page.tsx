'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { Project } from '@/types';
import ProjectCard from '@/components/projects/ProjectCard';
import Button from '@/components/ui/Button';
import { cx } from '@/lib/utils';

type FilterStatus = 'all' | 'active' | 'completed' | 'delayed' | 'on_hold';

const filterTabs: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'On Hold', value: 'on_hold' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const admin = isAdmin();

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

  const filtered =
    activeFilter === 'all' ? projects : projects.filter((p) => p.status === activeFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/upload">
            <Button variant="secondary" size="md">
              <ArrowUpTrayIcon className="h-4 w-4" />
              Upload Excel
            </Button>
          </Link>
          {admin && (
            <Link href="/projects/new">
              <Button variant="primary" size="md">
                <PlusIcon className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {filterTabs.map((tab) => {
          const count =
            tab.value === 'all'
              ? projects.length
              : projects.filter((p) => p.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No projects found</p>
          {activeFilter === 'all' && (
            <p className="mt-2">
              <Link href="/projects/new" className="text-blue-600 hover:underline">
                Create your first project
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
