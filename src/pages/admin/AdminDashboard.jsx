import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, XCircle, Clock, Eye,
  Search, Shield, AlertCircle, LogOut,
  Star, Phone, Mail, MapPin, Briefcase, Award, Languages,
  DollarSign, Calendar, TrendingUp, MessageCircle, Image as ImageIcon,
  FileText, ExternalLink, Download, RefreshCw, Building2, CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNotification } from '../../contexts/NotificationContext';

// ============================================================
// Animation variants
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

// ============================================================
// Status Badge
// ============================================================
const StatusBadge = ({ status }) => {
  const config = {
    pending:  { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock,        label: 'Pending'  },
    approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',   icon: CheckCircle,  label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',           icon: XCircle,      label: 'Rejected' },
    revise:   { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: AlertCircle, label: 'Revise'   }
  };
  const { color, icon: Icon, label } = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// ============================================================
// Avatar helper (shows image or initial)
// ============================================================
const AvatarDisplay = ({ src, name, size = 48, className = '' }) => {
  const initial = (name || 'U').charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
};

// ============================================================
// Provider Card
// ============================================================
const ProviderCard = ({ provider, onView }) => {
  const fullName =
    [provider.first_name, provider.last_name].filter(Boolean).join(' ') || 'Unnamed';
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AvatarDisplay src={provider.avatar_url} name={fullName} size={48} />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">{fullName}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {provider.occupation || 'No occupation'}
              </p>
            </div>
          </div>
          <StatusBadge status={provider.verification_status || 'pending'} />
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
            <MapPin size={14} />
            <span>{provider.location || 'Location not set'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
            <Briefcase size={14} />
            <span>{provider.work_experience || 0} years experience</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
            <Users size={14} />
            <span>{provider.employees || 1} employees</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {(provider.categories || []).slice(0, 3).map((cat, i) => (
            <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-xs">
              {cat}
            </span>
          ))}
        </div>

        <button
          onClick={() => onView(provider)}
          className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          <Eye size={14} />
          View Details
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================
// Image Grid (for portfolio, verification docs)
// ============================================================
const ImageGrid = ({ urls, emptyText = 'None uploaded' }) => {
  if (!urls || urls.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-500 italic">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-[#2d3748] aspect-square"
        >
          <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <ExternalLink size={20} className="text-white" />
          </div>
        </a>
      ))}
    </div>
  );
};

