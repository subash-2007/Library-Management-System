import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  BookPlus,
  CheckCircle,
  AlertCircle,
  Layers,
  MapPin,
  Calendar,
  X,
  Sparkles
} from 'lucide-react';
import { Book, BookFormData } from '../types';
import { api } from '../services/api';

interface BookManagementProps {
  onIssueBook: (book: Book) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

const CATEGORIES = [
  'All',
  'Computer Science',
  'Software Engineering',
  'Programming',
  'Artificial Intelligence',
  'Database & Systems',
  'Web Development',
  'Cybersecurity',
  'Mathematics',
  'Literature',
  'Management',
];

export const BookManagement: React.FC<BookManagementProps> = ({
  onIssueBook,
  showToast,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const initialFormState: BookFormData = {
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    category: 'Computer Science',
    publication_year: new Date().getFullYear(),
    total_copies: 1,
    shelf_location: '',
  };
  const [formData, setFormData] = useState<BookFormData>(initialFormState);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await api.getBooks({
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
        limit: 200,
      });
      setBooks(res.items);
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to fetch book catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, availabilityFilter]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      category: book.category,
      publication_year: book.publication_year,
      total_copies: book.total_copies,
      shelf_location: book.shelf_location || '',
    });
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createBook(formData);
      showToast('success', `Book "${formData.title}" added to inventory successfully!`);
      setIsAddModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      setSubmitting(true);
      await api.updateBook(editingBook.id, formData);
      showToast('success', `Book "${formData.title}" updated successfully!`);
      setEditingBook(null);
      fetchBooks();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to update book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    try {
      setSubmitting(true);
      await api.deleteBook(deletingBook.id);
      showToast('success', `Book "${deletingBook.title}" removed from catalog.`);
      setDeletingBook(null);
      fetchBooks();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Cannot delete book');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search books by title, author, ISBN, publisher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Availability</option>
              <option value="available">Available in Stock</option>
              <option value="unavailable">Fully Issued (0 Copies)</option>
            </select>
          </div>

          {/* Add Book Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Books Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{books.length}</strong> catalog titles
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading catalog items...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No books found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or add new books to the inventory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Book Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Publication</th>
                  <th className="py-3 px-4">Shelf Location</th>
                  <th className="py-3 px-4 text-center">Copies (Avail / Total)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {books.map((b) => {
                  const isAvailable = b.available_copies > 0;
                  const ratio = b.total_copies > 0 ? (b.available_copies / b.total_copies) * 100 : 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Title & Author */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 mt-0.5 flex-shrink-0">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                              {b.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{b.author}</p>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                              ISBN: {b.isbn}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {b.category}
                        </span>
                      </td>

                      {/* Publisher & Year */}
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-medium text-slate-800">{b.publisher || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {b.publication_year}
                        </p>
                      </td>

                      {/* Shelf Location */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-700 bg-amber-50/70 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                          <MapPin className="h-3 w-3 text-amber-600" />
                          {b.shelf_location || 'Unassigned'}
                        </span>
                      </td>

                      {/* Copies Availability */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                            <span
                              className={isAvailable ? 'text-emerald-700' : 'text-rose-600'}
                            >
                              {b.available_copies}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-700">{b.total_copies}</span>
                          </div>

                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                ratio > 50
                                  ? 'bg-emerald-500'
                                  : ratio > 0
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>

                          <span
                            className={`text-[9px] font-semibold mt-1 ${
                              isAvailable ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAvailable && (
                            <button
                              onClick={() => onIssueBook(b)}
                              title="Issue this book"
                              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <BookPlus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewingBook(b)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(b)}
                            title="Edit Book"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingBook(b)}
                            title="Delete Book"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD BOOK MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" />
                Add New Book to Catalog
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Clean Architecture"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Robert C. Martin"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ISBN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 978-0134494166"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g., Prentice Hall"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year *</label>
                  <input
                    type="number"
                    min="1800"
                    max="2099"
                    required
                    value={formData.publication_year}
                    onChange={(e) =>
                      setFormData({ ...formData, publication_year: parseInt(e.target.value) || 2024 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Copies *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_copies}
                    onChange={(e) =>
                      setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf Location</label>
                  <input
                    type="text"
                    placeholder="Rack A-12"
                    value={formData.shelf_location}
                    onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT BOOK MODAL ================= */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Book: {editingBook.title}
              </h3>
              <button
                onClick={() => setEditingBook(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBook} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ISBN *</label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.publication_year}
                    onChange={(e) =>
                      setFormData({ ...formData, publication_year: parseInt(e.target.value) || 2024 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Copies *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_copies}
                    onChange={(e) =>
                      setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf Location</label>
                  <input
                    type="text"
                    value={formData.shelf_location}
                    onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW BOOK DETAILS MODAL ================= */}
      {viewingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Book Details</h3>
              <button
                onClick={() => setViewingBook(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] font-semibold uppercase">Title</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{viewingBook.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Author</p>
                  <p className="font-semibold text-slate-800">{viewingBook.author}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">ISBN</p>
                  <p className="font-mono font-semibold text-slate-800">{viewingBook.isbn}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Category</p>
                  <p className="font-medium text-slate-800">{viewingBook.category}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Publisher</p>
                  <p className="font-medium text-slate-800">{viewingBook.publisher || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Publication Year</p>
                  <p className="font-medium text-slate-800">{viewingBook.publication_year}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Shelf Location</p>
                  <p className="font-mono font-semibold text-amber-700">
                    {viewingBook.shelf_location || 'Not Specified'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between mt-2">
                <div>
                  <p className="text-slate-500 font-medium">Available Copies</p>
                  <p className="text-lg font-black text-emerald-600">
                    {viewingBook.available_copies} of {viewingBook.total_copies}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-medium">Issued Out</p>
                  <p className="text-lg font-black text-slate-700">
                    {viewingBook.total_copies - viewingBook.available_copies}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setViewingBook(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 text-xs hover:bg-slate-50"
              >
                Close
              </button>
              {viewingBook.available_copies > 0 && (
                <button
                  onClick={() => {
                    const b = viewingBook;
                    setViewingBook(null);
                    onIssueBook(b);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold text-xs hover:bg-teal-700 flex items-center gap-1.5"
                >
                  <BookPlus className="h-3.5 w-3.5" />
                  Issue This Book
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">"{deletingBook.title}"</strong>?
              If any copies are currently issued, deletion will be rejected to protect audit records.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingBook(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBook}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold text-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
