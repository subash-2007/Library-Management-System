import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  BookmarkCheck,
  Users,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  ArrowUpRight,
  BookMarked,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardStats, ActiveTab, TransactionDetail } from '../types';

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickReturn: (tx: TransactionDetail) => void;
  currencySymbol: string;
}

const PIE_COLORS = ['#0f766e', '#0284c7', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  loading,
  setActiveTab,
  onQuickReturn,
  currencySymbol,
}) => {
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading library analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">Failed to load dashboard metrics.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Books',
      value: stats.total_books,
      subtitle: 'Physical collection copies',
      icon: BookOpen,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 text-blue-700',
      tab: 'books' as ActiveTab,
    },
    {
      title: 'Available Books',
      value: stats.available_books,
      subtitle: 'Ready to be borrowed',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-700',
      tab: 'books' as ActiveTab,
    },
    {
      title: 'Issued Books',
      value: stats.issued_books,
      subtitle: 'Currently in circulation',
      icon: BookmarkCheck,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700',
      tab: 'transactions' as ActiveTab,
    },
    {
      title: 'Total Members',
      value: stats.total_members,
      subtitle: 'Enrolled students & staff',
      icon: Users,
      color: 'from-purple-600 to-violet-600',
      bgColor: 'bg-purple-50 text-purple-700',
      tab: 'members' as ActiveTab,
    },
    {
      title: 'Overdue Books',
      value: stats.overdue_books,
      subtitle: 'Past return deadline',
      icon: AlertTriangle,
      color: 'from-rose-600 to-red-600',
      bgColor: 'bg-rose-50 text-rose-700',
      tab: 'return' as ActiveTab,
      highlight: stats.overdue_books > 0,
    },
    {
      title: 'Returned Today',
      value: stats.books_returned_today,
      subtitle: 'Processed at check-in desk',
      icon: RotateCcw,
      color: 'from-cyan-600 to-teal-600',
      bgColor: 'bg-teal-50 text-teal-700',
      tab: 'transactions' as ActiveTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6 Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(card.tab)}
              className={`p-4 rounded-2xl bg-white border transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 group relative overflow-hidden ${
                card.highlight
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.bgColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">
                {card.value.toLocaleString()}
              </h3>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{card.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Circulation Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                Monthly Issue & Return Statistics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Circulation trend comparison over the past 6 months
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Circulation Volume
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.monthly_stats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="issued_count"
                  name="Books Issued"
                  fill="#0f766e"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="returned_count"
                  name="Books Returned"
                  fill="#0284c7"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-teal-600" />
                Collection by Category
              </h3>
              <span className="text-xs font-medium text-slate-400">Total Volumes</span>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.category_stats}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {stats.category_stats.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {stats.category_stats.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium truncate">{cat.category}</span>
                </div>
                <span className="font-semibold text-slate-900">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Borrowed Books & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Borrowed Books (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Most Borrowed Books
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Top Picks
            </span>
          </div>

          <div className="space-y-3">
            {stats.most_borrowed_books.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No borrowing data yet</p>
            ) : (
              stats.most_borrowed_books.map((book, idx) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-teal-600/10 text-teal-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{book.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {book.borrow_count}
                    </span>
                    <p className="text-[10px] text-slate-400">borrows</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Book Title</th>
                  <th className="pb-3">Member</th>
                  <th className="pb-3">Issue Date</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {stats.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-2 max-w-[200px]">
                      <p className="font-semibold text-slate-900 truncate">{tx.book_title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.book_isbn}</p>
                    </td>
                    <td className="py-3 max-w-[150px]">
                      <p className="font-medium text-slate-800 truncate">{tx.member_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.member_code}</p>
                    </td>
                    <td className="py-3 text-slate-600 font-mono text-[11px]">
                      {tx.issue_date}
                    </td>
                    <td className="py-3 text-slate-600 font-mono text-[11px]">
                      {tx.due_date}
                    </td>
                    <td className="py-3">
                      {tx.status === 'Returned' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Returned
                        </span>
                      ) : tx.status === 'Overdue' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Overdue (+{tx.overdue_days}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Issued
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2">
                      {tx.status !== 'Returned' ? (
                        <button
                          onClick={() => onQuickReturn(tx)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                        >
                          Return
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
