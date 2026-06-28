'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { Payment } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate } from '@/lib/utils';

interface PaymentSummary {
  totalContract: number;
  totalReceived: number;
  totalPending: number;
  percentPaid: number;
}

interface PaymentResponse {
  payments: Payment[];
  summary: PaymentSummary;
}

interface PaymentForm {
  invoiceNumber: string;
  description: string;
  amount: number;
  paymentDate: string;
  dueDate: string;
  status: 'pending' | 'received' | 'overdue';
  notes: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    received: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PaymentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contractValue, setContractValue] = useState<number>(0);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const admin = isAdmin();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentForm>();

  const fetchData = async () => {
    try {
      const res = await api.get<PaymentResponse>(`/api/projects/${id}/payments`);
      setData(res.data);
      setContractValue(res.data.summary.totalContract);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const openAdd = () => {
    setEditingPayment(null);
    reset({ status: 'pending' });
    setIsModalOpen(true);
  };

  const openEdit = (payment: Payment) => {
    setEditingPayment(payment);
    reset({
      invoiceNumber: payment.invoiceNumber || '',
      description: payment.description || '',
      amount: payment.amount,
      paymentDate: payment.paymentDate?.slice(0, 10) || '',
      dueDate: payment.dueDate?.slice(0, 10) || '',
      status: payment.status,
      notes: payment.notes || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: PaymentForm) => {
    setIsSaving(true);
    try {
      if (editingPayment) {
        await api.put(`/api/projects/${id}/payments/${editingPayment._id}`, formData);
        toast.success('Payment updated');
      } else {
        await api.post(`/api/projects/${id}/payments`, formData);
        toast.success('Payment added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Delete this payment?')) return;
    try {
      await api.delete(`/api/projects/${id}/payments/${paymentId}`);
      toast.success('Payment deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaveContractValue = async () => {
    setIsSavingContract(true);
    try {
      await api.put(`/api/projects/${id}`, { totalContractValue: contractValue });
      toast.success('Contract value saved');
      fetchData();
    } catch {
      toast.error('Failed to save contract value');
    } finally {
      setIsSavingContract(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const payments = data?.payments || [];
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
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
        </div>
        {admin && (
          <Button variant="primary" size="sm" onClick={openAdd}>
            <PlusIcon className="h-4 w-4" /> Add Payment
          </Button>
        )}
      </div>

      {/* Contract value editor */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <CurrencyDollarIcon className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold text-gray-900 text-sm">Total Contract Value</span>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <input
            type="number"
            min={0}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            value={contractValue}
            onChange={(e) => setContractValue(Number(e.target.value) || 0)}
            disabled={!admin}
          />
          {admin && (
            <Button variant="primary" size="sm" isLoading={isSavingContract} onClick={handleSaveContractValue}>
              Save
            </Button>
          )}
          <span className="text-xs text-gray-400">
            ₹{contractValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Contract</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{(summary?.totalContract ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{(summary?.totalReceived ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">₹{(summary?.totalPending ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Payment progress */}
      {(summary?.totalContract ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Payment Progress</span>
            <span className="text-sm font-semibold text-emerald-600">{summary?.percentPaid ?? 0}% paid</span>
          </div>
          <ProgressBar value={summary?.percentPaid ?? 0} size="lg" />
          <p className="text-xs text-gray-500 mt-2">
            ₹{(summary?.totalReceived ?? 0).toLocaleString()} received of ₹{(summary?.totalContract ?? 0).toLocaleString()} contract value
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-3 py-3 font-medium">Invoice #</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium text-right">Amount</th>
                <th className="px-3 py-3 font-medium">Payment Date</th>
                <th className="px-3 py-3 font-medium">Due Date</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Notes</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No payments added yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{payment.invoiceNumber || '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 max-w-xs">{payment.description || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                      {payment.paymentDate ? formatDate(payment.paymentDate) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                      {payment.dueDate ? formatDate(payment.dueDate) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs max-w-xs">{payment.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(payment)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {admin && (
                          <button
                            onClick={() => handleDelete(payment._id)}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? 'Edit Payment' : 'Add Payment'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" {...register('invoiceNumber')} />
            <Input
              label="Amount *"
              type="number"
              min={0}
              step="0.01"
              error={errors.amount?.message}
              {...register('amount', { required: 'Required', valueAsNumber: true })}
            />
          </div>
          <Input label="Description" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Payment Date" type="date" {...register('paymentDate')} />
            <Input label="Due Date" type="date" {...register('dueDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('status')}
            >
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <Input label="Notes" {...register('notes')} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingPayment ? 'Update' : 'Add Payment'}
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
