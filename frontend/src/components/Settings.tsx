import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Server,
  Database,
  Shield,
  Clock,
  DollarSign,
  Building,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  showToast,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateSettings(formData);
      onUpdateSettings(updated);
      showToast('success', 'Library settings and business rules updated successfully!');
    } catch (err: any) {
      showToast('error', 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData({
      late_fee_per_day: 5.0,
      default_borrow_period_days: 14,
      library_name: 'Auspify Central Library',
      max_books_per_member: 5,
      currency_symbol: '₹',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Intro Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-teal-600" />
            Library Circulation & Policy Rules
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure system-wide borrowing duration, overdue fine rates, and borrowing quotas.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Rules Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-teal-600" />
            Circulation Rules & Fine Parameters
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Late fee rate */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Late Fine Rate (per overdue day) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  {formData.currency_symbol}
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={formData.late_fee_per_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      late_fee_per_day: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Configured rate (default ₹5 per overdue day) automatically multiplied by overdue days upon book return.
              </p>
            </div>

            {/* Default Borrow Period */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Borrowing Period (Days) *
              </label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={formData.default_borrow_period_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    default_borrow_period_days: parseInt(e.target.value) || 14,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default lending window assigned when new books are checked out (default 14 days).
              </p>
            </div>

            {/* Max Books per Member */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Books per Member *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.max_books_per_member}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_books_per_member: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum active borrowed books allowed per member concurrently.
              </p>
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Currency Symbol *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={formData.currency_symbol}
                onChange={(e) =>
                  setFormData({ ...formData, currency_symbol: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Displayed for late fees and financial transactions (e.g., ₹ or $).
              </p>
            </div>
          </div>
        </div>

        {/* Library Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-teal-600" />
            Library Branding & Identity
          </h4>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Library Name *</label>
            <input
              type="text"
              required
              value={formData.library_name}
              onChange={(e) => setFormData({ ...formData, library_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Appears on navigation header, reports, and exported CSV receipts.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving Preferences...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* System Technical Architecture Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Architecture & Tech Stack
          </h4>
          <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
            Auspify Technologies
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Backend API</p>
            <p className="font-bold text-white mt-1">Python FastAPI + Uvicorn</p>
            <p className="text-[11px] text-slate-400 mt-0.5">RESTful services & Pydantic v2</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Database Engine</p>
            <p className="font-bold text-white mt-1">SQLite + SQLAlchemy 2.0</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Normalized relational tables</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Frontend Client</p>
            <p className="font-bold text-white mt-1">React + TypeScript + Vite</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tailwind CSS + Recharts + Lucide</p>
          </div>
        </div>
      </div>
    </div>
  );
};
