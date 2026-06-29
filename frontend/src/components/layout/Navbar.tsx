'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { getUser, logout } from '@/lib/auth';
import Button from '@/components/ui/Button';

interface NavbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
  '/upload': 'Upload Excel',
  '/settings': 'Settings & Users',
};

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const getTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.includes('/phases')) return 'Phases';
    if (pathname.includes('/materials')) return 'Materials';
    if (pathname.includes('/tasks')) return 'Tasks';
    if (pathname.includes('/payments')) return 'Payments';
    if (pathname.includes('/epbax')) return 'EPBAX';
    if (pathname.includes('/passive')) return 'Passive Cabling';
    if (pathname.includes('/active-devices')) return 'Active Devices';
    if (pathname.match(/\/projects\/[^/]+$/)) return 'Project Details';
    return 'PM Tool';
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 flex-shrink-0"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
          <UserCircleIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium">{user?.name || 'User'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {user?.role || 'member'}
          </span>
        </div>
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800">
            <Cog6ToothIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
