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
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';

interface DeviceStat {
  installed: number;
  expected: number;
  remaining: number;
  completionPercent: number;
}

interface ActiveDeviceResponse {
  entries: ActiveDevice[];
  columns: string[];
  expectedTotals: Record<string, number>;
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
  // Form state for device quantities per column
  const [formQtys, setFormQtys] = useState<Record<string, number>>({});
  const [formArea, setFormArea] = useState('');
  const [formSNo, setFormSNo] = useState<number | ''>('');
  const [expectedQtys, setExpectedQtys] = useState<Record<string, number>>({});
  const [isSavingExpected, setIsSavingExpected] = useState(false);
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const res = await api.get<ActiveDeviceResponse>(
        `/api/projects/${id}/active-devices`
      );
      setData(res.data);
      // Initialize expected quantities from server data
      const initExpected: Record<string, number> = {};
      (res.data.columns || []).forEach((col) => {
        initExpected[col] = res.data.expectedTotals?.[col] ?? 0;
      });
      setExpectedQtys(initExpected);
    } catch {
      toast.error('Failed to load active devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const openAdd = () => {
    setEditingEntry(null);
    setFormArea('');
    setFormSNo('');
    const qtys: Record<string, number> = {};
    (data?.columns || []).forEach((col) => { qtys[col] = 0; });
    setFormQtys(qtys);
    setIsModalOpen(true);
  };

  const openEdit = (entry: ActiveDevice) => {
    setEditingEntry(entry);
    setFormArea(entry.areaLocation);
    setFormSNo(entry.sNo ?? '');
    const qtys: Record<string, number> = {};
    (data?.columns || []).forEach((col) => { qtys[col] = 0; });
    entry.deviceItems.forEach((item) => { qtys[item.itemName] = item.quantity; });
    setFormQtys(qtys);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formArea.trim()) {
      toast.error('Area/Location is required');
      return;
    }
    setIsSaving(true);
    try {
      const columns = data?.columns || [];
      const deviceItems = columns.map((col) => ({
        itemName: col,
        quantity: Number(formQtys[col]) || 0,
      }));
      const payload = {
        sNo: formSNo !== '' ? Number(formSNo) : undefined,
        areaLocation: formArea,
        deviceItems,
      };

      if (editingEntry) {
        await api.put(
          `/api/projects/${id}/active-devices/${editingEntry._id}`,
          payload
        );
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

  const handleSaveExpectedTotals = async () => {
    setIsSavingExpected(true);
    try {
      await api.put(`/api/projects/${id}/active-devices/columns`, {
        columnTotals: expectedQtys,
      });
      toast.success('Expected quantities saved');
      fetchData();
    } catch {
      toast.error('Failed to save expected quantities');
    } finally {
      setIsSavingExpected(false);
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

      {/* Set Expected Quantities (admin only) */}
      {admin && columns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Set Expected Quantities</h3>
          <p className="text-xs text-gray-500 mb-3">
            Enter the total expected quantity for each device type to track completion %.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {columns.map((col) => (
              <div key={col}>
                <label className="block text-xs text-gray-600 mb-1">{col} (expected)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={expectedQtys[col] ?? 0}
                  onChange={(e) =>
                    setExpectedQtys((prev) => ({
                      ...prev,
                      [col]: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <Button variant="primary" size="sm" isLoading={isSavingExpected} onClick={handleSaveExpectedTotals}>
            Save Expected Quantities
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Total Locations
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.totalLocations ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Total Installed
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {summary?.totalDevicesInstalled ?? 0}
          </p>
        </div>
      </div>

      {/* Per-device type stats */}
      {columns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
            Device Type Breakdown (Installed / Expected)
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
                    <span>Expected: <strong>{stat?.expected ?? 0}</strong></span>
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
                  <th key={col} className="px-3 py-3 font-medium text-right whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + columns.length}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No entries yet
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{entry.sNo ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">
                      {entry.areaLocation}
                    </td>
                    {columns.map((col) => {
                      const item = entry.deviceItems.find((d) => d.itemName === col);
                      return (
                        <td key={col} className="px-3 py-2.5 text-right text-gray-600">
                          {item ? item.quantity : 0}
                        </td>
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
            {entries.length > 0 && columns.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr className="font-semibold text-gray-800 text-sm">
                  <td className="px-3 py-3" colSpan={2}>
                    TOTAL
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-3 text-right">
                      {summary?.columnTotals?.[col] ?? 0}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area / Location *
              </label>
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
              <div className="grid grid-cols-2 gap-3">
                {columns.map((col) => (
                  <div key={col}>
                    <label className="block text-xs text-gray-600 mb-1">{col}</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formQtys[col] ?? 0}
                      onChange={(e) =>
                        setFormQtys((prev) => ({
                          ...prev,
                          [col]: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {columns.length === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              No device columns configured for this project. Upload an Excel file first, or add
              columns via the API.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="primary" isLoading={isSaving} onClick={handleSave}>
              {editingEntry ? 'Update' : 'Add Entry'}
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
