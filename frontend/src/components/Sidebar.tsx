import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookPlus,
  BookCheck,
  Receipt,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Library,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ActiveTab, DashboardStats } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: DashboardStats | null;
  systemName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  systemName,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'books' as ActiveTab,
      label: 'Book Management',
      icon: BookOpen,
      badge: stats?.total_books ? `${stats.total_books}` : null,
    },
    {
      id: 'members' as ActiveTab,
      label: 'Member Management',
      icon: Users,
      badge: stats?.total_members ? `${stats.total_members}` : null,
    },
    {
      id: 'issue' as ActiveTab,
      label: 'Issue Books',
      icon: BookPlus,
      badge: stats?.available_books ? `${stats.available_books} avail` : null,
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    },
    {
      id: 'return' as ActiveTab,
      label: 'Return Books',
      icon: BookCheck,
      badge: stats?.overdue_books ? `${stats.overdue_books} overdue` : null,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200',
    },
    {
      id: 'transactions' as ActiveTab,
      label: 'Transactions',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Export',
      icon: FileSpreadsheet,
      badge: 'CSV',
      badgeColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: SettingsIcon,
      badge: null,
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Library className="h-6 w-6 text-slate-950" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-base font-bold tracking-tight text-white leading-tight truncate">
              {systemName || 'Auspify LMS'}
            </h1>
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Library Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Internship & System Status Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Auspify Internship
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              v1.0.0
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
            Software Development Internship Project
          </p>
          {stats && stats.overdue_books > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-rose-400 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{stats.overdue_books} overdue book(s) need attention</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
