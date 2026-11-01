import React from 'react';
import {
  RotateCcw,
  BookPlus,
  BookCheck,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  libraryName: string;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Dashboard',
    subtitle: 'Comprehensive real-time analytics, circulation metrics, and library health indicators',
  },
  books: {
    title: 'Book Catalog & Inventory',
    subtitle: 'Manage titles, authors, categories, shelf locations, and live physical copy availability',
  },
  members: {
    title: 'Member Directory',
    subtitle: 'Manage enrolled students and staff, membership statuses, and borrowing privileges',
  },
  issue: {
    title: 'Circulation: Issue Books',
    subtitle: 'Issue library materials to active members with automated due date calculation',
  },
  return: {
    title: 'Circulation: Return Desk',
    subtitle: 'Process book returns, check-in copies, and calculate overdue late fines automatically',
  },
  transactions: {
    title: 'Transaction Audit Ledger',
    subtitle: 'Historical record of all issued, returned, and overdue book circulation events',
  },
  reports: {
    title: 'Analytics & Compliance Reports',
    subtitle: 'Exportable business intelligence reports for audits and collection management',
  },
  settings: {
    title: 'System Preferences & Rules',
    subtitle: 'Configure borrowing periods, late fee rates, library identity, and limits',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  libraryName,
}) => {
  const current = TAB_TITLES[activeTab] || {
    title: 'Library System',
    subtitle: 'Management portal',
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {current.title}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {libraryName}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-teal-600" />
          <span>{todayFormatted}</span>
        </div>

        {/* Quick Issue Button */}
        {activeTab !== 'issue' && (
          <button
            onClick={() => setActiveTab('issue')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-teal-700/20 active:scale-95"
          >
            <BookPlus className="h-3.5 w-3.5" />
            <span>Issue Book</span>
          </button>
        )}

        {/* Quick Return Button */}
        {activeTab !== 'return' && (
          <button
            onClick={() => setActiveTab('return')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <BookCheck className="h-3.5 w-3.5" />
            <span>Return Book</span>
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <RotateCcw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`}
          />
        </button>
      </div>
    </header>
  );
};
