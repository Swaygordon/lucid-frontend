import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useNavigateBack } from "../hooks/useNavigateBack.js";
import EarningsChart from '../components/earnings_chart.jsx';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Download,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
  Building,
  Smartphone,
  Briefcase,
  Target,
  X,
} from 'lucide-react';


const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerGrid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const WithdrawModal = ({ onClose, available, paymentMethods }) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(
    paymentMethods.find(m => m.isPrimary)?.id || paymentMethods[0]?.id
  );
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= available;

  const handleQuick = (pct) => {
    setAmount(pct === 100 ? available.toString() : (available * pct / 100).toFixed(2));
  };

  const handleConfirm = async () => {
    setConfirming(true);
    // [API] POST /providers/:id/payouts — { amount: numAmount, paymentMethodId: selectedMethod }
    await new Promise(r => setTimeout(r, 1500));
    setConfirming(false);
    setDone(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl p-6"
      >
        {done ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">Withdrawal Submitted</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
              GH₵{numAmount.toLocaleString()} will be sent to your selected account.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Withdraw Funds</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Available balance */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Available to withdraw</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">GH₵{available.toLocaleString()}</p>
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold">GH₵</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-blue-500 text-lg font-semibold"
                />
              </div>
              {numAmount > available && (
                <p className="text-red-500 text-sm mt-1">Amount exceeds available balance</p>
              )}
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  onClick={() => handleQuick(pct)}
                  className="py-2 text-sm font-semibold rounded-lg border-2 border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {pct === 100 ? 'All' : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Payment method */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Send to</label>
              <div className="space-y-2">
                {paymentMethods.map(method => {
                  const icons = { 'mobile-money': Smartphone, 'bank': Building };
                  const Icon = icons[method.type] || Wallet;
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-[#2d3748] hover:border-gray-300 dark:hover:border-[#3d4758]'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-[#252b3b]'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500 dark:text-slate-400'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-slate-100'}`}>
                          {method.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">{method.number || method.accountNumber}</p>
                      </div>
                      {method.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">Primary</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid || confirming}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const TYPE_OPTIONS = [
  { value: 'mobile-money', label: 'Mobile Money', icon: Smartphone },
  { value: 'bank',         label: 'Bank Account', icon: Building   },
];

// Paystack bank_code values for Ghana mobile money — verify against GET /bank?country=ghana
const MOBILE_MONEY_PROVIDERS = [
  { code: 'MTN', name: 'MTN Mobile Money' },
  { code: 'VOD', name: 'Vodafone Cash'    },
  { code: 'ATL', name: 'AirtelTigo Money' },
];

// Paystack bank_code values for Ghana banks — verify against GET /bank?country=ghana
const GHANA_BANKS = [
  { code: '030100', name: 'GCB Bank'                    },
  { code: '130100', name: 'Ecobank Ghana'                },
  { code: '020100', name: 'Standard Chartered Bank'      },
  { code: '190100', name: 'Stanbic Bank Ghana'           },
  { code: '030700', name: 'Absa Bank Ghana'              },
  { code: '240100', name: 'Fidelity Bank Ghana'          },
  { code: '340100', name: 'CalBank'                      },
  { code: '410100', name: 'UBA Ghana'                    },
  { code: '280100', name: 'Access Bank Ghana'            },
  { code: '120100', name: 'Zenith Bank Ghana'            },
  { code: '150100', name: 'GT Bank Ghana'                },
  { code: '080100', name: 'Agricultural Development Bank'},
  { code: '360100', name: 'National Investment Bank'     },
  { code: '180100', name: 'Prudential Bank'              },
  { code: '430100', name: 'Republic Bank Ghana'          },
  { code: '170100', name: 'First Atlantic Bank'          },
  { code: '220100', name: 'Universal Merchant Bank'      },
  { code: '200100', name: 'Societe Generale Ghana'       },
  { code: '230100', name: 'Consolidated Bank Ghana'      },
  { code: '070100', name: 'Bank of Africa Ghana'         },
];

const selectClass = 'w-full px-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer';

const PaymentMethodModal = ({ method = null, onClose, onSave }) => {
  const isEdit = !!method;

  const defaultProvider = () => {
    if (!isEdit) return '';
    if (method.type === 'mobile-money')
      return MOBILE_MONEY_PROVIDERS.find(p => p.code === method.bankCode)?.code || '';
    return GHANA_BANKS.find(b => b.code === method.bankCode)?.code || '';
  };

  const [form, setForm] = useState({
    type:        method?.type      || 'mobile-money',
    bankCode:    defaultProvider(),
    number:      method?.number    || '',
    isPrimary:   method?.isPrimary || false,
  });
  const [error, setError] = useState('');

  const providers = form.type === 'mobile-money' ? MOBILE_MONEY_PROVIDERS : GHANA_BANKS;

  // Reset provider selection when type changes
  const handleTypeChange = (type) => {
    setForm(f => ({ ...f, type, bankCode: '' }));
    setError('');
  };

  const handleSave = () => {
    if (!form.bankCode)          { setError('Please select a provider.'); return; }
    if (!form.number.trim())     { setError('Please enter the account or phone number.'); return; }
    const selected = providers.find(p => p.code === form.bankCode);
    onSave(isEdit
      ? { ...method, ...form, name: selected.name }
      : { ...form, name: selected.name }
    );
  };

  const numberLabel       = form.type === 'mobile-money' ? 'Phone Number'    : 'Account Number';
  const numberPlaceholder = form.type === 'mobile-money' ? '024 123 4567'    : '1234567890';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            {isEdit ? 'Edit Payment Method' : 'Add Payment Method'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Type selector */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const selected = form.type === value;
              return (
                <button
                  key={value}
                  onClick={() => handleTypeChange(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-[#2d3748] hover:border-gray-300 dark:hover:border-[#3d4758]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${selected ? 'text-blue-600' : 'text-gray-400 dark:text-slate-500'}`} />
                  <span className={`text-xs font-semibold ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-slate-400'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider / Bank dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
            {form.type === 'mobile-money' ? 'Mobile Money Provider' : 'Bank'}
          </label>
          <select
            value={form.bankCode}
            onChange={e => { setForm(f => ({ ...f, bankCode: e.target.value })); setError(''); }}
            className={selectClass}
          >
            <option value="" disabled>
              {form.type === 'mobile-money' ? 'Select provider...' : 'Select bank...'}
            </option>
            {providers.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Number input */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{numberLabel}</label>
          <input
            type="text"
            value={form.number}
            onChange={e => { setForm(f => ({ ...f, number: e.target.value })); setError(''); }}
            placeholder={numberPlaceholder}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Set as primary */}
        <button
          type="button"
          role="switch"
          aria-checked={form.isPrimary}
          onClick={() => setForm(f => ({ ...f, isPrimary: !f.isPrimary }))}
          className="flex items-center gap-3 mb-6 cursor-pointer select-none w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div
            className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.isPrimary ? 'bg-blue-600' : 'bg-gray-300 dark:bg-[#2d3748]'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full mt-1 shadow transition-transform ${form.isPrimary ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Set as primary payment method</span>
        </button>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            {isEdit ? 'Save Changes' : 'Add Method'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RemovePaymentModal = ({ method, onClose, onConfirm }) => {
  const icons = { 'mobile-money': Smartphone, 'bank': Building };
  const Icon = icons[method.type] || Wallet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl p-6"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <Trash2 className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Remove Payment Method</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#252b3b] rounded-xl mb-3">
            <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{method.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{method.number}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            This will be permanently removed. You can always add it back later.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, amount, change, trend, subtitle }) => (
  <motion.div
    variants={fadeIn}
    className="bg-white dark:bg-[#1a1f2e] rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${
        trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-primary/10'
      }`}>
        <Icon className={`w-6 h-6 ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-error' : 'text-primary'
        }`} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          parseFloat(change) >= 0 ? 'text-green-600' : 'text-error'
        }`}>
          {parseFloat(change) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <h2 className="text-gray-600 dark:text-slate-400 text-sm font-medium mb-1">{title}</h2>
    <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">GH₵{amount.toLocaleString()}</p>
    {subtitle && <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{subtitle}</p>}
  </motion.div>
);

const TransactionItem = ({ transaction }) => {
  const isWithdrawal = transaction.amount < 0;
  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    pending:   { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-100' },
    failed:    { icon: AlertCircle,  color: 'text-error',      bg: 'bg-red-100'    },
  }[transaction.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-[#1e293b] last:border-0">
      <div className="flex gap-4 flex-1">
        <div className={`p-2 rounded-lg ${isWithdrawal ? 'bg-red-50' : 'bg-green-50'} h-fit`}>
          <DollarSign className={`w-5 h-5 ${isWithdrawal ? 'text-error' : 'text-green-600'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100">{transaction.description}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {transaction.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {transaction.date}
            </span>
            <span>{transaction.method}</span>
            {transaction.jobType && <span>• {transaction.jobType}</span>}
          </div>
        </div>
      </div>
      <div className={`text-lg font-bold ${isWithdrawal ? 'text-error' : 'text-green-600'}`}>
        {isWithdrawal ? '-' : '+'}GH₵{Math.abs(transaction.amount)}
      </div>
    </div>
  );
};

// Detect Ghanaian mobile carrier from phone number prefix
const detectCarrier = (phone) => {
  const digits = phone.replace(/\D/g, '');
  const prefix = digits.slice(0, 3);
  if (['024', '054', '055', '059'].includes(prefix)) return MOBILE_MONEY_PROVIDERS.find(p => p.code === 'MTN');
  if (['020', '050'].includes(prefix))                return MOBILE_MONEY_PROVIDERS.find(p => p.code === 'VOD');
  if (['026', '056', '027', '057'].includes(prefix)) return MOBILE_MONEY_PROVIDERS.find(p => p.code === 'ATL');
  return null;
};

const EarningsPayments = () => {
  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [removingMethod, setRemovingMethod] = useState(null);
  const [pendingAutoMethod, setPendingAutoMethod] = useState(() => {
    // [MOCK] Replace with phone from auth context or GET /users/:id/profile
    const userPhone = '024 123 4567';
    const carrier = detectCarrier(userPhone);
    if (!carrier) return null;
    return {
      type: 'mobile-money',
      bankCode: carrier.code,
      name: carrier.name,
      number: userPhone,
      isPrimary: true,
    };
  });


  // [API] GET /providers/:id/earnings?period={week|month|year}
  const earningsData = useMemo(() => ({
    thisWeek: 0, lastWeek: 0,
    thisMonth: 0, lastMonth: 0,
    thisYear: 0, lastYear: 0,
    pending: 0, available: 0,
    weeklyData: [], monthlyData: [], yearlyData: [],
    totalJobs: { thisWeek: 0, thisMonth: 0, thisYear: 0 },
    goals: { monthly: 0, yearly: 0 }
  }), []);

  // [API] GET /providers/:id/transactions?page={n}
  const transactions = useMemo(() => [], []);

  // [MOCK] paymentMethods — replace with GET /users/:id/payment-methods — [{id, type, name, number, isPrimary}]
  // Start with an empty list to trigger auto-detect on first visit; real app seeds from API response
  // [MOCK] Start empty to simulate a new provider with no saved methods yet.
  // Replace with data from GET /users/:id/payment-methods on mount.
  const [paymentMethods, setPaymentMethods] = useState([]);

  const handleAddMethod = (newMethod) => {
    setPaymentMethods(prev => {
      const updated = newMethod.isPrimary
        ? prev.map(m => ({ ...m, isPrimary: false }))
        : prev;
      return [...updated, { ...newMethod, id: Date.now() }];
    });
  };

  const handleEditMethod = (updated) => {
    setPaymentMethods(prev => {
      const base = updated.isPrimary
        ? prev.map(m => ({ ...m, isPrimary: m.id === updated.id ? true : false }))
        : prev;
      return base.map(m => m.id === updated.id ? { ...m, ...updated } : m);
    });
  };

  const handleRemoveMethod = (id) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const handleConfirmAutoMethod = () => {
    handleAddMethod(pendingAutoMethod);
    setPendingAutoMethod(null);
  };

  const pctChange = (curr, prev) => prev ? ((curr - prev) / prev * 100).toFixed(1) : '0.0';
  const weekChange = pctChange(earningsData.thisWeek, earningsData.lastWeek);
  const monthChange = pctChange(earningsData.thisMonth, earningsData.lastMonth);
  const yearChange = pctChange(earningsData.thisYear, earningsData.lastYear);

  const exportTransactions = () => {
    const headers = ['Date', 'Description', 'Amount (GH₵)', 'Type', 'Status', 'Method', 'Job Type'];
    const rows = transactions.map(t => [
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


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <AnimatePresence>
        {showWithdrawModal && (
          <WithdrawModal
            onClose={() => setShowWithdrawModal(false)}
            available={earningsData.available}
            paymentMethods={paymentMethods}
          />
        )}
        {addModalOpen && (
          <PaymentMethodModal
            onClose={() => setAddModalOpen(false)}
            onSave={(m) => { handleAddMethod(m); setAddModalOpen(false); }}
          />
        )}
        {editingMethod && (
          <PaymentMethodModal
            method={editingMethod}
            onClose={() => setEditingMethod(null)}
            onSave={(m) => { handleEditMethod(m); setEditingMethod(null); }}
          />
        )}
        {removingMethod && (
          <RemovePaymentModal
            method={removingMethod}
            onClose={() => setRemovingMethod(null)}
            onConfirm={() => { handleRemoveMethod(removingMethod.id); setRemovingMethod(null); }}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] shadow-sm sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Earnings & Payments</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your earnings and payment methods</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Auto-detected payout account banner */}
      <AnimatePresence>
        {pendingAutoMethod && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We detected{' '}
                  <span className="font-bold">{pendingAutoMethod.name} ({pendingAutoMethod.number})</span>
                  {' '}from your sign-up number. Set this as your payout account?
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleConfirmAutoMethod}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setPendingAutoMethod(null); setAddModalOpen(true); }}
                  className="px-4 py-1.5 border-2 border-blue-400 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => setPendingAutoMethod(null)}
                  className="p-1.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 rounded transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {/* [MOCK] Stat values from earningsData — replace with GET /providers/:id/earnings?period=month */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerGrid}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={DollarSign}
            title="This Week"
            amount={earningsData.thisWeek}
            change={weekChange}
            trend={weekChange >= 0 ? 'up' : 'down'}
            subtitle={`${earningsData.totalJobs.thisWeek} jobs completed`}
          />
          <StatCard
            icon={DollarSign}
            title="This Month"
            amount={earningsData.thisMonth}
            change={monthChange}
            trend={monthChange >= 0 ? 'up' : 'down'}
            subtitle={`${earningsData.totalJobs.thisMonth} jobs completed`}
          />
          <StatCard
            icon={Clock}
            title="Pending"
            amount={earningsData.pending}
            subtitle="Awaiting payment"
          />
          <StatCard
            icon={Wallet}
            title="Available"
            amount={earningsData.available}
            trend="neutral"
            subtitle="Ready to withdraw"
          />
        </motion.div>

        {/* Earnings Chart */}
        {/* [DB] Chart data aggregated from completed bookings with paymentStatus='paid', grouped by selectedPeriod */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-[#1a1f2e] rounded-xl p-6 shadow-md mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Earnings Overview</h2>
            {/* [API] GET /providers/:id/earnings/report?period={week|month|year} — detailed breakdown export */}
            <button className="px-4 py-2 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-semibold transition-colors">
              View Detailed Report
            </button>
          </div>
          <EarningsChart />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Recent Transactions</h2>
                  <Link
                    to="/lucid/transactions"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                {/* [API] GET /providers/:id/transactions?page={n} — paginated; also supports ?export=csv */}
                <button
                  onClick={exportTransactions}
                  className="px-4 py-2 bg-white dark:bg-[#252b3b] border-2 border-gray-200 dark:border-[#1e293b] text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div>
                {transactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>

            {/* Withdraw Section */}
            {/* [API] POST /providers/:id/payouts — {amount, bankDetails} → {payoutId, status, estimatedArrival} */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-2">Ready to withdraw?</h3>
              <p className="text-blue-100 mb-6">
                You have GH₵{earningsData.available.toLocaleString()} available for withdrawal
              </p>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Withdraw Funds
              </button>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Payment Methods</h2>
                {/* [API] POST /users/:id/payment-methods */}
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Add payment method"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const icons = { 'mobile-money': Smartphone, 'bank': Building };
                  const Icon = icons[method.type] || Wallet;
                  return (
                    <div key={method.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-[#1e293b] last:border-0">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{method.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">{method.number || method.accountNumber}</p>
                      </div>
                      {method.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium flex-shrink-0">
                          Primary
                        </span>
                      )}
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingMethod(method)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!method.isPrimary && (
                          <button
                            onClick={() => setRemovingMethod(method)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EarningsPayments;
