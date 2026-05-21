import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Calendar,
  Download,
  Filter,
  Search,
  Info
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Main Earnings Dashboard Component
const EarningsDashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock wallet data
  const walletData = {
    availableBalance: 6850.00,
    pendingBalance: 1250.00,
    totalEarnings: 28420.00,
    totalWithdrawn: 19320.00,
    platformFee: 18, // 18% commission
  };

  // Mock transaction history
  const transactions = useMemo(() => [
    {
      id: 1,
      type: 'earning',
      jobTitle: 'Plumbing Repair',
      client: 'Ama Boateng',
      amount: 250,
      platformFee: 45,
      netAmount: 205,
      status: 'completed',
      date: '2025-12-18',
      time: '10:30 AM',
      reference: 'TXN001',
      escrowReleased: true
    },
    {
      id: 2,
      type: 'earning',
      jobTitle: 'Web Development',
      client: 'Kwame Asante',
      amount: 450,
      platformFee: 81,
      netAmount: 369,
      status: 'pending',
      date: '2025-12-21',
      time: '2:00 PM',
      reference: 'TXN002',
      escrowReleased: false,
      releaseDate: '2025-12-24'
    },
    {
      id: 3,
      type: 'withdrawal',
      method: 'Mobile Money',
      provider: 'MTN',
      amount: 500,
      status: 'completed',
      date: '2025-12-15',
      time: '9:15 AM',
      reference: 'WTH001',
      accountNumber: '*****4567'
    },
    {
      id: 4,
      type: 'earning',
      jobTitle: 'AC Servicing',
      client: 'Esi Adjei',
      amount: 180,
      platformFee: 32.40,
      netAmount: 147.60,
      status: 'completed',
      date: '2025-12-22',
      time: '9:00 AM',
      reference: 'TXN003',
      escrowReleased: true
    },
    {
      id: 5,
      type: 'withdrawal',
      method: 'Bank Transfer',
      provider: 'GCB Bank',
      amount: 1000,
      status: 'processing',
      date: '2025-12-20',
      time: '3:45 PM',
      reference: 'WTH002',
      accountNumber: '****5678'
    }
  ], []);

