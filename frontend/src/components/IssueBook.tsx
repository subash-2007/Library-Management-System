import React, { useState, useEffect } from 'react';
import {
  BookPlus,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Book, Member, ActiveTab } from '../types';
import { api } from '../services/api';

interface IssueBookProps {
  preselectedBook?: Book | null;
  onSuccess: (newTx: any) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  defaultBorrowDays: number;
}

export const IssueBook: React.FC<IssueBookProps> = ({
  preselectedBook,
  onSuccess,
  showToast,
  defaultBorrowDays = 14,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Search states
  const [bookSearch, setBookSearch] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Selected entities
  const [selectedBook, setSelectedBook] = useState<Book | null>(preselectedBook || null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Issue parameters
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [borrowDays, setBorrowDays] = useState<number>(defaultBorrowDays);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (preselectedBook) {
      setSelectedBook(preselectedBook);
    }
  }, [preselectedBook]);

  // Load available books and active members
  useEffect(() => {
    const loadInitData = async () => {
      try {
        setLoadingData(true);
        const [booksRes, membersRes] = await Promise.all([
          api.getBooks({ availability: 'available', limit: 200 }),
          api.getMembers({ limit: 200 }),
        ]);
        setBooks(booksRes.items);
        setMembers(membersRes.items);
      } catch (err: any) {
        showToast('error', 'Failed to load library catalog or members list');
      } finally {
        setLoadingData(false);
      }
    };
    loadInitData();
  }, []);

  // Filter lists based on user search
  const filteredBooks = books.filter((b) => {
    const q = bookSearch.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q)
    );
  });

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  // Calculate Due Date live
  const calculatedDueDate = (() => {
    try {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + Number(borrowDays));
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  })();

  const handleConfirmIssue = async () => {
    if (!selectedBook) {
      showToast('error', 'Please select an available book to issue.');
      return;
    }
    if (selectedBook.available_copies <= 0) {
      showToast('error', 'Cannot issue book: No available copies remaining in stock.');
      return;
    }
    if (!selectedMember) {
      showToast('error', 'Please select a registered library member.');
      return;
    }
    if (selectedMember.status !== 'Active') {
      showToast('error', `Member status is ${selectedMember.status}. Only Active members can borrow books.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.issueBook({
        book_id: selectedBook.id,
        member_id: selectedMember.id,
        issue_date: issueDate,
        borrow_days: borrowDays,
        notes: notes.trim() || undefined,
      });

      showToast(
        'success',
        `Book "${selectedBook.title}" successfully issued to ${selectedMember.full_name}! Due on ${calculatedDueDate}.`
      );

      // Decrement local book available count
      setSelectedBook({
        ...selectedBook,
        available_copies: selectedBook.available_copies - 1,
      });

      onSuccess(res);
      // Reset form
      setSelectedBook(null);
      setSelectedMember(null);
      setNotes('');
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to issue book');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-800/30">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider inline-block mb-2">
            Circulation Desk
          </span>
          <h2 className="text-xl font-black tracking-tight">Issue Book to Member</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Select an available library volume, choose an active borrower, configure loan terms (default: 14 days), and confirm issuance with real-time stock deduction.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-xs">
          <Clock className="h-4 w-4 text-teal-400" />
          <span>Default Loan: <strong>{defaultBorrowDays} Days</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Select Member (5 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">
                1
              </span>
              Select Member
            </h3>
            {selectedMember && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Selected
              </span>
            )}
          </div>

          {/* Member Search */}
          <div className="relative mt-3 mb-2">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member name or ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredMembers.map((m) => {
              const isSelected = selectedMember?.id === m.id;
              const isActive = m.status === 'Active';
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (!isActive) {
                      showToast('error', `Cannot select ${m.full_name}: status is ${m.status}`);
                      return;
                    }
                    setSelectedMember(m);
                  }}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                      : !isActive
                      ? 'border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 truncate">{m.full_name}</p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span className="font-mono">{m.member_id}</span>
                    <span className="truncate max-w-[120px]">{m.department}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Available Book (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">
                2
              </span>
              Select Available Book
            </h3>
            {selectedBook && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Selected
              </span>
            )}
          </div>

          {/* Book Search */}
          <div className="relative mt-3 mb-2">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search book title, author, ISBN..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Book List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredBooks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No matching books with available stock.
              </p>
            ) : (
              filteredBooks.map((b) => {
                const isSelected = selectedBook?.id === b.id;
                const isAvailable = b.available_copies > 0;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (!isAvailable) {
                        showToast('error', `"${b.title}" has 0 copies available.`);
                        return;
                      }
                      setSelectedBook(b);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                        : !isAvailable
                        ? 'border-slate-100 bg-slate-50/50 opacity-50 cursor-not-allowed'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-slate-900 truncate">{b.title}</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
                        {b.available_copies} left
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span className="truncate max-w-[140px]">{b.author}</span>
                      <span className="font-mono text-slate-400">{b.shelf_location || 'N/A'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 3: Dates, Review & Confirmation (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-[520px]">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                Issue Terms & Review
              </h3>
            </div>

            {/* Selected Summary Card */}
            <div className="mt-3 space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Selected Book</p>
                {selectedBook ? (
                  <p className="font-bold text-slate-900 truncate mt-0.5">{selectedBook.title}</p>
                ) : (
                  <p className="text-slate-400 italic">None selected yet</p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Borrower</p>
                {selectedMember ? (
                  <p className="font-bold text-slate-900 truncate mt-0.5">
                    {selectedMember.full_name}{' '}
                    <span className="text-slate-500 font-normal">({selectedMember.member_id})</span>
                  </p>
                ) : (
                  <p className="text-slate-400 italic">None selected yet</p>
                )}
              </div>
            </div>

            {/* Date Configuration */}
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    Borrowing Period
                  </label>
                  <span className="font-bold text-teal-700 font-mono">{borrowDays} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={borrowDays}
                  onChange={(e) => setBorrowDays(parseInt(e.target.value) || 14)}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Automatic Calculated Due Date Box */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-teal-700">Calculated Due Date</p>
                  <p className="text-sm font-black font-mono mt-0.5">{calculatedDueDate}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-200/60 text-teal-800">
                    Auto-Computed
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Optional reference notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleConfirmIssue}
              disabled={submitting || !selectedBook || !selectedMember}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <BookPlus className="h-4 w-4" />
              <span>{submitting ? 'Confirming Issue...' : 'Confirm Book Issue'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
