import React, { useState, useEffect } from 'react';
import { ActiveTab, DashboardStats, SystemSettings, Book, TransactionDetail } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BookManagement } from './components/BookManagement';
import { MemberManagement } from './components/MemberManagement';
import { IssueBook } from './components/IssueBook';
import { ReturnBook } from './components/ReturnBook';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { NotificationToast, ToastMessage } from './components/NotificationToast';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [settings, setSettings] = useState<SystemSettings>({
    late_fee_per_day: 5.0,
    default_borrow_period_days: 14,
    library_name: 'Auspify Central Library',
    max_books_per_member: 5,
    currency_symbol: '₹',
  });

  // Cross-component transition state
  const [preselectedBook, setPreselectedBook] = useState<Book | null>(null);
  const [quickReturnTx, setQuickReturnTx] = useState<TransactionDetail | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoadingStats(true);
      setIsRefreshing(true);
      const [statsRes, settingsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getSettings(),
      ]);
      setStats(statsRes);
      setSettings(settingsRes);
    } catch (err) {
      console.error('Failed to load system data', err);
      showToast('error', 'Could not connect to backend API server.');
    } finally {
      setLoadingStats(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueBook = (book: Book) => {
    setPreselectedBook(book);
    setActiveTab('issue');
  };

  const handleQuickReturn = (tx: TransactionDetail) => {
    setQuickReturnTx(tx);
    setActiveTab('return');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'issue') setPreselectedBook(null);
          if (tab !== 'return') setQuickReturnTx(null);
        }}
        stats={stats}
        systemName={settings.library_name}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          libraryName={settings.library_name}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              loading={loadingStats}
              setActiveTab={setActiveTab}
              onQuickReturn={handleQuickReturn}
              currencySymbol={settings.currency_symbol}
            />
          )}

          {activeTab === 'books' && (
            <BookManagement
              onIssueBook={handleIssueBook}
              showToast={showToast}
            />
          )}

          {activeTab === 'members' && (
            <MemberManagement
              showToast={showToast}
              currencySymbol={settings.currency_symbol}
            />
          )}

          {activeTab === 'issue' && (
            <IssueBook
              preselectedBook={preselectedBook}
              onSuccess={() => {
                loadData(true);
              }}
              showToast={showToast}
              defaultBorrowDays={settings.default_borrow_period_days}
            />
          )}

          {activeTab === 'return' && (
            <ReturnBook
              quickReturnTx={quickReturnTx}
              onSuccess={() => {
                loadData(true);
              }}
              showToast={showToast}
              lateFeePerDay={settings.late_fee_per_day}
              currencySymbol={settings.currency_symbol}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              onQuickReturn={handleQuickReturn}
              showToast={showToast}
              currencySymbol={settings.currency_symbol}
            />
          )}

          {activeTab === 'reports' && <Reports showToast={showToast} />}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
              }}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default App;
