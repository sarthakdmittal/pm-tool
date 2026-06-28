'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  PhoneIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Project, ProjectStats } from '@/types';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/projects/StatsCard';
import PhaseProgress from '@/components/projects/PhaseProgress';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate, formatPercent, cx } from '@/lib/utils';
import { useForm } from 'react-hook-form';

interface EditForm {
  name: string;
  clientName: string;
  location: string;
  projectCode: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>();

  const fetchData = async () => {
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get<Project>(`/api/projects/${id}`),
        api.get<ProjectStats>(`/api/projects/${id}/stats`),
      ]);
      setProject(projRes.data);
      setStats(statsRes.data);
      reset({
        name: projRes.data.name,
        clientName: projRes.data.clientName || '',
        location: projRes.data.location || '',
        projectCode: projRes.data.projectCode || '',
        description: projRes.data.description || '',
        startDate: projRes.data.startDate?.slice(0, 10),
        endDate: projRes.data.endDate?.slice(0, 10),
        status: projRes.data.status,
      });
    } catch {
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEdit = async (data: EditForm) => {
    setIsSaving(true);
    try {
      await api.put(`/api/projects/${id}`, data);
      toast.success('Project updated');
      setIsEditOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/projects/${id}`);
      toast.success('Project deleted');
      router.push('/projects');
    } catch {
      toast.error('Failed to delete project');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project || !stats) return null;

  const { materialStats, passiveStats, epbaxStats, activeDeviceStats } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <Badge status={project.status} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {project.clientName && (
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" /> {project.clientName}
              </span>
            )}
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" /> {project.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
            </span>
            {project.projectCode && (
              <span className="text-gray-400 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                {project.projectCode}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
            <PencilIcon className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            <TrashIcon className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={cx(
          'rounded-xl px-5 py-3 flex items-center gap-3 text-sm font-medium',
          stats.isOnTrack
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        )}
      >
        {stats.isOnTrack ? (
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
        ) : (
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        )}
        {stats.isOnTrack
          ? `Project is on track — ${formatPercent(stats.overallCompletion)} complete vs ${formatPercent(stats.expectedCompletion)} expected`
          : `Project is behind schedule — ${formatPercent(stats.overallCompletion)} complete vs ${formatPercent(stats.expectedCompletion)} expected`}
      </div>

      {/* Big stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Overall Complete"
          value={formatPercent(stats.overallCompletion)}
          subtitle="Avg of all phases"
          icon={<CheckCircleIcon className="h-6 w-6" />}
          accent={stats.isOnTrack ? 'green' : 'red'}
        />
        <StatsCard
          label="Expected by Now"
          value={formatPercent(stats.expectedCompletion)}
          subtitle="Based on timeline"
          icon={<ClockIcon className="h-6 w-6" />}
          accent="blue"
        />
        <StatsCard
          label="Days Remaining"
          value={stats.daysRemaining}
          subtitle={`of ${stats.daysTotal} total days`}
          icon={<CalendarIcon className="h-6 w-6" />}
          accent={stats.daysRemaining < 14 ? 'red' : 'blue'}
        />
        <StatsCard
          label="Materials Closed"
          value={`${materialStats?.closed ?? 0}/${materialStats?.total ?? 0}`}
          subtitle={`${materialStats?.completionPercent ?? 0}% completion`}
          icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
          accent="purple"
        />
      </div>

      {/* Phase Progress */}
      {stats.phases.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Phase Progress</h3>
            <Link href={`/projects/${id}/phases`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Edit Phases →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.phases.map((phase) => (
              <PhaseProgress key={phase._id} phase={phase} />
            ))}
          </div>
        </div>
      )}

      {/* New data summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Materials summary */}
        <Link href={`/projects/${project._id}/materials`} className="block group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 transition-colors h-full">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Materials</h3>
            </div>
            <div className="flex gap-4 text-sm mb-3">
              <span className="text-green-600 font-semibold">
                {materialStats?.closed ?? 0} Closed
              </span>
              <span className="text-orange-500 font-semibold">
                {materialStats?.open ?? 0} Open
              </span>
              <span className="text-gray-500">{materialStats?.total ?? 0} Total</span>
            </div>
            <ProgressBar value={materialStats?.completionPercent ?? 0} size="sm" />
            <p className="text-xs text-gray-400 mt-1">{materialStats?.completionPercent ?? 0}% closed</p>
          </div>
        </Link>

        {/* EPBAX summary */}
        <Link href={`/projects/${project._id}/epbax`} className="block group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 transition-colors h-full">
            <div className="flex items-center gap-2 mb-3">
              <PhoneIcon className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900">EPBAX</h3>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800">{epbaxStats?.total ?? 0}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {epbaxStats?.installedCount ?? 0}
                </div>
                <div className="text-xs text-gray-500">Installed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {epbaxStats?.handedOverCount ?? 0}
                </div>
                <div className="text-xs text-gray-500">Handed Over</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Passive summary */}
        <Link href={`/projects/${project._id}/passive`} className="block group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 transition-colors h-full">
            <div className="flex items-center gap-2 mb-3">
              <WifiIcon className="h-5 w-5 text-teal-500" />
              <h3 className="font-semibold text-gray-900">Passive Cabling</h3>
            </div>
            <div className="flex gap-4 text-sm mb-3">
              <span className="text-gray-600">
                <strong>{passiveStats?.totalCompleted?.toLocaleString() ?? 0}</strong> m done
              </span>
              <span className="text-gray-400">
                / {passiveStats?.totalAllocated?.toLocaleString() ?? 0} m
              </span>
            </div>
            <ProgressBar value={passiveStats?.completionPercent ?? 0} size="sm" />
            <p className="text-xs text-gray-400 mt-1">{passiveStats?.completionPercent ?? 0}% complete</p>
          </div>
        </Link>
      </div>

      {/* Active Device summary */}
      {(activeDeviceStats?.columns?.length ?? 0) > 0 && (
        <Link href={`/projects/${project._id}/active-devices`} className="block group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <CpuChipIcon className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">Active Device Installation</h3>
              <span className="text-xs text-gray-400 ml-auto">
                {activeDeviceStats?.totalLocations ?? 0} locations &bull;{' '}
                {activeDeviceStats?.totalDevicesInstalled ?? 0} total devices
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {(activeDeviceStats?.columns ?? []).map((col) => (
                <div key={col} className="text-center min-w-[60px]">
                  <div className="text-xl font-bold text-gray-800">
                    {activeDeviceStats?.columnTotals?.[col] ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{col}</div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      )}

      {/* Task summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Task Summary</h3>
        <div className="flex flex-wrap gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.taskStats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.taskStats.done}</div>
            <div className="text-xs text-gray-500 mt-1">Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.taskStats.inProgress}</div>
            <div className="text-xs text-gray-500 mt-1">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.taskStats.pending}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.taskStats.overdue}</div>
            <div className="text-xs text-gray-500 mt-1">Overdue</div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project" size="lg">
        <form onSubmit={handleSubmit(handleEdit)} className="space-y-4">
          <Input
            label="Project Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" {...register('clientName')} />
            <Input label="Project Code" {...register('projectCode')} />
          </div>
          <Input label="Location" {...register('location')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="End Date" type="date" {...register('endDate')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Project"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{project.name}</strong>? This will also delete all
          phases, materials, tasks, active devices, EPBAX, and passive cabling data. This action
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
            Yes, Delete
          </Button>
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
