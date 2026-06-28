'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  ArrowUpTrayIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  CpuChipIcon,
  PhoneIcon,
  WifiIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { cx } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/projects', label: 'Projects', icon: FolderIcon },
  { href: '/upload', label: 'Upload Excel', icon: ArrowUpTrayIcon },
];

function getProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const projectId = getProjectId(pathname);
  const isOnProject = Boolean(projectId);

  const projectSubLinks = projectId
    ? [
        {
          href: `/projects/${projectId}`,
          label: 'Overview',
          icon: Squares2X2Icon,
          exact: true,
        },
        {
          href: `/projects/${projectId}/phases`,
          label: 'Phases',
          icon: ChartBarIcon,
          exact: false,
        },
        {
          href: `/projects/${projectId}/materials`,
          label: 'Materials',
          icon: ClipboardDocumentListIcon,
          exact: false,
        },
        {
          href: `/projects/${projectId}/active-devices`,
          label: 'Active Devices',
          icon: CpuChipIcon,
          exact: false,
        },
        {
          href: `/projects/${projectId}/epbax`,
          label: 'EPBAX',
          icon: PhoneIcon,
          exact: false,
        },
        {
          href: `/projects/${projectId}/passive`,
          label: 'Passive (Cabling)',
          icon: WifiIcon,
          exact: false,
        },
        {
          href: `/projects/${projectId}/tasks`,
          label: 'Tasks',
          icon: CheckCircleIcon,
          exact: false,
        },
        {
          href: `/projects/${projectId}/payments`,
          label: 'Payments',
          icon: CurrencyDollarIcon,
          exact: false,
        },
      ]
    : [];

  return (
    <aside className="w-64 min-h-screen bg-[#1e293b] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="bg-blue-500 rounded-lg p-2">
          <Squares2X2Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg">PM Tool</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/upload' && pathname.startsWith('/upload'));
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Project sub-navigation */}
        {isOnProject && projectSubLinks.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              This Project
            </p>
            <div className="space-y-0.5">
              {projectSubLinks.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-slate-500">PM Tool v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
