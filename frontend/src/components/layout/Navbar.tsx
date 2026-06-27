'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { getUser, logout } from '@/lib/auth';
import Button from '@/components/ui/Button';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
  '/upload': 'Upload Excel',
};

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const getTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.includes('/phases')) return 'Phases';
    if (pathname.includes('/materials')) return 'Materials';
    if (pathname.includes('/tasks')) return 'Tasks';
    if (pathname.match(/\/projects\/[^/]+$/)) return 'Project Details';
    return 'PM Tool';
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-800">{getTitle()}</h1>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCircleIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium">{user?.name || 'User'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
