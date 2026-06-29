'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, BellIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';
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

interface NotifyForm {
  email: string;
  phone: string;
  channel: 'email' | 'whatsapp' | 'both';
  customMessage: string;
}

interface NotifConfig { email: boolean; whatsapp: boolean; }

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Notification state
  const [notifConfig, setNotifConfig] = useState<NotifConfig>({ email: false, whatsapp: false });
  const [allUsers, setAllUsers] = useState<{ name: string; email: string; phone?: string | null }[]>([]);
  const [notifyTask, setNotifyTask] = useState<Task | null>(null);
  const [notifyForm, setNotifyForm] = useState<NotifyForm>({ email: '', phone: '', channel: 'email', customMessage: '' });
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [isNotifyingOverdue, setIsNotifyingOverdue] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskForm>();
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const [taskRes, phaseRes] = await Promise.all([
        api.get<Task[]>(`/api/projects/${id}/tasks`),
        api.get<Phase[]>(`/api/projects/${id}/phases`),
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
    api.get<NotifConfig>('/api/notifications/config').then((r) => setNotifConfig(r.data)).catch(() => {});
    if (admin) {
      api.get<{ name: string; email: string; phone?: string | null }[]>('/api/auth/users')
        .then((r) => setAllUsers(r.data))
        .catch(() => {});
    }
  }, [id]);

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
        await api.put(`/api/projects/${id}/tasks/${editingTask._id}`, data);
        toast.success('Task updated');
      } else {
        await api.post(`/api/projects/${id}/tasks`, data);
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

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/projects/${id}/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openNotify = (task: Task) => {
    setNotifyTask(task);
    // Auto-fill from matched user
    const matched = allUsers.find(
      (u) => u.name.toLowerCase() === (task.assignedTo || '').toLowerCase()
    );
    setNotifyForm({
      email: matched?.email || '',
      phone: matched?.phone || '',
      channel: notifConfig.email ? 'email' : 'whatsapp',
      customMessage: '',
    });
  };

  const handleSendNotification = async () => {
    if (!notifyTask) return;
    if (!notifyForm.email && !notifyForm.phone) {
      toast.error('Enter at least one recipient (email or phone)');
      return;
    }
    setIsSendingNotif(true);
    try {
      const res = await api.post<{ message: string; errors: string[] }>(
        `/api/projects/${id}/tasks/${notifyTask._id}/notify`,
        notifyForm
      );
      toast.success(res.data.message);
      if (res.data.errors?.length) toast.error(res.data.errors.join('; '));
      setNotifyTask(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Notification failed';
      toast.error(msg);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleNotifyOverdue = async () => {
    if (!confirm('Send notifications to all overdue task assignees?')) return;
    setIsNotifyingOverdue(true);
    try {
      const res = await api.post<{ message: string }>(`/api/projects/${id}/notify-overdue`, {
        channel: notifConfig.email && notifConfig.whatsapp ? 'both' : notifConfig.email ? 'email' : 'whatsapp',
      });
      toast.success(res.data.message);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.error(msg);
    } finally {
      setIsNotifyingOverdue(false);
    }
  };

  const filtered = phaseFilter ? tasks.filter((t) => t.phaseName === phaseFilter) : tasks;
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
  const notifEnabled = notifConfig.email || notifConfig.whatsapp;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <span className="text-sm text-gray-500">({tasks.length} total)</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {admin && notifEnabled && overdueCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isNotifyingOverdue}
              onClick={handleNotifyOverdue}
            >
              <BellIcon className="h-4 w-4 text-orange-500" />
              Notify Overdue ({overdueCount})
            </Button>
          )}
          {admin && (
            <Button variant="primary" size="sm" onClick={openAdd}>
              <PlusIcon className="h-4 w-4" /> Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Notification channel warning (admin only) */}
      {admin && !notifEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          Notifications are not configured. Add <strong>EMAIL_USER</strong> / <strong>EMAIL_PASS</strong> or
          WhatsApp env vars on Render to enable task alerts.
        </div>
      )}

      {/* Phase Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setPhaseFilter('')}
          className={cx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            phaseFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
        >
          All Phases
        </button>
        {phases.map((p) => (
          <button
            key={p._id}
            onClick={() => setPhaseFilter(p.phaseName)}
            className={cx('px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              phaseFilter === p.phaseName ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
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
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">No tasks found</td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr
                    key={task._id}
                    className={cx('hover:bg-gray-50 transition-colors',
                      task.status === 'overdue' && 'bg-red-50 hover:bg-red-50')}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.phaseName ? <Badge status={task.phaseName} /> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{task.assignedTo || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{task.startDate ? formatDate(task.startDate) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{task.completedDate ? formatDate(task.completedDate) : '—'}</td>
                    <td className="px-4 py-3"><Badge status={task.status} /></td>
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
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {admin && notifEnabled && (
                          <button
                            onClick={() => openNotify(task)}
                            className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                            title="Send notification"
                          >
                            <BellIcon className="h-4 w-4" />
                          </button>
                        )}
                        {admin && (
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Add Task'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Task Name *" error={errors.name?.message} {...register('name', { required: 'Required' })} />
          <Input label="Description" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('phaseName')}>
                <option value="">— No Phase —</option>
                {phases.map((p) => (
                  <option key={p._id} value={p.phaseName}>{p.phaseName.charAt(0).toUpperCase() + p.phaseName.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('assignedTo')}
              >
                <option value="">— Unassigned —</option>
                {allUsers.map((u) => (
                  <option key={u.email} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="Due Date" type="date" {...register('dueDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('status')}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <Input label="Completion %" type="number" min={0} max={100} {...register('completionPercent')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>{editingTask ? 'Update Task' : 'Add Task'}</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Notification Modal */}
      <Modal isOpen={!!notifyTask} onClose={() => setNotifyTask(null)} title="Send Task Notification" size="md">
        {notifyTask && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-800">{notifyTask.name}</p>
              <div className="flex gap-3 mt-1 text-gray-500 text-xs">
                <Badge status={notifyTask.status} />
                {notifyTask.assignedTo && <span>Assigned: {notifyTask.assignedTo}</span>}
                {notifyTask.dueDate && <span>Due: {formatDate(notifyTask.dueDate)}</span>}
              </div>
            </div>

            {/* Channel selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send via</label>
              <select
                value={notifyForm.channel}
                onChange={(e) => setNotifyForm((f) => ({ ...f, channel: e.target.value as NotifyForm['channel'] }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {notifConfig.email && <option value="email">Email</option>}
                {notifConfig.whatsapp && <option value="whatsapp">WhatsApp</option>}
                {notifConfig.email && notifConfig.whatsapp && <option value="both">Both (Email + WhatsApp)</option>}
              </select>
            </div>

            {(notifyForm.channel === 'email' || notifyForm.channel === 'both') && notifConfig.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email *</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={notifyForm.email}
                  onChange={(e) => setNotifyForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {(notifyForm.channel === 'whatsapp' || notifyForm.channel === 'both') && notifConfig.whatsapp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Phone *</label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={notifyForm.phone}
                  onChange={(e) => setNotifyForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom message (optional)</label>
              <textarea
                rows={2}
                value={notifyForm.customMessage}
                onChange={(e) => setNotifyForm((f) => ({ ...f, customMessage: e.target.value }))}
                placeholder="Add a personal note to the notification..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="primary" isLoading={isSendingNotif} onClick={handleSendNotification}>
                <BellIcon className="h-4 w-4" /> Send Notification
              </Button>
              <Button variant="secondary" onClick={() => setNotifyTask(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
