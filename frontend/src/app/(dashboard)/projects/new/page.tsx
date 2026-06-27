'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Project } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface NewProjectForm {
  name: string;
  clientName: string;
  location: string;
  projectCode: string;
  description: string;
  startDate: string;
  endDate: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewProjectForm>();

  const onSubmit = async (data: NewProjectForm) => {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post<{ _id: string } & Project>('/api/projects', data);
      toast.success('Project created successfully!');
      router.push(`/projects/${res.data._id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create project';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
        <p className="text-gray-500 mt-1">
          Fill in the project details. Phases will be created automatically.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Project Name *"
            type="text"
            placeholder="e.g. Solar Panel Installation – Site A"
            error={errors.name?.message}
            {...register('name', { required: 'Project name is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              type="text"
              placeholder="ABC Corporation"
              {...register('clientName')}
            />
            <Input
              label="Project Code"
              type="text"
              placeholder="PRJ-001"
              {...register('projectCode')}
            />
          </div>

          <Input
            label="Location"
            type="text"
            placeholder="Mumbai, Maharashtra"
            {...register('location')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors resize-none"
              rows={3}
              placeholder="Brief description of the project..."
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate', { required: 'Start date is required' })}
            />
            <Input
              label="End Date *"
              type="date"
              error={errors.endDate?.message}
              {...register('endDate', { required: 'End date is required' })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Create Project
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
