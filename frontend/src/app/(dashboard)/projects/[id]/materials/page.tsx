'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Material } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

interface MaterialForm {
  sNo: number;
  description: string;
  orderedQty: number;
  unit: string;
  billedQty: number;
  invoicedNumber: string;
  completionStatus: string;
  executedQty: number;
  remainingQty: number;
  expectedClosureSchedule: string;
  dependencyIfAny: string;
  ownership: string;
  expectedResolutionTime: string;
  remarks: string;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const isClosedVal = status.toLowerCase() === 'closed';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isClosedVal
          ? 'bg-green-100 text-green-800'
          : 'bg-orange-100 text-orange-700'
      }`}
    >
      {status}
    </span>
  );
}

export default function MaterialsPage({ params }: { params: { id: string } }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialForm>();

  const fetchData = async () => {
    try {
      const res = await api.get<Material[]>(`/api/projects/${params.id}/materials`);
      setMaterials(res.data);
    } catch {
      toast.error('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const openAdd = () => {
    setEditingMaterial(null);
    reset({
      completionStatus: 'Open',
    });
    setIsModalOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    reset({
      sNo: material.sNo,
      description: material.description,
      orderedQty: material.orderedQty,
      unit: material.unit,
      billedQty: material.billedQty,
      invoicedNumber: material.invoicedNumber || '',
      completionStatus: material.completionStatus || '',
      executedQty: material.executedQty,
      remainingQty: material.remainingQty,
      expectedClosureSchedule: material.expectedClosureSchedule || '',
      dependencyIfAny: material.dependencyIfAny || '',
      ownership: material.ownership || '',
      expectedResolutionTime: material.expectedResolutionTime || '',
      remarks: material.remarks || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MaterialForm) => {
    setIsSaving(true);
    try {
      if (editingMaterial) {
        await api.put(`/api/projects/${params.id}/materials/${editingMaterial._id}`, data);
        toast.success('Material updated');
      } else {
        await api.post(`/api/projects/${params.id}/materials`, data);
        toast.success('Material added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save material');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await api.delete(`/api/projects/${params.id}/materials/${id}`);
      toast.success('Material deleted');
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const total = materials.length;
  const closed = materials.filter(
    (m) => (m.completionStatus || '').toLowerCase() === 'closed'
  ).length;
  const open = materials.filter(
    (m) => (m.completionStatus || '').toLowerCase() === 'open'
  ).length;
  const completionPct = total > 0 ? Math.round((closed / total) * 100) : 0;

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
          <h2 className="text-2xl font-bold text-gray-900">Material Status</h2>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" /> Add Material
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Items</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Closed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{closed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Open</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{open}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Completion</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{completionPct}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-3 py-3 font-medium">S.No</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium text-right">Ordered Qty</th>
                <th className="px-3 py-3 font-medium">Unit</th>
                <th className="px-3 py-3 font-medium text-right">Billed Qty</th>
                <th className="px-3 py-3 font-medium">Invoice #</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium text-right">Executed Qty</th>
                <th className="px-3 py-3 font-medium text-right">Remaining Qty</th>
                <th className="px-3 py-3 font-medium">Expected Closure</th>
                <th className="px-3 py-3 font-medium">Dependency</th>
                <th className="px-3 py-3 font-medium">Ownership</th>
                <th className="px-3 py-3 font-medium">Resolution Time</th>
                <th className="px-3 py-3 font-medium">Remarks</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-gray-400">
                    No materials added yet
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{m.sNo ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 max-w-xs">
                      {m.description}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {m.orderedQty ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{m.unit || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {m.billedQty ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {m.invoicedNumber || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={m.completionStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {m.executedQty ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {m.remainingQty ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                      {m.expectedClosureSchedule || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {m.dependencyIfAny || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {m.ownership || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {m.expectedResolutionTime || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs max-w-xs">
                      {m.remarks || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m._id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          title="Delete"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="S.No." type="number" {...register('sNo')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Status
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('completionStatus')}
              >
                <option value="">— Select —</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          <Input
            label="Description *"
            error={errors.description?.message}
            {...register('description', { required: 'Required' })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Ordered Qty" type="number" min={0} {...register('orderedQty')} />
            <Input label="Unit" placeholder="pcs, m, etc." {...register('unit')} />
            <Input label="Billed Qty" type="number" min={0} {...register('billedQty')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" {...register('invoicedNumber')} />
            <Input label="Executed Qty" type="number" min={0} {...register('executedQty')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Remaining Qty" type="number" min={0} {...register('remainingQty')} />
            <Input label="Expected Closure Schedule" {...register('expectedClosureSchedule')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dependency (If Any)" {...register('dependencyIfAny')} />
            <Input label="Ownership" {...register('ownership')} />
          </div>
          <Input label="Expected Resolution Time" {...register('expectedResolutionTime')} />
          <Input label="Remarks" {...register('remarks')} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingMaterial ? 'Update' : 'Add Material'}
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
