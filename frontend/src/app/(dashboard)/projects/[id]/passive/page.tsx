'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { PassiveItem } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';

interface PassiveResponse {
  items: PassiveItem[];
  summary: {
    totalAllocated: number;
    totalCompleted: number;
    completionPercent: number;
  };
}

interface PassiveForm {
  slNo: number;
  location: string;
  cablingAllocated: number;
  cablingCompleted: number;
  cablingVendor: string;
  remarks: string;
}

export default function PassivePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PassiveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PassiveItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PassiveForm>();

  const fetchData = async () => {
    try {
      const res = await api.get<PassiveResponse>(`/api/projects/${params.id}/passive`);
      setData(res.data);
    } catch {
      toast.error('Failed to load passive cabling data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const openAdd = () => {
    setEditingItem(null);
    reset({ cablingAllocated: 0, cablingCompleted: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (item: PassiveItem) => {
    setEditingItem(item);
    reset({
      slNo: item.slNo,
      location: item.location,
      cablingAllocated: item.cablingAllocated,
      cablingCompleted: item.cablingCompleted,
      cablingVendor: item.cablingVendor || '',
      remarks: item.remarks || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: PassiveForm) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await api.put(`/api/projects/${params.id}/passive/${editingItem._id}`, formData);
        toast.success('Item updated');
      } else {
        await api.post(`/api/projects/${params.id}/passive`, formData);
        toast.success('Item added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/api/projects/${params.id}/passive/${id}`);
      toast.success('Item deleted');
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

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Passive Cabling</h2>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Total Allocated (m)
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.totalAllocated?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Total Completed (m)
          </p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {summary?.totalCompleted?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Completion %
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {summary?.completionPercent ?? 0}%
          </p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Overall Cabling Completion</p>
          <span className="text-sm font-semibold text-gray-700">
            {summary?.completionPercent ?? 0}%
          </span>
        </div>
        <ProgressBar value={summary?.completionPercent ?? 0} size="lg" />
        <p className="text-xs text-gray-500 mt-2">
          {summary?.totalCompleted?.toLocaleString() ?? 0} m completed of{' '}
          {summary?.totalAllocated?.toLocaleString() ?? 0} m allocated
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-3 py-3 font-medium">Sl.No</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium text-right">Allocated (m)</th>
                <th className="px-3 py-3 font-medium text-right">Completed (m)</th>
                <th className="px-3 py-3 font-medium">Vendor</th>
                <th className="px-3 py-3 font-medium">Remarks</th>
                <th className="px-3 py-3 font-medium w-32">Progress</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No passive cabling items yet
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const pct =
                    item.cablingAllocated > 0
                      ? Math.min(
                          100,
                          Math.round((item.cablingCompleted / item.cablingAllocated) * 100)
                        )
                      : 0;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{item.slNo ?? '—'}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{item.location}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.cablingAllocated.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.cablingCompleted.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">
                        {item.cablingVendor || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{item.remarks || '—'}</td>
                      <td className="px-3 py-2.5 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <ProgressBar value={pct} size="sm" />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr className="font-semibold text-gray-800 text-sm">
                  <td className="px-3 py-3" colSpan={2}>
                    TOTAL
                  </td>
                  <td className="px-3 py-3 text-right">
                    {summary?.totalAllocated?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {summary?.totalCompleted?.toLocaleString() ?? 0}
                  </td>
                  <td colSpan={2} />
                  <td className="px-3 py-3">{summary?.completionPercent ?? 0}%</td>
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
        title={editingItem ? 'Edit Passive Item' : 'Add Passive Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Sl.No." type="number" {...register('slNo')} />
            <Input
              label="Location *"
              error={errors.location?.message}
              {...register('location', { required: 'Required' })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cabling Allocated (Approx) in Mtrs"
              type="number"
              min={0}
              step="0.01"
              {...register('cablingAllocated')}
            />
            <Input
              label="Cabling Completed (Approx) in Mtrs"
              type="number"
              min={0}
              step="0.01"
              {...register('cablingCompleted')}
            />
          </div>
          <Input label="Cabling Vendor" {...register('cablingVendor')} />
          <Input label="Remarks" {...register('remarks')} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingItem ? 'Update' : 'Add Item'}
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
