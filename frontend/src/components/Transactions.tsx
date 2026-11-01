import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ArrowDownUp,
  Download
} from 'lucide-react';
import { TransactionDetail } from '../types';
import { api } from '../services/api';

interface TransactionsProps {
  onQuickReturn: (tx: TransactionDetail) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  currencySymbol: string;
}

export const Transactions: React.FC<TransactionsProps> = ({
  onQuickReturn,
  showToast,
  currencySymbol,
}) => {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 250,
      });
      setTransactions(res.items);
    } catch (err: any) {
      showToast('error', 'Failed to fetch transaction logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Ribbon */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions by book title, member name, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'issued', label: 'Issued (Active)' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'returned', label: 'Returned' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Transactions: <strong className="text-slate-900">{transactions.length}</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            Real-time synchronization with SQLite backend
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading circulation records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No transactions recorded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Transactions will appear here automatically when books are issued or returned.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Book Name & ISBN</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Late Fee</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      #{tx.id.toString().padStart(4, '0')}
                    </td>

                    {/* Book Name */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{tx.book_title}</p>
                      <p className="text-[10px] font-mono text-slate-400">{tx.book_isbn}</p>
                    </td>

                    {/* Member */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{tx.member_name}</p>
                      <span className="text-[10px] font-mono text-slate-500">
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

                    {/* Return Date */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {tx.return_date ? (
                        <span className="text-slate-700 font-semibold">{tx.return_date}</span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {tx.status === 'Returned' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Returned
                        </span>
                      ) : tx.status === 'Overdue' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Overdue ({tx.overdue_days}d)
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Issued
                        </span>
                      )}
                    </td>

                    {/* Late Fee */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {tx.calculated_late_fee > 0 || tx.late_fee > 0 ? (
                        <span className="text-rose-600">
                          {currencySymbol}
                          {(tx.status === 'Overdue'
                            ? tx.calculated_late_fee
                            : tx.late_fee
                          ).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">{currencySymbol}0.00</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {tx.status !== 'Returned' ? (
                        <button
                          onClick={() => onQuickReturn(tx)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Return
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
