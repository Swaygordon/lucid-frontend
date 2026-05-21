import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Printer, Share2, Mail, CheckCircle,
  Calendar, Clock, MapPin, Phone, User, Star, DollarSign
} from 'lucide-react';

/**
 * Receipt Modal Component - CORRECTED VERSION
 * Platform fee is DEDUCTED from provider payment, NOT added to client payment
 */
const ReceiptModalComponent = ({ booking, onClose, userType = 'provider' }) => {
  const receiptRef = useRef();

  if (!booking) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // [DB] receiptNumber should be a persistent ID stored in the payments or receipts table.
  // Use booking.bookingReference when backend is wired; fall back to booking.id for mock data.
  const ref = booking.bookingReference || booking.id || 'N/A';
  const receiptNumber = `${ref}-RCP-${new Date().getFullYear()}`;
  
  const provider = booking.provider || {};
  const client = booking.client || {};
  const location = booking.location || {};

  // ✅ CORRECTED CALCULATION
  // Client pays the full agreed price
  const serviceCharge = booking.agreedPrice || booking.price || 0;
  
  // Platform takes 18% of the service charge
  const platformFee = (serviceCharge * 0.18).toFixed(2);
  
  // Provider receives the remaining 82%
  const providerReceives = (serviceCharge - parseFloat(platformFee)).toFixed(2);
  
  // Client's total payment (just the service charge, no additional fees)
  const totalPaid = serviceCharge.toFixed(2);

  const openReceiptWindow = (autoPrint = false) => {
    const el = receiptRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt — ${receiptNumber}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-white">${el.outerHTML}</body>
</html>`);
    win.document.close();
    if (autoPrint) {
      win.addEventListener('load', () => setTimeout(() => win.print(), 400));
    }
  };

  const handleDownload = () => openReceiptWindow(true);

  const handlePrint = () => openReceiptWindow(true);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt - ${booking.title}`,
          text: `Service receipt for ${booking.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      alert('Share feature not supported on this browser');
    }
  };

  // [API] POST /receipts/:bookingId/email — backend sends HTML email with PDF attachment.
  // mailto: cannot attach files; as a workaround we open the receipt in a new tab so
  // the user can save it as PDF, then pre-fill the mail client with instructions.
  const handleEmail = () => {
    openReceiptWindow(false); // open receipt tab for user to save as PDF
    const subject = encodeURIComponent(`Service Receipt — ${booking.title}`);
    const body = encodeURIComponent(
      `Receipt #: ${receiptNumber}\n` +
      `Service: ${booking.title}\n` +
      `Date: ${booking.date}\n` +
      `Amount Paid: GH₵${totalPaid}\n\n` +
      `To attach the receipt:\n` +
      `  1. Go to the receipt tab that just opened\n` +
      `  2. File → Print → Save as PDF\n` +
      `  3. Attach the saved file to this email\n\n` +
      `Thank you for using Lucid Services!`
    );
    setTimeout(() => window.open(`mailto:?subject=${subject}&body=${body}`), 300);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Action Bar - Hidden when printing */}
          <div className="sticky top-0 bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-[#1e293b] p-4 flex items-center justify-between z-10 print:hidden">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Service Receipt</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors" title="Download PDF">
                <Download className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <button onClick={handlePrint} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors" title="Print">
                <Printer className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <button onClick={handleShare} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors" title="Share">
                <Share2 className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <button onClick={handleEmail} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors" title="Email">
                <Mail className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-[#1e293b] mx-2" />
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div ref={receiptRef} className="p-8">
            {/* Header */}
            <div className="text-center mb-6 pb-5 border-b-2 border-gray-300 dark:border-[#1e293b]">
              <h1 className="text-2xl font-bold text-blue-600">LUCID SERVICES</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold mt-1">Professional Service Receipt</p>
            </div>

            {/* Receipt meta: 4 fields in one row */}
            <div className="grid grid-cols-4 gap-4 mb-6 text-xs">
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Receipt No.</p>
                <p className="text-gray-900 dark:text-slate-100 font-bold">{receiptNumber}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Reference</p>
                <p className="text-gray-900 dark:text-slate-100">{ref}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Issue Date</p>
                <p className="text-gray-900 dark:text-slate-100 font-bold">{formatDate(new Date())}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Status</p>
                <div className="flex items-center justify-end gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 font-bold">PAID</span>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-5 mb-6 pb-6 border-b border-gray-200 dark:border-[#1e293b]">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm">Service Provider</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <User className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{provider.name}</p>
                      <p className="text-gray-500 dark:text-slate-400">{provider.profession}</p>
                    </div>
                  </div>
                  {provider.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-blue-600 flex-shrink-0" /><p className="text-gray-700 dark:text-slate-300">{provider.phone}</p></div>}
                  {provider.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-blue-600 flex-shrink-0" /><p className="text-gray-700 dark:text-slate-300">{provider.email}</p></div>}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#252b3b] p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm">Billed To</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <User className="w-3 h-3 text-gray-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{client.name}</p>
                  </div>
                  {client.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400 dark:text-slate-500 flex-shrink-0" /><p className="text-gray-700 dark:text-slate-300">{client.phone}</p></div>}
                  {client.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400 dark:text-slate-500 flex-shrink-0" /><p className="text-gray-700 dark:text-slate-300">{client.email}</p></div>}
                  {location.address && <div className="flex items-start gap-2"><MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" /><p className="text-gray-700 dark:text-slate-300">{location.address}, {location.area}, {location.city}</p></div>}
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-[#1e293b]">
              <p className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm">Service Details</p>
              <div className="bg-gray-50 dark:bg-[#252b3b] p-4 rounded-lg">
                <div className="mb-3">
                  <p className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Service</p>
                  <p className="text-gray-900 dark:text-slate-100 font-bold">{booking.title}</p>
                </div>
                {booking.description && <p className="text-gray-600 dark:text-slate-400 text-xs mb-4">{booking.description}</p>}
                <div className="grid grid-cols-3 gap-4 text-xs pt-3 border-t border-gray-200 dark:border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <div><p className="text-gray-500 dark:text-slate-400 mb-0.5">Date</p><p className="font-semibold text-gray-900 dark:text-slate-100">{booking.date}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <div><p className="text-gray-500 dark:text-slate-400 mb-0.5">Time</p><p className="font-semibold text-gray-900 dark:text-slate-100">{booking.time}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <div><p className="text-gray-500 dark:text-slate-400 mb-0.5">Duration</p><p className="font-semibold text-gray-900 dark:text-slate-100">{booking.duration || '—'}</p></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6">
              <p className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm">Payment Details</p>
              <div className="bg-gray-50 dark:bg-[#252b3b] p-4 rounded-lg">
                <table className="w-full text-xs mb-4">
                  <tbody className="divide-y divide-gray-200 dark:divide-[#1e293b]">
                    <tr>
                      <td className="py-2.5 text-gray-700 dark:text-slate-300 font-semibold">Service Charge (Client Paid)</td>
                      <td className="py-2.5 text-right font-bold text-gray-900 dark:text-slate-100 text-sm">GH₵ {totalPaid}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-orange-700 dark:text-orange-400">
                        Platform Fee (18%) <span className="bg-orange-100 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-xs">Deducted</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-orange-700 dark:text-orange-400">− GH₵ {platformFee}</td>
                    </tr>
                    <tr className="bg-green-50 dark:bg-green-900/20">
                      <td className="py-2.5 text-green-900 dark:text-green-300 font-bold">Provider Receives (82%)</td>
                      <td className="py-2.5 text-right font-bold text-green-600 dark:text-green-400 text-sm">GH₵ {providerReceives}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-[#1e293b] text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Payment Method</p>
                    <p className="text-gray-900 dark:text-slate-100">{booking.paymentData?.paymentMethod || booking.paymentMethod || 'Mobile Money'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Payment Date</p>
                    <p className="text-gray-900 dark:text-slate-100">{booking.paymentData?.paidAt ? formatDate(booking.paymentData.paidAt) : booking.date}</p>
                  </div>
                  <div>
                    {/* [DB] transactionId from payment gateway — never generate client-side */}
                    <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">Transaction ID</p>
                    <p className="text-gray-900 dark:text-slate-100 font-mono break-all">{booking.paymentData?.transactionId || `TXN-${ref}-${new Date().getTime().toString().slice(-6)}`}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            {booking.rating && (
              <div className="mb-6 pb-5 border-b border-gray-200 dark:border-[#1e293b]">
                <p className="font-bold text-gray-900 dark:text-slate-100 mb-2 text-sm">Client Feedback</p>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < booking.rating ? 'fill-blue-600 text-blue-600' : 'text-gray-300 dark:text-slate-600'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{booking.rating}.0</span>
                  {booking.review && <span className="text-gray-600 dark:text-slate-400 italic">"{booking.review}"</span>}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {booking.additionalNotes && (
              <div className="mb-6">
                <p className="font-bold text-gray-900 dark:text-slate-100 mb-2 text-sm">Notes</p>
                <div className="bg-yellow-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-4 border-yellow-400 dark:border-amber-600">
                  <p className="text-gray-700 dark:text-slate-300 text-xs">{booking.additionalNotes}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-5 border-t-2 border-gray-300 dark:border-[#1e293b]">
              <p className="text-gray-600 dark:text-slate-400 text-xs mb-2">Thank you for using Lucid Services</p>
              <p className="text-gray-500 dark:text-slate-500 text-xs">support@lucidservices.com · <span className="font-semibold">www.lucidservices.com</span></p>
              <p className="text-gray-400 dark:text-slate-600 text-xs mt-3">Official receipt generated by Lucid Services platform</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const ReceiptModal = React.memo(ReceiptModalComponent);