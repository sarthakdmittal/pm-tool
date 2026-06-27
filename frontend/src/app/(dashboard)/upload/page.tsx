'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import { cx } from '@/lib/utils';

interface UploadResult {
  project: { _id: string; name: string };
  summary: {
    materialsCreated: number;
    activeDevicesCreated: number;
    activeDeviceColumns: string[];
    epbaxItemsCreated: number;
    passiveItemsCreated: number;
  };
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<UploadResult>('/api/upload/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success('Project imported successfully!');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Upload failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Excel</h2>
        <p className="text-gray-500 mt-1">
          Import a project from your actual Excel file. Sheet names are detected automatically.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cx(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <DocumentIcon className="h-12 w-12 text-green-500" />
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            <p className="text-xs text-gray-400">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ArrowUpTrayIcon className="h-12 w-12 text-gray-400" />
            <p className="font-medium text-gray-600">
              {isDragActive ? 'Drop the file here' : 'Drag & drop Excel file here'}
            </p>
            <p className="text-sm text-gray-400">or click to browse</p>
            <p className="text-xs text-gray-300">.xlsx and .xls supported, max 10MB</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      {file && !result && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isUploading}
          onClick={handleUpload}
        >
          <ArrowUpTrayIcon className="h-5 w-5" />
          Upload & Import Project
        </Button>
      )}

      {/* Success */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Project imported successfully!</p>
              <p className="text-green-700 mt-1">
                <strong>{result.project.name}</strong> has been created.
              </p>
              <ul className="mt-2 text-sm text-green-700 space-y-1">
                <li>• {result.summary.materialsCreated} materials imported</li>
                <li>• {result.summary.activeDevicesCreated} active device entries imported</li>
                {result.summary.activeDeviceColumns.length > 0 && (
                  <li className="text-xs text-green-600 ml-4">
                    Columns: {result.summary.activeDeviceColumns.join(', ')}
                  </li>
                )}
                <li>• {result.summary.epbaxItemsCreated} EPBAX items imported</li>
                <li>• {result.summary.passiveItemsCreated} passive cabling items imported</li>
              </ul>
              <Link href={`/projects/${result.project._id}`}>
                <Button variant="primary" size="sm" className="mt-4">
                  View Project →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Sheet format guide */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Supported Excel Sheet Formats</h3>

        <div className="space-y-5 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-1">Sheet 1: Material Status</p>
            <p className="text-xs text-gray-500 mb-1.5">
              Sheet name should contain "material" or "status". Header rows at top, then data table.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-nowrap">
              S.No. | Description | Ordered Qty | Unit | Billed Qty | Invoice # | Completion Status | Executed Qty | Remaining Qty | Expected Closure | Dependency | Ownership | Resolution Time | Remarks
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-1">Sheet 2: Active Device Installation</p>
            <p className="text-xs text-gray-500 mb-1.5">
              Sheet name should contain "active" or "device". Device type column names are auto-detected.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-nowrap">
              S.NO. | AREA / LOCATION | [Device Type 1] | [Device Type 2] | ...
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-1">Sheet 3: EPBAX</p>
            <p className="text-xs text-gray-500 mb-1.5">
              Sheet name should contain "epbax" or "pbax".
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-nowrap">
              Sl.No | LOCATION | INSTALLATION STATUS | HANDOVER STATUS | PENDING WORK | Remarks
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-1">Sheet 4: Passive Cabling</p>
            <p className="text-xs text-gray-500 mb-1.5">
              Sheet name should contain "passive".
            </p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-nowrap">
              Sl.No | LOCATION | CABLING ALLOCATED (Mtrs) | CABLING COMPLETED (Mtrs) | VENDOR | REMARKS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
