'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { Phase } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatStatusLabel } from '@/lib/utils';
import { useForm } from 'react-hook-form';

interface PhaseFormState {
  completionPercent: number;
  status: string;
  notes: string;
  startDate: string;
  endDate: string;
}

interface AddPhaseForm {
  phaseName: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
}

export default function PhasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const admin = isAdmin();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [formStates, setFormStates] = useState<Record<string, PhaseFormState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddPhaseForm>();

  const fetchPhases = async () => {
    try {
      const res = await api.get<Phase[]>(`/api/projects/${id}/phases`);
      setPhases(res.data);
      const initial: Record<string, PhaseFormState> = {};
      res.data.forEach((p) => {
        initial[p._id] = {
          completionPercent: p.completionPercent,
          status: p.status,
          notes: p.notes || '',
          startDate: p.startDate?.slice(0, 10) || '',
          endDate: p.endDate?.slice(0, 10) || '',
        };
      });
      setFormStates(initial);
    } catch {
      toast.error('Failed to load phases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, [id]);

  const handleChange = (phaseId: string, field: keyof PhaseFormState, value: string | number) => {
    setFormStates((prev) => ({
      ...prev,
      [phaseId]: { ...prev[phaseId], [field]: value },
    }));
  };

  const handleSave = async (phaseId: string) => {
    setSavingId(phaseId);
    try {
      const payload = formStates[phaseId];
      await api.put(`/api/projects/${id}/phases/${phaseId}`, payload);
      toast.success('Phase updated');
      setPhases((prev) =>
        prev.map((p) =>
          p._id === phaseId
            ? { ...p, ...payload, completionPercent: Number(payload.completionPercent) } as Phase
            : p
        )
      );
    } catch {
      toast.error('Failed to update phase');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (phaseId: string, phaseName: string) => {
    if (!confirm(`Delete phase "${phaseName}"? This cannot be undone.`)) return;
    setDeletingId(phaseId);
    try {
      await api.delete(`/api/projects/${id}/phases/${phaseId}`);
      toast.success('Phase deleted');
      setPhases((prev) => prev.filter((p) => p._id !== phaseId));
    } catch {
      toast.error('Failed to delete phase');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddPhase = async (data: AddPhaseForm) => {
    setIsAdding(true);
    try {
      await api.post(`/api/projects/${id}/phases`, data);
      toast.success('Phase added');
      setIsAddOpen(false);
      reset();
      fetchPhases();
    } catch {
      toast.error('Failed to add phase');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Phases</h2>
        </div>
        {admin && (
          <Button variant="primary" size="sm" onClick={() => { reset(); setIsAddOpen(true); }}>
            <PlusIcon className="h-4 w-4" /> Add Phase
          </Button>
        )}
      </div>

      <div className="space-y-5">
        {phases.map((phase) => {
          const fs = formStates[phase._id];
          if (!fs) return null;
          return (
            <div key={phase._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {phase.phaseName}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge status={fs.status} />
                  {admin && (
                    <button
                      onClick={() => handleDelete(phase._id, phase.phaseName)}
                      disabled={deletingId === phase._id}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete phase"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <ProgressBar value={fs.completionPercent} showLabel size="lg" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={fs.completionPercent}
                    onChange={(e) => handleChange(phase._id, 'completionPercent', Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={fs.status}
                    onChange={(e) => handleChange(phase._id, 'status', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_started">{formatStatusLabel('not_started')}</option>
                    <option value="in_progress">{formatStatusLabel('in_progress')}</option>
                    <option value="completed">{formatStatusLabel('completed')}</option>
                    <option value="delayed">{formatStatusLabel('delayed')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={fs.startDate}
                    onChange={(e) => handleChange(phase._id, 'startDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={fs.endDate}
                    onChange={(e) => handleChange(phase._id, 'endDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={fs.notes}
                  onChange={(e) => handleChange(phase._id, 'notes', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add notes about this phase..."
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                isLoading={savingId === phase._id}
                onClick={() => handleSave(phase._id)}
              >
                Save Changes
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Phase Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Phase" size="md">
        <form onSubmit={handleSubmit(handleAddPhase)} className="space-y-4">
          <Input
            label="Phase Name *"
            placeholder="e.g. Commissioning, Civil Work..."
            error={errors.phaseName?.message}
            {...register('phaseName', { required: 'Phase name is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="End Date" type="date" {...register('endDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <Input label="Notes" {...register('notes')} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isAdding}>Add Phase</Button>
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
