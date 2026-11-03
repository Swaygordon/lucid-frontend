// @backend-handoff-delete Transaction surface currently uses illustrative workflow data.
import React, { useState, useMemo, useEffect, lazy } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from '../../hooks/useNavigateBack.js';
import { useWorkflowActor } from '../../contexts/WorkflowModeContext.jsx';
import { useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import { toProviderTransactions } from '../../services/workflow/providerFinancePresentation.js';
import {
  ArrowLeft,
  DollarSign,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';

// [API] GET /providers/:id/transactions?page={n}&status={}&type={}
const ALL_TRANSACTIONS = [];

const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed'];
const TYPE_FILTERS   = ['All', 'Payments', 'Withdrawals'];

const LegacyTransactionsPage = ({ preview = false }) => {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const handleBackClick = useNavigateBack('/lucid/earnings', 600);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [typeFilter, setType]     = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [previewRows, setPreviewRows] = useState([]);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (!preview) return;
    let active = true;
    services.finance.listEntries({ role: actor.role, userId: actor.userId }).then(result => {
      if (!active) return;
      if (result.error) setPreviewError(result.error.message);
      else setPreviewRows(toProviderTransactions(result.data));
    });
    return () => { active = false; };
  }, [preview, services, actor.role, actor.userId]);

  const transactions = preview ? previewRows : ALL_TRANSACTIONS;

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.method.toLowerCase().includes(search.toLowerCase()) ||
        (t.jobType && t.jobType.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'All' || t.status === statusFilter.toLowerCase();

      const matchesType =
        typeFilter === 'All' ||
        (typeFilter === 'Payments'    && t.amount > 0) ||
        (typeFilter === 'Withdrawals' && t.amount < 0);

      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => sortOrder === 'oldest' ? new Date(a.timestamp || 0) - new Date(b.timestamp || 0) : sortOrder === 'amount-high' ? Math.abs(b.amount) - Math.abs(a.amount) : sortOrder === 'amount-low' ? Math.abs(a.amount) - Math.abs(b.amount) : new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [transactions, search, statusFilter, typeFilter, sortOrder]);

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Amount (GH₵)', 'Type', 'Status', 'Method', 'Job Type'];
    const rows = filtered.map(t => [
      t.date,
      t.description,
      Math.abs(t.amount),
      t.amount < 0 ? 'Withdrawal' : 'Payment',
      t.status,
      t.method,
      t.jobType || '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    pending:   { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    failed:    { icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-100 dark:bg-red-900/30'   },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] shadow-sm sticky top-0 z-30"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackClick}
                aria-label="Go back"
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">All Transactions</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">{filtered.length} records</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#252b3b] border-2 border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </motion.header>

      {preview && <div data-preview-disclosure className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">Preview ledger: these entries are simulated and do not represent real payments.</div>}
      {previewError && <div role="alert" className="mx-auto mt-4 max-w-4xl px-4 text-sm text-red-600">{previewError}</div>}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search transactions"
            placeholder="Search by case, method, or job type..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:flex-none">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={typeFilter === f}
                  onClick={() => setType(f)}
                  className={`min-h-10 shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    typeFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-[#1a1f2e] text-gray-600 dark:text-slate-400 border-2 border-gray-200 dark:border-[#2d3748] hover:border-blue-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-600 dark:text-slate-300 sm:justify-start">Sort by
            <select value={sortOrder} onChange={event => setSortOrder(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-[#394458] dark:bg-[#252b3b]"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount-high">Amount: high to low</option><option value="amount-low">Amount: low to high</option></select>
          </label>
          <div className="flex w-full gap-1 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:w-auto">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                type="button"
                aria-pressed={statusFilter === f}
                onClick={() => setStatus(f)}
                className={`min-h-10 shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  statusFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-[#1a1f2e] text-gray-600 dark:text-slate-400 border-2 border-gray-200 dark:border-[#2d3748] hover:border-blue-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-md overflow-hidden"
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600 dark:text-slate-400">
              <DollarSign className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filtered.map((t, i) => {
              const isWithdrawal = t.amount < 0;
              const cfg = statusConfig[t.status];
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-4 px-6 py-4 ${
                    i !== filtered.length - 1 ? 'border-b border-gray-100 dark:border-[#1e293b]' : ''
                  }`}
                >
                  {/* Type icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${isWithdrawal ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                    <DollarSign className={`w-5 h-5 ${isWithdrawal ? 'text-red-500' : 'text-green-600'}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{t.description}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t.date}
                      </span>
                      <span>{t.method}</span>
                      {t.jobType && <span>· {t.jobType}</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {t.status}
                  </span>

                  {/* Amount */}
                  <p className={`text-base font-bold flex-shrink-0 ${isWithdrawal ? 'text-red-500' : 'text-green-600'}`}>
                    {isWithdrawal ? '-' : '+'}GH₵{Math.abs(t.amount).toLocaleString()}
                  </p>
                </div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};

const WorkflowFinancePage = lazy(() => import('./WorkflowFinancePage.jsx'));
const TransactionsPage = () => {
  const actor = useWorkflowActor();
  if (actor.mode !== 'preview') return <LegacyTransactionsPage />;
  if (['provider', 'service_provider'].includes(actor.role)) return <LegacyTransactionsPage preview />;
  return <WorkflowFinancePage />;
};
export default TransactionsPage;
