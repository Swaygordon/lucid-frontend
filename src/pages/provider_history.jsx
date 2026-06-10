import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useModalBackButton } from '../hooks/useModalBackButton.js';
import { PageHeader } from '../components/ui';
import { BookingDetailsModal, ReceiptModal } from '../components/shared';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Calendar, Clock, DollarSign, Filter, Download, FileText,
  Star, MapPin, User, BarChart3, Eye
} from 'lucide-react';
import { Button, Card } from '../components/ui';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const PERIODS = [
  { id: 'all', label: 'All Time' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' }
];

const ProviderHistory = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);

  const handleBackClick = useNavigateBack('/lucid/dashboard', 400);

  // Browser back / mobile gesture closes the modal instead of leaving the page
  useModalBackButton(!!selectedBooking, () => setSelectedBooking(null));
  useModalBackButton(showReceipt, () => setShowReceipt(false));

  const filteredHistory = [];

  // [API] GET /bookings/stats?providerId={id} → {totalJobs, completedJobs, cancelledJobs, completionRate, totalEarnings, avgRating}
  const stats = { totalJobs: 0, completedJobs: 0, cancelledJobs: 0, completionRate: 0, totalEarnings: 0, avgRating: 0 };

  const HistoryItem = ({ item }) => {
    const clientName = item.client?.name ?? 'Client';
    const locationLabel = [item.location?.area, item.location?.city]
      .filter(Boolean).join(', ');

    return (
      <motion.div initial="hidden" animate="visible" variants={fadeIn} whileHover={{ scale: 1.01 }}>
        <Card className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{item.title}</h3>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <User className="w-4 h-4" />
                <span>{clientName}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">GH₵{item.price}</div>
              {item.rating && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm text-primary font-semibold">{item.rating}.0</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{item.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{item.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{locationLabel}</span>
            </div>
            {item.paymentData?.paymentMethod && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="capitalize">{item.paymentData.paymentMethod.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-[#1e293b]">
            {/* [MOCK] booking detail data comes from parent list; in prod parent fetches GET /bookings/:id */}
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedBooking(item)}>
              <Eye className="w-4 h-4" />
              View Details
            </Button>
            {item.status === 'completed' && (
              // [API] GET /bookings/:id/receipt — returns receipt data; use ?format=pdf for PDF blob download
              <Button size="sm" variant="outline" className="flex-1" onClick={() => { setReceiptBooking(item); setShowReceipt(true); }}>
                <FileText className="w-4 h-4" />
                View Receipt
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  const viewToggle = (
    <div className="flex gap-2">
      <button
        onClick={() => setViewMode('list')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#1e293b]'}`}
      >
        <FileText className="w-5 h-5" />
      </button>
      <button
        onClick={() => setViewMode('stats')}
        aria-label="Stats view"
        aria-pressed={viewMode === 'stats'}
        className={`p-2 rounded-lg transition-colors ${viewMode === 'stats' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#1e293b]'}`}
      >
        <BarChart3 className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <PageHeader
        title="History"
        subtitle="View your past jobs and earnings"
        onBack={handleBackClick}
        rightContent={viewToggle}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period filter — [API] pass selected period as ?period= query param to /bookings endpoint */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            <span className="font-semibold text-gray-900 dark:text-slate-100">Filter by period:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {PERIODS.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedPeriod === period.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white dark:bg-[#1a1f2e] text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] border-2 border-gray-200 dark:border-[#1e293b]'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats view — [MOCK] calculated client-side; replace with /bookings/stats?userId={id}&period={n} */}
        {viewMode === 'stats' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalJobs}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Total Jobs</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.completedJobs}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Completed</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-error mb-2">{stats.cancelledJobs}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Cancelled</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.avgRating}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Avg Rating</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.completionRate}%</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Success Rate</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">GH₵{stats.totalEarnings}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Total Earned</div>
            </Card>
          </motion.div>
        )}

        {/* [MOCK] History list from filteredHistory — replace with paginated GET /bookings?userId={id}&status=completed,cancelled */}
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>

        {/* [API] GET /bookings/export?userId={id}&status=completed,cancelled&format=csv — triggers file download */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-8 text-center">
          <Button variant="outline" size="lg">
            <Download className="w-5 h-5" />
            Export History Report
          </Button>
        </motion.div>
      </div>

      {/* [MOCK] BookingDetailsModal data prop comes from list item; in prod parent fetches GET /bookings/:id */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          userType="provider"
          onAccept={() => {}}
          onDecline={() => {}}
          onMarkComplete={() => {}}
        />
      )}

      {/* [API] ReceiptModal data — replace with GET /bookings/:id/receipt; use ?format=pdf for PDF blob */}
      {showReceipt && (
        <ReceiptModal
          booking={receiptBooking}
          onClose={() => setShowReceipt(false)}
          userType="provider"
        />
      )}
    </div>
  );
};

export default ProviderHistory;
