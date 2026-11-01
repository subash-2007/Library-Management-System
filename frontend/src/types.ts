export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string | null;
  category: string;
  publication_year: number;
  total_copies: number;
  available_copies: number;
  shelf_location?: string | null;
  created_at?: string;
}

export interface BookFormData {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category: string;
  publication_year: number;
  total_copies: number;
  shelf_location?: string;
}

export interface Member {
  id: number;
  member_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  membership_date: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  created_at?: string;
}

export interface MemberFormData {
  member_id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
}

export interface TransactionDetail {
  id: number;
  book_id: number;
  member_id: number;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'Issued' | 'Returned' | 'Overdue';
  late_fee: number;
  notes?: string | null;
  created_at?: string;
  book_title: string;
  book_isbn: string;
  member_name: string;
  member_code: string;
  is_overdue: boolean;
  overdue_days: number;
  calculated_late_fee: number;
}

export interface IssueBookRequest {
  book_id: number;
  member_id: number;
  issue_date?: string;
  borrow_days?: number;
  notes?: string;
}

export interface ReturnBookRequest {
  transaction_id: number;
  return_date?: string;
  notes?: string;
}

export interface MonthlyStat {
  month: string;
  issued_count: number;
  returned_count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface MostBorrowedBook {
  id: number;
  title: string;
  author: string;
  borrow_count: number;
}

export interface DashboardStats {
  total_books: number;
  available_books: number;
  issued_books: number;
  total_members: number;
  overdue_books: number;
  books_returned_today: number;
  monthly_stats: MonthlyStat[];
  category_stats: CategoryStat[];
  most_borrowed_books: MostBorrowedBook[];
  recent_transactions: TransactionDetail[];
}

export interface SystemSettings {
  late_fee_per_day: number;
  default_borrow_period_days: number;
  library_name: string;
  max_books_per_member: number;
  currency_symbol: string;
}

export interface ReportResponse {
  title: string;
  report_type: string;
  generated_at: string;
  total_records: number;
  data: Array<Record<string, any>>;
}

export type ActiveTab =
  | 'dashboard'
  | 'books'
  | 'members'
  | 'issue'
  | 'return'
  | 'transactions'
  | 'reports'
  | 'settings';
