'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, setUser, isAdmin } from '@/lib/auth';
import { User } from '@/types';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const currentUser = getUser();
  const admin = isAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Own profile
  const [myPhone, setMyPhone] = useState(currentUser?.phone || '');
  const [isSavingMyProfile, setIsSavingMyProfile] = useState(false);

  // Per-user inline phone edit (admin editing others)
  const [editingPhone, setEditingPhone] = useState<Record<string, string>>({});
  const [savingPhoneId, setSavingPhoneId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!admin) return;
    setIsLoading(true);
    try {
      const res = await api.get<User[]>('/api/auth/users');
      setUsers(res.data);
      // Pre-fill phone edit state
      const phones: Record<string, string> = {};
      res.data.forEach((u) => { phones[u._id] = u.phone || ''; });
      setEditingPhone(phones);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [admin]);

  const handleSaveMyProfile = async () => {
    setIsSavingMyProfile(true);
    try {
      const res = await api.put<{ user: User }>('/api/auth/me', { phone: myPhone });
      setUser(res.data.user);
      setMyPhone(res.data.user.phone || '');
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSavingMyProfile(false);
    }
  };

  const handleSaveUserPhone = async (userId: string) => {
    setSavingPhoneId(userId);
    try {
      const res = await api.put<User>(`/api/auth/users/${userId}`, { phone: editingPhone[userId] });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, phone: res.data.phone } : u)));
      toast.success('Phone updated');
    } catch {
      toast.error('Failed to update phone');
    } finally {
      setSavingPhoneId(null);
    }
  };

  const handleClaimAdmin = async () => {
    setIsClaiming(true);
    try {
      const res = await api.post<{ message: string; user: User }>('/api/auth/claim-admin');
      setUser(res.data.user);
      toast.success('You are now an admin! Refresh the page to see changes.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to claim admin';
      toast.error(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    setUpdatingId(userId);
    try {
      await api.put(`/api/auth/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      toast.success('Role updated');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update role';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Settings & Users</h2>

      {/* Current User Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Account</h3>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <p className="font-medium text-gray-800">{currentUser?.name}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${
              currentUser?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {currentUser?.role}
            </span>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp / Notification Phone
                <span className="ml-1 text-xs text-gray-400 font-normal">(used for task alerts)</span>
              </label>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={myPhone}
                  onChange={(e) => setMyPhone(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button variant="primary" size="sm" isLoading={isSavingMyProfile} onClick={handleSaveMyProfile}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +919876543210</p>
            </div>
          </div>
          {!admin && (
            <div className="text-right flex-shrink-0">
              <Button variant="primary" isLoading={isClaiming} onClick={handleClaimAdmin}>
                Claim Admin Access
              </Button>
              <p className="text-xs text-gray-400 mt-1">Only works if no admin exists yet</p>
            </div>
          )}
        </div>
      </div>

      {/* User Management — admin only */}
      {admin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            User Management
            <span className="ml-2 text-sm font-normal text-gray-400">({users.length} users)</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Set each member&apos;s phone number so the notification system can auto-fill it when sending task alerts.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium w-56">
                      Phone
                      <span className="ml-1 normal-case font-normal text-gray-300">(for WhatsApp)</span>
                    </th>
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
                      <td className="py-3 text-gray-500 text-xs">{user.email}</td>
                      <td className="py-3">
                        {user._id === currentUser?._id ? (
                          /* Own phone — edit via "Your Account" above */
                          <span className="text-xs text-gray-400 italic">
                            {user.phone || 'Set above ↑'}
                          </span>
                        ) : (
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="tel"
                              placeholder="+91..."
                              value={editingPhone[user._id] ?? ''}
                              onChange={(e) =>
                                setEditingPhone((prev) => ({ ...prev, [user._id]: e.target.value }))
                              }
                              className="w-36 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              disabled={savingPhoneId === user._id}
                              onClick={() => handleSaveUserPhone(user._id)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 font-medium transition-colors"
                            >
                              {savingPhoneId === user._id ? '...' : 'Save'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
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
                            onChange={(e) => handleRoleChange(user._id, e.target.value as 'admin' | 'member')}
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
            </div>
          )}
        </div>
      )}

      {!admin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
          <strong>Note:</strong> Only admins can add or delete data. Ask an admin to upgrade your account,
          or click &quot;Claim Admin Access&quot; above if no admin exists yet.
        </div>
      )}
    </div>
  );
}
