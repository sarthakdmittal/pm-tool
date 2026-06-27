'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Task, Phase } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate, cx } from '@/lib/utils';

interface TaskForm {
  name: string;
  description: string;
  phaseName: string;
  assignedTo: string;
  startDate: string;
  dueDate: string;
  status: string;
  completionPercent: number;
}

export default function TasksPage({ params }: { params: { id: string } }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskForm>();

  const fetchData = async () => {
    try {
      const [taskRes, phaseRes] = await Promise.all([
        api.get<Task[]>(`/api/projects/${params.id}/tasks`),
        api.get<Phase[]>(`/api/projects/${params.id}/phases`),
      ]);
      setTasks(taskRes.data);
      setPhases(phaseRes.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const openAdd = () => {
    setEditingTask(null);
    reset({ status: 'pending', completionPercent: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    reset({
      name: task.name,
      description: task.description || '',
      phaseName: task.phaseName || '',
      assignedTo: task.assignedTo || '',
      startDate: task.startDate?.slice(0, 10) || '',
      dueDate: task.dueDate?.slice(0, 10) || '',
      status: task.status,
      completionPercent: task.completionPercent,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: TaskForm) => {
    setIsSaving(true);
    try {
      if (editingTask) {
        await api.put(`/api/projects/${params.id}/tasks/${editingTask._id}`, data);
        toast.success('Task updated');
      } else {
        await api.post(`/api/projects/${params.id}/tasks`, data);
        toast.success('Task created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/projects/${params.id}/tasks/${id}`);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = phaseFilter ? tasks.filter((t) => t.phaseName === phaseFilter) : tasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <span className="text-sm text-gray-500">({tasks.length} total)</span>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Phase Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setPhaseFilter('')}
          className={cx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            phaseFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All Phases
        </button>
        {phases.map((p) => (
          <button
            key={p._id}
            onClick={() => setPhaseFilter(p.phaseName)}
            className={cx(
              'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              phaseFilter === p.phaseName
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {p.phaseName}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Completed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">% Done</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr
                    key={task._id}
                    className={cx(
                      'hover:bg-gray-50 transition-colors',
                      task.status === 'overdue' && 'bg-red-50 hover:bg-red-50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.phaseName ? <Badge status={task.phaseName} /> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{task.assignedTo || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.startDate ? formatDate(task.startDate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.completedDate ? formatDate(task.completedDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={task.status} />
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={task.completionPercent} size="sm" className="flex-1" />
                        <span className="text-xs text-gray-600 w-8">{task.completionPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(task)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Task Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Required' })}
          />
          <Input label="Description" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('phaseName')}
              >
                <option value="">— No Phase —</option>
                {phases.map((p) => (
                  <option key={p._id} value={p.phaseName}>
                    {p.phaseName.charAt(0).toUpperCase() + p.phaseName.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Assigned To" placeholder="Team member name" {...register('assignedTo')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="Due Date" type="date" {...register('dueDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('status')}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <Input
              label="Completion %"
              type="number"
              min={0}
              max={100}
              {...register('completionPercent')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