// ============================================================
// Provider Detail Modal (the big one)
// ============================================================
const ProviderDetailModal = ({
  provider,
  details,           // from service_provider_details
  perf,              // from provider_performance
  bookingStats,
  onClose,
  onVerify,
  onReject,
  onRequestRevision,
}) => {
  const [notes, setNotes] = useState(provider.verification_notes || '');
  const [activeSection, setActiveSection] = useState('overview');

  const fullName =
    [provider.first_name, provider.last_name].filter(Boolean).join(' ') || 'Unnamed';

  const sections = [
    { id: 'overview',      label: 'Overview',     icon: Briefcase },
    { id: 'portfolio',     label: 'Portfolio',    icon: ImageIcon },
    { id: 'verification',  label: 'Verification', icon: FileText },
    { id: 'business',      label: 'Business',     icon: Building2 },
    { id: 'performance',   label: 'Performance',  icon: TrendingUp },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#1a1f2e] rounded-xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* ── Header ── */}
        <div className="bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-[#1e293b] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Provider Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">

            {/* Hero banner + avatar */}
            <div className="relative rounded-xl overflow-hidden mb-6">
              {provider.hero_url ? (
                <img
                  src={provider.hero_url}
                  alt="Banner"
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-blue-400" />
              )}
              <div className="absolute -bottom-8 left-6">
                <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1a1f2e] overflow-hidden bg-gray-200 dark:bg-[#252b3b] shadow-lg">
                  <AvatarDisplay src={provider.avatar_url} name={fullName} size={80} className="!rounded-full" />
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <StatusBadge status={provider.verification_status || 'pending'} />
              </div>
            </div>

            {/* Name + basic info */}
            <div className="mt-10 mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{fullName}</h3>
              <p className="text-gray-500 dark:text-slate-400">{provider.occupation || 'Occupation not set'}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                {provider.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-slate-400">
                    <MapPin size={14} />
                    <span>{provider.location}</span>
                  </div>
                )}
                {details?.years_of_experience != null && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-slate-400">
                    <Briefcase size={14} />
                    <span>{details.years_of_experience} yrs</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Section tabs ── */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-[#1e293b] mb-6 overflow-x-auto">
              {sections.map(s => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                      active
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon size={14} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* ── Section: OVERVIEW ── */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-slate-400 text-sm whitespace-pre-wrap">
                    {provider.description || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {(provider.categories || []).length === 0 && (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                      {(provider.categories || []).map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(provider.skills || []).length === 0 && (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                      {(provider.skills || []).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-[#252b3b] text-gray-600 dark:text-slate-300 rounded-lg text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                      <Award size={16} className="text-green-500" /> Certifications
                    </h4>
                    <ul className="space-y-1">
                      {(provider.certifications || []).length === 0 && (
                        <li className="text-xs text-gray-400 italic">None</li>
                      )}
                      {(provider.certifications || []).map((c, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-slate-400">{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                      <Languages size={16} className="text-blue-500" /> Languages
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(provider.languages || []).length === 0 && (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                      {(provider.languages || []).map((l, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-[#252b3b] text-gray-600 dark:text-slate-300 rounded-lg text-xs">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Payment Methods</h4>
                  <div className="flex flex-wrap gap-2">
                    {(provider.payment_methods || []).length === 0 && (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                    {(provider.payment_methods || []).map((m, i) => (
                      <span key={i} className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg text-xs">
                        {m === 'mobile' ? 'Mobile Money' : m === 'bank' ? 'Bank Transfer' : m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Section: PORTFOLIO ── */}
            {activeSection === 'portfolio' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">
                    Portfolio Projects ({provider.portfolio_urls?.length || 0})
                  </h4>
                  <ImageGrid urls={provider.portfolio_urls} emptyText="No portfolio images uploaded" />
                </div>
              </div>
            )}

            {/* ── Section: VERIFICATION ── */}
            {activeSection === 'verification' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Verification Status</div>
                    <StatusBadge status={provider.verification_status || 'pending'} />
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Verified At</div>
                    <div className="text-sm text-gray-900 dark:text-slate-100">
                      {provider.verified_at ? new Date(provider.verified_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>

                {provider.verification_notes && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold mb-1">
                      Previous Admin Notes
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {provider.verification_notes}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">
                    Verification Documents ({details?.verification_documents?.length || 0})
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                    These are private documents uploaded by the provider for identity/business verification.
                  </p>
                  <ImageGrid
                    urls={details?.verification_documents}
                    emptyText="No verification documents uploaded"
                  />
                </div>
              </div>
            )}

            {/* ── Section: BUSINESS ── */}
            {activeSection === 'business' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Company Name</div>
                    <div className="text-sm text-gray-900 dark:text-slate-100">
                      {details?.company_name || '—'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Business Registration No.</div>
                    <div className="text-sm text-gray-900 dark:text-slate-100">
                      {details?.business_registration_number || '—'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Hourly Rate</div>
                    <div className="text-sm text-gray-900 dark:text-slate-100">
                      {details?.hourly_rate ? `GH₵ ${details.hourly_rate}` : '—'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Max Distance</div>
                    <div className="text-sm text-gray-900 dark:text-slate-100">
                      {details?.max_distance_km != null ? `${details.max_distance_km} km` : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <CreditCard size={16} /> Bank Account (private)
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Account Name</span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium">
                        {details?.bank_account_name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Account Number</span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium font-mono">
                        {details?.bank_account_number || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Bank</span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium">
                        {details?.bank_name || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Section: PERFORMANCE ── */}
            {activeSection === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{bookingStats?.total ?? 0}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Total Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{bookingStats?.completed ?? 0}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {perf?.rating_average?.toFixed?.(1) ?? '—'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      GH₵{bookingStats?.earnings?.toLocaleString?.() ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Total Earnings</div>
                  </div>
                </div>

                {perf && (
                  <div className="p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Provider Performance</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Total Reviews</span>
                        <span className="text-gray-900 dark:text-slate-100">{perf.total_reviews ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Jobs Completed</span>
                        <span className="text-gray-900 dark:text-slate-100">{perf.total_completed_jobs ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Avg Completion</span>
                        <span className="text-gray-900 dark:text-slate-100">
                          {perf.avg_completion_hours != null ? `${perf.avg_completion_hours}h` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Admin notes ── */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#1e293b]">
              <label className="font-semibold text-gray-900 dark:text-slate-100 mb-2 block">
                Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for the provider (reason for rejection, revision requests, etc.)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d3748] rounded-lg text-sm bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty to use default message</p>
            </div>
          </div>
        </div>

        {/* ── Sticky action footer ── */}
        <div className="border-t border-gray-200 dark:border-[#1e293b] bg-white dark:bg-[#1a1f2e] p-4 flex gap-3 flex-shrink-0">
          {provider.verification_status !== 'approved' && (
            <button
              onClick={() => onVerify(provider, notes)}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Approve
            </button>
          )}
          {provider.verification_status !== 'rejected' && (
            <button
              onClick={() => onReject(provider, notes)}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={18} /> Reject
            </button>
          )}
          <button
            onClick={() => onRequestRevision(provider, notes)}
            className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            <AlertCircle size={18} /> Request Revision
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================
// Stats Card
// ============================================================
const StatsCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue:   'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300',
    green:  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
    red:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
  };
  return (
    <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Admin Dashboard
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedPerf, setSelectedPerf] = useState(null);
  const [selectedBookingStats, setSelectedBookingStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // ----------------------------------------------------------
  // Admin check
  // ----------------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/lucid/signin'); return; }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        showNotification('Access denied. Admin privileges required.', 'error');
        navigate('/lucid/');
        return;
      }

      setIsAdmin(true);
      await fetchProviders();
      setCheckingAdmin(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------
  // Fetch providers (joined with details for the modal)
  // ----------------------------------------------------------
  const fetchProviders = async () => {
    try {
      setLoading(true);

      const { data: providerData, error } = await supabase
        .from('provider_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Optional: enrich with details so cards can show avatars immediately
      setProviders(providerData || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      showNotification('Failed to load providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Filters / stats
  // ----------------------------------------------------------
  useEffect(() => {
    let filtered = [...providers];

    if (activeTab !== 'all') {
      if (activeTab === 'pending') {
        filtered = filtered.filter(p =>
          p.verification_status === 'pending' ||
          (!p.verification_status && p.is_profile_complete === true)
        );
      } else {
        filtered = filtered.filter(p => p.verification_status === activeTab);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q) ||
        (p.occupation || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.categories || []).some(c => c.toLowerCase().includes(q))
      );
    }

    setFilteredProviders(filtered);

    const pendingCount = providers.filter(p =>
      p.verification_status === 'pending' ||
      (!p.verification_status && p.is_profile_complete === true)
    ).length;
    const approvedCount = providers.filter(p => p.verification_status === 'approved').length;
    const rejectedCount = providers.filter(p => p.verification_status === 'rejected').length;

    setStats({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: providers.length,
    });
  }, [providers, activeTab, searchQuery]);

  // ----------------------------------------------------------
  // Load full details when admin clicks View
  // ----------------------------------------------------------
  const handleView = async (provider) => {
    setSelectedProvider(provider);
    setSelectedDetails(null);
    setSelectedPerf(null);
    setSelectedBookingStats(null);

    try {
      const [detailsRes, perfRes, bookingsRes] = await Promise.all([
        supabase
          .from('service_provider_details')
          .select('*')
          .eq('user_id', provider.user_id)
          .maybeSingle(),

        supabase
          .from('provider_performance')
          .select('*')
          .eq('user_id', provider.user_id)
          .maybeSingle(),

        supabase
          .from('bookings')
          .select('id, status, total_amount')
          .eq('provider_id', provider.user_id),
      ]);

      if (detailsRes.error && detailsRes.error.code !== 'PGRST116') {
        console.warn('Details fetch error:', detailsRes.error);
      }
      if (perfRes.error && perfRes.error.code !== 'PGRST116') {
        console.warn('Performance fetch error:', perfRes.error);
      }

      const bookings = bookingsRes.data || [];
      setSelectedBookingStats({
        total: bookings.length,
        completed: bookings.filter(b => b.status === 'completed').length,
        earnings: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
      });

      setSelectedDetails(detailsRes.data || null);
      setSelectedPerf(perfRes.data || null);
    } catch (err) {
      console.error('Error loading provider details:', err);
      showNotification('Failed to load full provider details', 'error');
    }
  };

  // ----------------------------------------------------------
  // Status change + audit log
  // ----------------------------------------------------------
  const handleStatusChange = async (provider, status, notes) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData = {
        verification_status: status,
        verification_notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user?.id;
      }

      const { error: updateError } = await supabase
        .from('provider_profiles')
        .update(updateData)
        .eq('user_id', provider.user_id);

      if (updateError) throw updateError;

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: `provider_${status}`,
        entity_type: 'provider_profiles',
        entity_id: provider.user_id,
        new_data: { status, notes },
      });

      // Notify provider
      const messages = {
        approved: {
          title: '✅ Profile Approved!',
          message: 'Your provider profile has been approved by admin and is now visible to clients. You can now receive booking requests.',
        },
        rejected: {
          title: '❌ Profile Rejected',
          message: notes?.trim()
            ? `Your profile was rejected. Reason: ${notes.trim()}`
            : 'Your profile was rejected. Please review your information and resubmit.',
        },
        revise: {
          title: '📝 Revision Requested',
          message: notes?.trim()
            ? `Your profile needs revisions. Notes: ${notes.trim()}`
            : 'Your profile needs revisions. Please update your profile and resubmit for review.',
        },
      };

      const msg = messages[status] || {
        title: 'Profile Status Updated',
        message: `Your profile status has been updated to: ${status}`,
      };

      await supabase.from('notifications').insert({
        user_id: provider.user_id,
        type: 'verification',
        title: msg.title,
        message: msg.message,
        metadata: { provider_id: provider.user_id, status, notes },
        is_read: false,
      });

      showNotification(`✅ Provider ${status} successfully!`, 'success');
      setSelectedProvider(null);
      setSelectedDetails(null);
      setSelectedPerf(null);
      setSelectedBookingStats(null);

      setTimeout(fetchProviders, 500);
    } catch (error) {
      console.error('Status update failed:', error);
      showNotification('Failed to update provider status: ' + error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/lucid/signin');
  };

  // ----------------------------------------------------------
  // Loading / guard states
  // ----------------------------------------------------------
  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!isAdmin) return null;

  const tabs = [
    { id: 'pending',  label: 'Pending',  count: stats.pending,  icon: Clock },
    { id: 'approved', label: 'Approved', count: stats.approved, icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle },
    { id: 'all',      label: 'All',      count: stats.total,    icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1f2e] shadow-sm sticky top-0 z-30 border-b border-gray-200 dark:border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProviders}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d3748] transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Providers"  value={stats.total}    icon={Users}       color="blue" />
          <StatsCard title="Pending Approval" value={stats.pending}  icon={Clock}       color="yellow" />
          <StatsCard title="Approved"         value={stats.approved} icon={CheckCircle} color="green" />
          <StatsCard title="Rejected"         value={stats.rejected} icon={XCircle}     color="red" />
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, occupation, location, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#2d3748] rounded-lg bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-200 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-[#1a1f2e] text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#252b3b]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#1a1f2e] rounded-lg">
            <Users className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400">No providers found</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.user_id}
                provider={provider}
                onView={handleView}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <ProviderDetailModal
            provider={selectedProvider}
            details={selectedDetails}
            perf={selectedPerf}
            bookingStats={selectedBookingStats}
            onClose={() => {
              setSelectedProvider(null);
              setSelectedDetails(null);
              setSelectedPerf(null);
              setSelectedBookingStats(null);
            }}
            onVerify={(p, notes) => handleStatusChange(p, 'approved', notes)}
            onReject={(p, notes) => handleStatusChange(p, 'rejected', notes)}
            onRequestRevision={(p, notes) => handleStatusChange(p, 'revise', notes)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;