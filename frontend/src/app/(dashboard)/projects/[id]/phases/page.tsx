'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Phase } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatStatusLabel } from '@/lib/utils';

const phaseLabels: Record<string, string> = {
  supply: 'Supply',
  installation: 'Installation',
  testing: 'Testing',
  handover: 'Handover',
};

interface PhaseFormState {
  completionPercent: number;
  status: string;
  notes: string;
  startDate: string;
  endDate: string;
}

export default function PhasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [formStates, setFormStates] = useState<Record<string, PhaseFormState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Phases</h2>
      </div>

      <div className="space-y-5">
        {phases.map((phase) => {
          const fs = formStates[phase._id];
          if (!fs) return null;
          return (
            <div key={phase._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {phaseLabels[phase.phaseName] || phase.phaseName}
                </h3>
                <Badge status={fs.status} />
              </div>

              <div className="mb-4">
                <ProgressBar value={fs.completionPercent} showLabel size="lg" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completion %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={fs.completionPercent}
                    onChange={(e) =>
                      handleChange(phase._id, 'completionPercent', Number(e.target.value))
                    }
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
    </div>
  );
}
