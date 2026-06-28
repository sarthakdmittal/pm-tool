'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, setUser, setToken, isAdmin } from '@/lib/auth';
import { User } from '@/types';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const currentUser = getUser();
  const admin = isAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!admin) return;
    setIsLoading(true);
    try {
      const res = await api.get<User[]>('/api/auth/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [admin]);

  const handleClaimAdmin = async () => {
    setIsClaiming(true);
    try {
      const res = await api.post<{ message: string; user: User }>('/api/auth/claim-admin');
      // Update stored user with new admin role
      setUser(res.data.user);
      toast.success('You are now an admin! Refresh the page to see changes.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to claim admin';
      toast.error(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    setUpdatingId(userId);
    try {
      await api.put(`/api/auth/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role updated');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to update role';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Settings & Users</h2>

      {/* Current User Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Account</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">{currentUser?.name}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${
              currentUser?.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {currentUser?.role}
            </span>
          </div>

          {/* Claim Admin — only shown if not already admin */}
          {!admin && (
            <div className="text-right">
              <Button
                variant="primary"
                isLoading={isClaiming}
                onClick={handleClaimAdmin}
              >
                Claim Admin Access
              </Button>
              <p className="text-xs text-gray-400 mt-1">
                Only works if no admin exists yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Management — admin only */}
      {admin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            User Management
            <span className="ml-2 text-sm font-normal text-gray-400">({users.length} users)</span>
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">
                      {user.name}
                      {user._id === currentUser?._id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-500">{user.email}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">
                      {user._id === currentUser?._id ? (
                        <span className="text-xs text-gray-400">Cannot change own role</span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={updatingId === user._id}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value as 'admin' | 'member')
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Info for non-admins */}
      {!admin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
          <strong>Note:</strong> Only admins can add or delete data. Ask an admin to upgrade your account,
          or click &quot;Claim Admin Access&quot; above if no admin exists yet.
        </div>
      )}
    </div>
  );
}
