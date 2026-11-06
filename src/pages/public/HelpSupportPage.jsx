import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigateBack } from '../../hooks/useNavigateBack.js';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { 
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Search,
  Send,
  FileText,
  BookOpen,
  Video,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const HelpSupport = () => {
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const handleBackClick = useNavigateBack('/lucid/', 600);

  // FAQ copy is currently maintained in the frontend.
  //   GET /faqs/categories → [{ id, name }]
  //   GET /faqs?categoryId={id} → [{ id, question, answer, category }]
  // FAQ search below is client-side; for large sets use: GET /faqs/search?q={query}
  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen },
    { id: 'bookings', name: 'Bookings', icon: FileText },
    { id: 'payments', name: 'Payments', icon: AlertCircle },
    { id: 'account', name: 'Account', icon: Users },
    { id: 'technical', name: 'Technical', icon: HelpCircle }
  ];

  const faqs = [
    { category: 'getting-started', question: 'Which services can I request?', answer: 'LUCID currently covers plumbing, electrical work, auto mechanic services, cleaning, carpentry, construction work, and handyman services.' },
    { category: 'getting-started', question: 'Can I request a service as a Provider or Inspector?', answer: 'Provider and Inspector accounts can browse public services, but service requests require a Client account.' },
    { category: 'bookings', question: 'How does a service request work?', answer: 'LUCID reviews the request, clarifies details with you when needed, and coordinates an Inspector and Provider assignment. If no Inspector is available, you may agree once to proceed without one.' },
    { category: 'bookings', question: 'Can I choose or contact a Provider directly?', answer: 'No. LUCID coordinates the assignment. Provider profiles and direct contact details are not shown to Clients.' },
    { category: 'bookings', question: 'Do I have to agree to proceed without an Inspector?', answer: 'No. If LUCID cannot assign a suitable Inspector, you can choose whether to continue. If you agree, no additional Client setup form is required.' },
    { category: 'payments', question: 'Do I enter payment details when I submit a request?', answer: 'No. Payment details are not collected on the request form. If a Provider sends a final bill, you review it and use the secure checkout options available.' },
    { category: 'payments', question: 'Can I question or reject a bill?', answer: 'Yes. You can accept and pay, or reject the bill with an optional note so the Provider can discuss or revise it.' },
    { category: 'payments', question: 'Do I have to leave a review?', answer: 'No. A review after service completion is optional.' },
    { category: 'account', question: 'Are credentials required to create a Provider or Inspector account?', answer: 'No. Relevant credentials are optional. If evidence is submitted, it remains unverified until authorized LUCID staff review it.' },
    { category: 'account', question: 'Can Clients view Provider profile details?', answer: 'Clients cannot browse Provider profiles or see direct contact details. After assignment, the case may show a relevant credential title and LUCID verification badge if one has been verified.' },
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // [API] POST /support/tickets
    //   Body: { subject, category, message, userId: currentUser.id }
    //   → { ticketId: string, estimatedResponseTime: '24 hours' }
    // Replace the setTimeout below with a real API call.
    // Backend should also send a confirmation email to the user and alert the support team.
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    showNotification('Your message has been sent! We\'ll respond within 24 hours.', 'success');
    setContactForm({ subject: '', category: 'general', message: '' });
  };

  const FAQItem = ({ faq, index }) => {
    const isExpanded = expandedFaq === index;

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="border-b border-gray-200 dark:border-[#1e293b] last:border-0"
      >
        <button
          onClick={() => setExpandedFaq(isExpanded ? null : index)}
          className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors px-4 rounded-lg"
        >
          <span className="font-semibold text-gray-900 dark:text-slate-200 pr-4">{faq.question}</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-slate-400 flex-shrink-0" />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-gray-600 dark:text-slate-400 pb-4 px-4">{faq.answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] shadow-sm dark:border-b dark:border-[#1e293b] sticky top-0 z-30"
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Help & Support</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">Find answers and get assistance</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Contact Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          {/* [WS] Live Chat: integrate a WebSocket-based chat or a third-party widget
               (Crisp, Intercom, Tawk.to). The "Start Chat" button should open the widget
               or navigate to /support-chat?userId={id} for an in-app chat room. */}
          <Card hoverable className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Live Chat</h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">Get instant help from our support team</p>
            <Button variant="outline" size="sm" fullWidth>Start Chat</Button>
          </Card>

          <Card hoverable className="text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Call Us</h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">Mon-Fri: 8am - 6pm</p>
            <Button variant="outline" size="sm" fullWidth>+233 30 123 4567</Button>
          </Card>

          <Card hoverable className="text-center">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Email</h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">We'll respond within 24 hours</p>
            <Button variant="outline" size="sm" fullWidth>support@lucid.com</Button>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQs Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Frequently Asked Questions</h2>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#252b3b] dark:text-slate-200 dark:placeholder-slate-500 pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      className="px-4 py-2 bg-gray-100 dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* FAQ List */}
              <div>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => (
                    <FAQItem key={index} faq={faq} index={index} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-400">No FAQs found matching your search.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Resources */}
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-left">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">User Guide</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Complete platform guide</p>
                  </div>
                </button>

                <button className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#252b3b] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Video className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Video Tutorials</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Learn through videos</p>
                  </div>
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Contact Support</h2>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  required
                />

                <div className="flex flex-col gap-2">
                  <label htmlFor="support-category" className="font-medium text-gray-700 dark:text-slate-300">Category</label>
                  <select
                    id="support-category"
                    value={contactForm.category}
                    onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-[#252b3b] text-gray-700 dark:text-slate-200 border-gray-300 dark:border-[#2d3748] focus:border-blue-600 focus:outline-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="account">Account Issue</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-gray-700 dark:text-slate-300">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    rows="6"
                    className="w-full px-4 py-3 border-2 rounded-lg text-gray-700 dark:text-slate-200 bg-white dark:bg-[#252b3b] border-gray-300 dark:border-[#2d3748] focus:border-blue-600 focus:outline-none dark:placeholder-slate-500"
                    placeholder="Describe your issue in detail..."
                    required
                  />
                </div>

                <Button type="submit" loading={loading} fullWidth>
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </Card>

            {/* Status Banner */}
            {/* [API] GET /system/status → { status: 'operational'|'degraded'|'outage', message, avgResponseTime }
                 Poll every 60s or subscribe to a status page (e.g. statuspage.io). Currently hardcoded. */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700/40 mt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">All Systems Operational</h3>
                  <p className="text-sm text-green-800 dark:text-green-400">
                    All services are running smoothly. Average response time: 2 hours.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
