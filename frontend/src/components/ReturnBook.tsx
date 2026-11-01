import React, { useState, useEffect } from 'react';
import {
  BookCheck,
  Search,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Receipt,
  RotateCcw,
  X,
  FileText
} from 'lucide-react';
import { TransactionDetail } from '../types';
import { api } from '../services/api';

interface ReturnBookProps {
  quickReturnTx?: TransactionDetail | null;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  lateFeePerDay: number;
  currencySymbol: string;
}

export const ReturnBook: React.FC<ReturnBookProps> = ({
  quickReturnTx,
  onSuccess,
  showToast,
  lateFeePerDay = 5.0,
  currencySymbol = '₹',
}) => {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);

  // Return Processing Modal
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (quickReturnTx) {
      setSelectedTx(quickReturnTx);
    }
  }, [quickReturnTx]);

  const fetchActiveTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions({
        status: filterOverdueOnly ? 'overdue' : 'issued',
        search: search.trim() || undefined,
        limit: 150,
      });
      setTransactions(res.items);
    } catch (err: any) {
      showToast('error', 'Failed to fetch active book loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActiveTransactions();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, filterOverdueOnly]);

  // Compute live late fee for the modal based on selected returnDate
  const computedLateDetails = (() => {
    if (!selectedTx) return { days: 0, fee: 0 };
    try {
      const returnD = new Date(returnDate);
      const dueD = new Date(selectedTx.due_date);
      const diffTime = returnD.getTime() - dueD.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return {
          days: diffDays,
          fee: Math.round(diffDays * lateFeePerDay * 100) / 100,
        };
      }
      return { days: 0, fee: 0 };
    } catch {
      return { days: 0, fee: 0 };
    }
  })();

  const handleProcessReturn = async () => {
    if (!selectedTx) return;

    try {
      setSubmitting(true);
      const res = await api.returnBook({
        transaction_id: selectedTx.id,
        return_date: returnDate,
        notes: returnNotes.trim() || undefined,
      });

      showToast(
        'success',
        `Book "${selectedTx.book_title}" successfully returned! ${
          res.late_fee > 0
            ? `Late fee applied: ${currencySymbol}${res.late_fee.toFixed(2)} (${computedLateDetails.days} days overdue).`
            : 'No late fee incurred.'
        }`
      );

      setSelectedTx(null);
      setReturnNotes('');
      fetchActiveTransactions();
      onSuccess();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider inline-block mb-2">
            Circulation Check-in
          </span>
          <h2 className="text-xl font-black tracking-tight">Book Return Console</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Check-in borrowed books, verify loan timeliness, and automatically assess late penalties at the rate of {currencySymbol}{lateFeePerDay}/day.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-xs">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Configured Late Fine: <strong>{currencySymbol}{lateFeePerDay} / overdue day</strong></span>
        </div>
      </div>

      {/* Search and Filter controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search active loans by book title, ISBN, member name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* Filter overdue toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterOverdueOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-200'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Overdue Loans Only</span>
          </button>
        </div>
      </div>

      {/* Active Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Active Book Loans Awaiting Return:{' '}
            <strong className="text-slate-900">{transactions.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading active loans...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">All books checked in!</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no matching issued book loans pending return.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Book Title & ISBN</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Circulation Status</th>
                  <th className="py-3 px-4 text-center">Accrued Late Fine</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Book */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{tx.book_title}</p>
                      <p className="font-mono text-[10px] text-slate-400">ISBN: {tx.book_isbn}</p>
                    </td>

                    {/* Member */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{tx.member_name}</p>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                        {tx.member_code}
                      </span>
                    </td>

                    {/* Issue Date */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {tx.issue_date}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {tx.due_date}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {tx.is_overdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue ({tx.overdue_days}d)
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Active Loan
                        </span>
                      )}
                    </td>

                    {/* Accrued Late Fine */}
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {tx.calculated_late_fee > 0 ? (
                        <span className="text-rose-600">
                          {currencySymbol}
                          {tx.calculated_late_fee.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">{currencySymbol}0.00</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 ml-auto"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Process Return</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PROCESS RETURN MODAL ================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookCheck className="h-5 w-5 text-teal-600" />
                Process Book Return
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Book & Borrower Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Book Title</p>
                  <p className="font-bold text-slate-900 text-xs">{selectedTx.book_title}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div>
                    <p className="text-[10px] text-slate-400">Borrower</p>
                    <p className="font-medium text-slate-800">{selectedTx.member_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Due Date</p>
                    <p className="font-mono font-medium text-slate-800">{selectedTx.due_date}</p>
                  </div>
                </div>
              </div>

              {/* Return Date Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  Actual Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              {/* Late Fee Assessment Card */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  computedLateDetails.days > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase">
                    {computedLateDetails.days > 0 ? 'Overdue Penalty' : 'On-Time Return'}
                  </p>
                  <p className="text-xs font-medium mt-0.5">
                    {computedLateDetails.days > 0
                      ? `${computedLateDetails.days} days late @ ${currencySymbol}${lateFeePerDay}/day`
                      : 'Returned within allowable period'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black font-mono">
                    {currencySymbol}
                    {computedLateDetails.fee.toFixed(2)}
                  </p>
                  <span className="text-[10px] font-bold">
                    {computedLateDetails.days > 0 ? 'Late Fee Assessed' : '₹0 Fine'}
                  </span>
                </div>
              </div>

              {/* Return Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inspection / Return Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Book verified in pristine condition"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{submitting ? 'Processing...' : 'Confirm Return & Check-in'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
