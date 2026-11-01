import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  BookOpen,
  CheckCircle2,
  BookmarkCheck,
  AlertTriangle,
  Users,
  Calendar,
  Sparkles,
  Printer
} from 'lucide-react';
import { ReportResponse } from '../types';
import { api } from '../services/api';

interface ReportsProps {
  showToast: (type: 'success' | 'error', message: string) => void;
}

const REPORT_DEFINITIONS = [
  {
    id: 'total_books',
    title: 'Total Books Inventory',
    description: 'Comprehensive audit list of all titles, authors, categories, ISBNs, and physical copy counts.',
    icon: BookOpen,
    badge: 'Inventory Audit',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'available_books',
    title: 'Available Books In Stock',
    description: 'Currently unborrowed volumes immediately available for checkout on shelf racks.',
    icon: CheckCircle2,
    badge: 'Shelf Stock',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'issued_books',
    title: 'Currently Issued Books',
    description: 'Active circulation loans with borrower records, issue dates, and due deadlines.',
    icon: BookmarkCheck,
    badge: 'Circulation',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'overdue_books',
    title: 'Overdue Books & Late Fines',
    description: 'Past-due library materials requiring follow-up, showing elapsed days and accrued fines.',
    icon: AlertTriangle,
    badge: 'Compliance & Fines',
    badgeColor: 'bg-rose-100 text-rose-800',
  },
  {
    id: 'member_activity',
    title: 'Member Activity & Fines',
    description: 'Historical borrowing frequency, currently active books, and total fines paid per member.',
    icon: Users,
    badge: 'Patron Analytics',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'monthly_transactions',
    title: 'Circulation Log Master',
    description: 'Chronological master record of all historical book issues, returns, and settlement timestamps.',
    icon: Calendar,
    badge: 'Audit Trail',
    badgeColor: 'bg-teal-100 text-teal-800',
  },
];

export const Reports: React.FC<ReportsProps> = ({ showToast }) => {
  const [selectedReportId, setSelectedReportId] = useState<string>('total_books');
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      const data = await api.getReport(reportId);
      setReportData(data);
    } catch (err: any) {
      showToast('error', 'Failed to generate report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReportId);
  }, [selectedReportId]);

  const handleExportCsv = () => {
    const csvUrl = api.getReportCsvUrl(selectedReportId);
    window.open(csvUrl, '_blank');
    showToast('success', `Exporting "${reportData?.title || 'Report'}" to CSV...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDef = REPORT_DEFINITIONS.find((r) => r.id === selectedReportId);

  return (
    <div className="space-y-6">
      {/* 6 Report Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_DEFINITIONS.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedReportId === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedReportId(r.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-teal-50/50 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badgeColor}`}
                >
                  {r.badge}
                </span>
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                {r.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {r.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Report Output View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Report Banner */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {reportData?.title || currentDef?.title}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {reportData?.total_records || 0} Records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generated at: {reportData?.generated_at || 'Just now'} • Real-time exportable dataset
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Report"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV File</span>
            </button>
          </div>
        </div>

        {/* Report Table Preview */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Compiling report dataset...</p>
          </div>
        ) : !reportData || reportData.data.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No records found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This report has 0 records under the selected category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm z-10 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {Object.keys(reportData.data[0]).map((key) => (
                    <th key={key} className="py-2.5 px-3 whitespace-nowrap">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {reportData.data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.entries(row).map(([k, val], cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <span className="text-rose-600 font-bold font-sans">Yes</span>
                          ) : (
                            <span className="text-slate-400 font-sans">No</span>
                          )
                        ) : (
                          String(val ?? 'N/A')
                        )}
                      </td>
                    ))}
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
