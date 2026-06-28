'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { ActiveDevice } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';

interface DeviceStat {
  installed: number;
  remaining: number;
  completionPercent: number;
}

interface ActiveDeviceResponse {
  entries: ActiveDevice[];
  columns: string[];
  summary: {
    totalLocations: number;
    totalDevicesInstalled: number;
    columnTotals: Record<string, number>;
    deviceStats: Record<string, DeviceStat>;
  };
}

export default function ActiveDevicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ActiveDeviceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ActiveDevice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formArea, setFormArea] = useState('');
  const [formSNo, setFormSNo] = useState<number | ''>('');
  // Per-device: installed and remaining
  const [formInstalled, setFormInstalled] = useState<Record<string, number>>({});
  const [formRemaining, setFormRemaining] = useState<Record<string, number>>({});
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const res = await api.get<ActiveDeviceResponse>(`/api/projects/${id}/active-devices`);
      setData(res.data);
    } catch {
      toast.error('Failed to load active devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const initForm = (entry?: ActiveDevice) => {
    const cols = data?.columns || [];
    const installed: Record<string, number> = {};
    const remaining: Record<string, number> = {};
    cols.forEach((col) => { installed[col] = 0; remaining[col] = 0; });
    if (entry) {
      entry.deviceItems.forEach((item) => {
        installed[item.itemName] = (item as any).installed ?? (item as any).quantity ?? 0;
        remaining[item.itemName] = (item as any).remaining ?? 0;
      });
    }
    setFormInstalled(installed);
    setFormRemaining(remaining);
  };

  const openAdd = () => {
    setEditingEntry(null);
    setFormArea('');
    setFormSNo('');
    initForm();
    setIsModalOpen(true);
  };

  const openEdit = (entry: ActiveDevice) => {
    setEditingEntry(entry);
    setFormArea(entry.areaLocation);
    setFormSNo(entry.sNo ?? '');
    initForm(entry);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formArea.trim()) { toast.error('Area/Location is required'); return; }
    setIsSaving(true);
    try {
      const columns = data?.columns || [];
      const deviceItems = columns.map((col) => ({
        itemName: col,
        installed: Number(formInstalled[col]) || 0,
        remaining: Number(formRemaining[col]) || 0,
      }));
      const payload = {
        sNo: formSNo !== '' ? Number(formSNo) : undefined,
        areaLocation: formArea,
        deviceItems,
      };

      if (editingEntry) {
        await api.put(`/api/projects/${id}/active-devices/${editingEntry._id}`, payload);
        toast.success('Entry updated');
      } else {
        await api.post(`/api/projects/${id}/active-devices`, payload);
        toast.success('Entry added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/api/projects/${id}/active-devices/${entryId}`);
      toast.success('Entry deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const columns = data?.columns || [];
  const entries = data?.entries || [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Active Device Installation</h2>
        </div>
        {admin && (
          <Button variant="primary" size="sm" onClick={openAdd}>
            <PlusIcon className="h-4 w-4" /> Add Entry
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Locations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.totalLocations ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Installed</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{summary?.totalDevicesInstalled ?? 0}</p>
        </div>
      </div>

      {/* Per-device type stats */}
      {columns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
            Device Type Breakdown
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {columns.map((col) => {
              const stat = summary?.deviceStats?.[col];
              return (
                <div key={col} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{col}</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {stat?.completionPercent ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={stat?.completionPercent ?? 0} size="sm" />
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>Installed: <strong>{stat?.installed ?? 0}</strong></span>
                    <span>Remaining: <strong>{stat?.remaining ?? 0}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-3 py-3 font-medium">S.No</th>
                <th className="px-3 py-3 font-medium">Area / Location</th>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-3 font-medium text-center whitespace-nowrap" colSpan={2}>
                    {col}
                  </th>
                ))}
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
              {columns.length > 0 && (
                <tr className="text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                  <th colSpan={2} />
                  {columns.map((col) => (
                    <React.Fragment key={col}>
                      <th className="px-3 py-1 font-medium text-center text-green-600">Installed</th>
                      <th className="px-3 py-1 font-medium text-center text-orange-500">Remaining</th>
                    </React.Fragment>
                  ))}
                  <th />
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={3 + columns.length * 2} className="px-4 py-12 text-center text-gray-400">
                    No entries yet
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{entry.sNo ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{entry.areaLocation}</td>
                    {columns.map((col) => {
                      const item = entry.deviceItems.find((d) => d.itemName === col);
                      return (
                        <React.Fragment key={col}>
                          <td className="px-3 py-2.5 text-center text-green-700 font-medium">
                            {(item as any)?.installed ?? (item as any)?.quantity ?? 0}
                          </td>
                          <td className="px-3 py-2.5 text-center text-orange-600 font-medium">
                            {(item as any)?.remaining ?? 0}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {admin && (
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Edit Entry' : 'Add Entry'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">S.No.</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formSNo}
                onChange={(e) => setFormSNo(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area / Location *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
              />
            </div>
          </div>

          {columns.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Device Quantities</p>
              <div className="space-y-3">
                {columns.map((col) => (
                  <div key={col} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">{col}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Installed</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={formInstalled[col] ?? 0}
                          onChange={(e) =>
                            setFormInstalled((prev) => ({ ...prev, [col]: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-orange-600 font-medium mb-1">Remaining</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={formRemaining[col] ?? 0}
                          onChange={(e) =>
                            setFormRemaining((prev) => ({ ...prev, [col]: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="primary" isLoading={isSaving} onClick={handleSave}>
              {editingEntry ? 'Update' : 'Add Entry'}
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
