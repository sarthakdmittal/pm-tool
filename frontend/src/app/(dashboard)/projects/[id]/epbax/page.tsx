'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { EPBAXItem } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useForm } from 'react-hook-form';

interface EPBAXResponse {
  items: EPBAXItem[];
  summary: {
    totalItems: number;
    installedCount: number;
    handedOverCount: number;
  };
}

interface EPBAXForm {
  slNo: number;
  location: string;
  installationStatus: string;
  handoverStatus: string;
  pendingWork: string;
  remarks: string;
}

function StatusCell({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  const lower = value.toLowerCase();
  let cls = 'bg-gray-100 text-gray-600';
  if (lower === 'done' || lower === 'complete' || lower === 'completed') {
    cls = 'bg-green-100 text-green-700';
  } else if (lower === 'pending' || lower === 'not done' || lower === 'not started') {
    cls = 'bg-orange-100 text-orange-600';
  } else if (lower === 'in progress' || lower === 'wip') {
    cls = 'bg-blue-100 text-blue-600';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
}

export default function EPBAXPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<EPBAXResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EPBAXItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EPBAXForm>();
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const res = await api.get<EPBAXResponse>(`/api/projects/${id}/epbax`);
      setData(res.data);
    } catch {
      toast.error('Failed to load EPBAX data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const openAdd = () => {
    setEditingItem(null);
    reset({});
    setIsModalOpen(true);
  };

  const openEdit = (item: EPBAXItem) => {
    setEditingItem(item);
    reset({
      slNo: item.slNo,
      location: item.location,
      installationStatus: item.installationStatus || '',
      handoverStatus: item.handoverStatus || '',
      pendingWork: item.pendingWork || '',
      remarks: item.remarks || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: EPBAXForm) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await api.put(`/api/projects/${id}/epbax/${editingItem._id}`, formData);
        toast.success('Item updated');
      } else {
        await api.post(`/api/projects/${id}/epbax`, formData);
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
      await api.delete(`/api/projects/${id}/epbax/${id}`);
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
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">EPBAX</h2>
        </div>
        {admin && (
          <Button variant="primary" size="sm" onClick={openAdd}>
            <PlusIcon className="h-4 w-4" /> Add Item
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Items</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.totalItems ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Installed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {summary?.installedCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Handed Over</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {summary?.handedOverCount ?? 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-3 py-3 font-medium">Sl.No</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium">Installation Status</th>
                <th className="px-3 py-3 font-medium">Handover Status</th>
                <th className="px-3 py-3 font-medium">Pending Work</th>
                <th className="px-3 py-3 font-medium">Remarks / Status</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No EPBAX items yet
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{item.slNo ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{item.location}</td>
                    <td className="px-3 py-2.5">
                      <StatusCell value={item.installationStatus} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusCell value={item.handoverStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {item.pendingWork || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{item.remarks || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {admin && (
                          <button
                            onClick={() => handleDelete(item._id)}
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
        title={editingItem ? 'Edit EPBAX Item' : 'Add EPBAX Item'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Installation Status
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('installationStatus')}
              >
                <option value="">— Select —</option>
                <option value="Done">Done</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Handover Status
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('handoverStatus')}
              >
                <option value="">— Select —</option>
                <option value="Done">Done</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>
          </div>
          <Input label="Pending Work (If Any)" {...register('pendingWork')} />
          <Input label="Remarks / Status" {...register('remarks')} />
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
