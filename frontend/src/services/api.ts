import axios from 'axios';
import {
  Book,
  BookFormData,
  Member,
  MemberFormData,
  TransactionDetail,
  IssueBookRequest,
  ReturnBookRequest,
  DashboardStats,
  SystemSettings,
  ReportResponse,
} from '../types';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Books
  getBooks: async (params?: {
    search?: string;
    category?: string;
    availability?: string;
    skip?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{ items: Book[]; total: number }>('/books', { params });
    return res.data;
  },

  getBook: async (id: number) => {
    const res = await apiClient.get<Book>(`/books/${id}`);
    return res.data;
  },

  createBook: async (data: BookFormData) => {
    const res = await apiClient.post<Book>('/books', data);
    return res.data;
  },

  updateBook: async (id: number, data: Partial<BookFormData>) => {
    const res = await apiClient.put<Book>(`/books/${id}`, data);
    return res.data;
  },

  deleteBook: async (id: number) => {
    const res = await apiClient.delete<{ message: string }>(`/books/${id}`);
    return res.data;
  },

  // Members
  getMembers: async (params?: {
    search?: string;
    department?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{ items: Member[]; total: number }>('/members', { params });
    return res.data;
  },

  getMember: async (id: number) => {
    const res = await apiClient.get<Member>(`/members/${id}`);
    return res.data;
  },

  getMemberHistory: async (id: number) => {
    const res = await apiClient.get<{
      member: Member;
      total_borrowed: number;
      active_borrowed_count: number;
      transactions: TransactionDetail[];
    }>(`/members/${id}/history`);
    return res.data;
  },

  createMember: async (data: MemberFormData) => {
    const res = await apiClient.post<Member>('/members', data);
    return res.data;
  },

  updateMember: async (id: number, data: Partial<MemberFormData>) => {
    const res = await apiClient.put<Member>(`/members/${id}`, data);
    return res.data;
  },

  deleteMember: async (id: number) => {
    const res = await apiClient.delete<{ message: string }>(`/members/${id}`);
    return res.data;
  },

  // Transactions
  getTransactions: async (params?: {
    status?: string;
    member_id?: number;
    book_id?: number;
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{ items: TransactionDetail[]; total: number }>('/transactions', { params });
    return res.data;
  },

  issueBook: async (data: IssueBookRequest) => {
    const res = await apiClient.post<TransactionDetail>('/transactions/issue', data);
    return res.data;
  },

  returnBook: async (data: ReturnBookRequest) => {
    const res = await apiClient.post<TransactionDetail>('/transactions/return', data);
    return res.data;
  },

  getDashboardStats: async () => {
    const res = await apiClient.get<DashboardStats>('/transactions/dashboard-stats');
    return res.data;
  },

  // Reports
  getReport: async (type: string) => {
    const res = await apiClient.get<ReportResponse>('/reports', { params: { type } });
    return res.data;
  },

  getReportCsvUrl: (type: string) => {
    return `${API_BASE}/reports/export/csv?type=${encodeURIComponent(type)}`;
  },

  // Settings
  getSettings: async () => {
    const res = await apiClient.get<SystemSettings>('/settings');
    return res.data;
  },

  updateSettings: async (settings: SystemSettings) => {
    const res = await apiClient.put<SystemSettings>('/settings', settings);
    return res.data;
  },
};