const filteredTransactions = useMemo(() => {
  const now = new Date();

  // normalize "today"
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // start of calendar week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  // start of month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // start of year
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  return transactions.filter(txn => {
    // 🔍 SEARCH
    const matchesSearch =
      txn.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 🗓 DATE
    const txnDate = new Date(txn.date);
    if (isNaN(txnDate)) return false;

    const txnDay = new Date(
      txnDate.getFullYear(),
      txnDate.getMonth(),
      txnDate.getDate()
    );

    switch (filterPeriod) {
      case 'week':
        return txnDay >= startOfWeek;

      case 'month':
        return txnDay >= startOfMonth;

      case 'year':
        return txnDay >= startOfYear;

      case 'all':
      default:
        return true;
    }
  });
}, [transactions, searchQuery, filterPeriod]);



  const stats = [
    {
      title: 'Available Balance',
      value: `GH₵${walletData.availableBalance.toFixed(2)}`,
      icon: Wallet,
      color: 'green',
      description: 'Ready to withdraw'
    },
    {
      title: 'Pending Balance',
      value: `GH₵${walletData.pendingBalance.toFixed(2)}`,
      icon: Clock,
      color: 'orange',
      description: 'In escrow'
    },
    {
      title: 'Total Earnings',
      value: `GH₵${walletData.totalEarnings.toFixed(2)}`,
      icon: TrendingUp,
      color: 'blue',
      description: 'All time'
    },
    {
      title: 'Total Withdrawn',
      value: `GH₵${walletData.totalWithdrawn.toFixed(2)}`,
      icon: ArrowDownCircle,
      color: 'purple',
      description: 'Successfully withdrawn'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Earnings & Payments</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage your earnings and withdrawals</p>
        </motion.div>

        {/* Main Balance Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8" />
              <h2 className="text-xl font-semibold">Available Balance</h2>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mb-8">
            <p className="text-5xl font-bold mb-2">
              {showBalance ? `GH₵${walletData.availableBalance.toFixed(2)}` : '••••••'}
            </p>
            <p className="text-blue-100">Ready to withdraw</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setWithdrawalModal(true)}
              className="bg-white text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowDownCircle className="w-5 h-5" />
              Withdraw
            </button>
            <button className="bg-white/20 backdrop-blur-sm py-3 px-6 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Statement
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = {
              green: 'bg-green-50 text-green-600',
              orange: 'bg-orange-50 text-secondary',
              blue: 'bg-primary/10 text-primary',
              purple: 'bg-purple-50 text-purple-600'
            };

            return (
              <motion.div
                key={index}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-[#1a1f2e] rounded-xl p-6 shadow-md"
              >
                <div className={`p-3 rounded-lg ${colors[stat.color]} w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                  {showBalance ? stat.value : '••••••'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-500">{stat.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Platform Fee Info */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8"
        >
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Platform Fee</h4>
              <p className="text-sm text-blue-800">
                Lucid charges an 18% service fee on all completed jobs. This fee covers payment processing, 
                customer support, insurance, and platform maintenance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#1e293b]">
          {['overview', 'earnings', 'withdrawals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition-colors ${
                selectedTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Transactions Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Transaction History</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none dark:bg-[#252b3b] dark:text-slate-200"
                />
              </div>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none dark:bg-[#252b3b] dark:text-slate-200"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.map((txn) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onClick={() => setSelectedTransaction(txn)}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Withdrawal Modal */}
      {withdrawalModal && (
        <WithdrawalModal
          availableBalance={walletData.availableBalance}
          onClose={() => setWithdrawalModal(false)}
        />
      )}

      {/* Transaction Details Modal */}
      <AnimatePresence>
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
      </AnimatePresence>
    </div>
  );
};

// Transaction Item Component
const TransactionItem = ({ transaction, onClick }) => {
  const isEarning = transaction.type === 'earning';
  const isWithdrawal = transaction.type === 'withdrawal';

  const statusColors = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-primary/10 text-primary',
    failed: 'bg-red-100 text-red-700'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 border-2 border-gray-100 dark:border-[#1e293b] rounded-lg hover:border-blue-200 dark:hover:border-[#2d3748] cursor-pointer transition-all dark:bg-[#252b3b]"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${
          isEarning ? 'bg-green-50' : 'bg-primary/10'
        }`}>
          {isEarning ? (
            <ArrowUpCircle className={`w-5 h-5 ${
              isEarning ? 'text-green-600' : 'text-blue-600'
            }`} />
          ) : (
            <ArrowDownCircle className="w-5 h-5 text-blue-600" />
          )}
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-slate-100">
            {isEarning ? transaction.jobTitle : `${transaction.method} Withdrawal`}
          </h4>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {transaction.date} • {transaction.reference}
          </p>
          {isEarning && transaction.client && (
            <p className="text-xs text-gray-500 dark:text-slate-500">Client: {transaction.client}</p>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className={`text-lg font-bold ${
          isEarning ? 'text-green-600' : 'text-gray-900 dark:text-slate-100'
        }`}>
          {isEarning ? '+' : '-'}GH₵{transaction.amount.toFixed(2)}
        </p>
        {isEarning && (
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Net: GH₵{transaction.netAmount.toFixed(2)}
          </p>
        )}
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 capitalize ${statusColors[transaction.status]}`}>
          {transaction.status}
        </span>
      </div>
    </motion.div>
  );
};

// Withdrawal Modal Component
const WithdrawalModal = ({ availableBalance, onClose }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mobile-money');
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const withdrawalMethods = [
    { id: 'mobile-money', name: 'Mobile Money', icon: Smartphone },
    { id: 'bank', name: 'Bank Transfer', icon: Building }
  ];

  const mobileProviders = ['MTN', 'Vodafone', 'AirtelTigo'];
  const banks = ['GCB Bank', 'Ecobank', 'Absa Bank', 'Fidelity Bank', 'Stanbic Bank'];

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) > availableBalance) {
      alert('Insufficient balance');
      return;
    }
    if (!provider || !accountNumber) {
      alert('Please complete all fields');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    alert('Withdrawal request submitted successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] rounded-2xl max-w-md w-full p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Withdraw Funds</h2>

        <div className="space-y-6">
          {/* Available Balance */}
          <div className="bg-gray-50 dark:bg-[#252b3b] rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">GH₵{availableBalance.toFixed(2)}</p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-slate-400 font-semibold">
                GH₵
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none dark:bg-[#252b3b] dark:text-slate-200"
              />
            </div>
            <button
              onClick={() => setAmount(availableBalance.toString())}
              className="text-sm text-primary hover:text-primary-hover font-semibold mt-2"
            >
              Withdraw All
            </button>
          </div>

          {/* Withdrawal Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Withdrawal Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {withdrawalMethods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      method === m.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-[#2d3748] hover:border-gray-300 dark:bg-[#252b3b]'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      method === m.id ? 'text-primary' : 'text-gray-600 dark:text-slate-400'
                    }`} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{m.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {method === 'mobile-money' ? 'Mobile Money Provider' : 'Bank'}
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none dark:bg-[#252b3b] dark:text-slate-200"
            >
              <option value="">Select {method === 'mobile-money' ? 'provider' : 'bank'}</option>
              {(method === 'mobile-money' ? mobileProviders : banks).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {method === 'mobile-money' ? 'Phone Number' : 'Account Number'}
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={method === 'mobile-money' ? '+233 XX XXX XXXX' : 'Account number'}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none dark:bg-[#252b3b] dark:text-slate-200"
            />
          </div>

          {/* Processing Time Info */}
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-3">
            <p className="text-sm text-primary-dark/80">
              <strong>Processing Time:</strong> Withdrawals are typically processed within 24 hours
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-5 h-5" />
                Withdraw GH₵{amount || '0.00'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Transaction Details Modal Component
const TransactionDetailsModal = ({ transaction, onClose }) => {
  const isEarning = transaction.type === 'earning';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] rounded-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Transaction Details</h2>

        <div className="space-y-6">
          {/* Amount Card */}
          <div className={`${isEarning ? 'bg-green-50' : 'bg-blue-50'} rounded-lg p-6 text-center`}>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Amount</p>
            <p className={`text-4xl font-bold ${isEarning ? 'text-green-600' : 'text-blue-600'} mb-2`}>
              {isEarning ? '+' : '-'}GH₵{transaction.amount.toFixed(2)}
            </p>
            {isEarning && (
              <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                <p>Platform Fee (18%): -GH₵{transaction.platformFee.toFixed(2)}</p>
                <p className="font-semibold text-green-700">Net Amount: GH₵{transaction.netAmount.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <DetailRow label="Reference" value={transaction.reference} />
            <DetailRow label="Date" value={`${transaction.date} at ${transaction.time}`} />
            <DetailRow label="Status" value={
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold capitalize">
                {transaction.status}
              </span>
            } />
            
            {isEarning ? (
              <>
                <DetailRow label="Job Title" value={transaction.jobTitle} />
                <DetailRow label="Client" value={transaction.client} />
                {!transaction.escrowReleased && (
                  <DetailRow 
                    label="Escrow Release" 
                    value={`Expected: ${transaction.releaseDate}`}
                    info="Funds will be available after client confirms job completion"
                  />
                )}
              </>
            ) : (
              <>
                <DetailRow label="Method" value={transaction.method} />
                <DetailRow label="Provider" value={transaction.provider} />
                <DetailRow label="Account" value={transaction.accountNumber} />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#1e293b]">
            <button className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download Receipt
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Detail Row Component
const DetailRow = ({ label, value, info }) => (
  <div className="flex justify-between items-start py-3 border-b border-gray-100 dark:border-[#1e293b]">
    <div>
      <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
      {info && <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{info}</p>}
    </div>
    <p className="font-semibold text-gray-900 dark:text-slate-100 text-right">{value}</p>
  </div>
);

export default EarningsDashboard;