import React, { memo, lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import requestLight from '../../assets/workflow-illustrations/request-light.webp';
import requestDark from '../../assets/workflow-illustrations/request-dark.webp';
import reviewLight from '../../assets/workflow-illustrations/review-light.webp';
import reviewDark from '../../assets/workflow-illustrations/review-dark.webp';
import assessmentLight from '../../assets/workflow-illustrations/assessment-light.webp';
import assessmentDark from '../../assets/workflow-illustrations/assessment-dark.webp';
import assignmentLight from '../../assets/workflow-illustrations/assignment-light.webp';
import assignmentDark from '../../assets/workflow-illustrations/assignment-dark.webp';
import workAndBillLight from '../../assets/workflow-illustrations/work-and-bill-light.webp';
import workAndBillDark from '../../assets/workflow-illustrations/work-and-bill-dark.webp';
import paymentLight from '../../assets/workflow-illustrations/payment-light.webp';
import paymentDark from '../../assets/workflow-illustrations/payment-dark.webp';

// Lazy load heavy components
const Carousel = lazy(() => import('../catalog/ServiceCategoryCarousel.jsx'));

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

// Memoized Icon Wrapper Component
const IconWrapper = memo(({ children }) => (
  <motion.div 
    className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-600 rounded-full p-1"
    whileHover={{ rotate: 360, scale: 1.1 }}
    transition={{ duration: 0.6 }}
  >
    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
      <div className="bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-600 p-2 rounded-full">
        {children}
      </div>
    </div>
  </motion.div>
));

// Memoized Feature Card Component
const FeatureCard = memo(({ icon: Icon, title, description, index }) => (
  <motion.div
    className="flex flex-col rounded-3xl w-full bg-white dark:bg-[#1a1f2e] ring-1 ring-black/5 dark:ring-white/10 shadow-md hover:shadow-lg transition-shadow duration-200"
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    whileHover={{ y: -10 }}
  >
    <div className="flex flex-col flex-1 gap-2 p-6 items-center text-center">
      <IconWrapper>
        <Icon size={32} className="text-white" strokeWidth={2} />
      </IconWrapper>
      <h2 className="text-xl font-semibold text-black dark:text-slate-100 mt-4">{title}</h2>
      <p className="text-gray-600 dark:text-slate-400">{description}</p>
    </div>
  </motion.div>
));

// Memoized Platform Feature Card
const PlatformFeatureCard = memo(({ title, description, index }) => (
  <motion.div 
    className="flex flex-col w-full bg-white dark:bg-[#1a1f2e] ring-1 ring-black/5 dark:ring-white/10 shadow-sm rounded-3xl hover:shadow-md transition-shadow"
    variants={scaleIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, delay: index * 0.08 }}
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex flex-col flex-1 gap-2 p-6">
      <h2 className="font-semibold text-xl text-black dark:text-slate-100 mb-2 pb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-slate-400">{description}</p>
    </div>
  </motion.div>
));

// Memoized How It Works Step
const HowItWorksStep = memo(({ step, index }) => (
  <motion.div 
    className="flex flex-col items-center justify-start text-center h-full"
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
  >
    <motion.div
      className="mt-2 aspect-[3/2] w-full flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 transition-all duration-300 dark:bg-[#1a1f2e]"
      whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
      transition={{ duration: 0.3 }}
    >
      <img src={step.lightImage} alt={step.imageAlt} className="block h-full w-full object-contain dark:hidden" loading="lazy" />
      <img src={step.darkImage} alt="" aria-hidden="true" className="hidden h-full w-full object-contain dark:block" loading="lazy" />
    </motion.div>
    <motion.div 
      className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-500 text-white font-bold text-2xl mt-4 flex-shrink-0"
      initial={{ scale: 0, rotate: -180 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 + 0.2, type: "spring" }}
    >
      {step.num}
    </motion.div>
    <h2 className="text-lg font-semibold text-black dark:text-slate-100 mt-2 min-h-[28px]">
      {step.title}
    </h2>
    <p className="text-gray-600 dark:text-slate-400 max-w-xs m-1 flex-grow">
      {step.description}
    </p>
  </motion.div>
));

// Memoized FAQ Item
const FAQItem = memo(({ index, question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      className="bg-white dark:bg-[#1a1f2e] border-b-2 rounded-none border-gray-100 dark:border-[#1e293b]"
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-4 font-semibold text-black dark:text-slate-100 text-left hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-slate-400 text-left">
          {answer}
        </div>
      )}
    </motion.div>
  );
});

// Memoized Section Header
const SectionHeader = memo(({ title, description }) => (
  <motion.div 
    className="items-center text-center my-8 px-2 py-6 bg-white dark:bg-[#0f1117]"
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <h1 className="text-black dark:text-slate-100 font-semibold text-3xl">{title}</h1>
    {description && (
      <p className="text-gray-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto">{description}</p>
    )}
  </motion.div>
));

// Constants
const FEATURE_CARDS_DATA = [
  {
    id: 1,
    icon: Shield,
    title: "Secure & Trusted",
    description: "LUCID reviews requests and coordinates the people involved in delivering the service."
  },
  {
    id: 2,
    icon: Clock,
    title: "Quick Response",
    description: "LUCID checks location, service fit, availability, and capacity when coordinating assignments."
  },
  {
    id: 3,
    icon: CheckCircle2,
    title: "Clear payment decisions",
    description: "Review the Provider final bill before paying. A service review is optional after completion."
  }
];

const PLATFORM_FEATURES_DATA = [
  {
    id: 1,
    title: "Managed request coordination",
    description: "Submit your request once. LUCID reviews the details, clarifies anything by in-app message, and coordinates the next steps for you."
  },
  {
    id: 2,
    title: "Inspector assessment when needed",
    description: "An Inspector may assess the site before a Provider is assigned. If none is available, you can agree to proceed without one; no extra Client setup is needed."
  },
  {
    id: 3,
    title: "A Provider can start without an estimate",
    description: "After accepting an assignment, the Provider can begin the agreed work without a pre-work quote. Any added work and its cost need your approval before it starts."
  },
  {
    id: 4,
    title: "The Provider sends the final bill",
    description: "After the work is complete, review the Provider's bill and accept and pay through LUCID, or reject it with an optional note so the Provider can revise it."
  },
  {
    id: 5,
    title: "Communication stays coordinated",
    description: "Message LUCID staff and your assigned Inspector when involved. Provider profiles and direct contact details are not shown to Clients."
  },
  {
    id: 6,
    title: "Updates, records, and optional reviews",
    description: "Follow request updates and keep the service history together. Payment confirms completion, and leaving a review afterward is optional."
  }
];

const STEPS_DATA = [
  {
    id: 1,
    num: "1",
    title: "Browse & request",
    description: "Choose a service and share the work details and location. A budget range is optional and non-binding; you do not enter payment details here.",
    lightImage: requestLight,
    darkImage: requestDark,
    imageAlt: "Client browsing services and submitting a request on a phone",
  },
  {
    id: 2,
    num: "2",
    title: "We review the request",
    description: "LUCID's Admin team reviews the request and messages you in the app if details need clarifying.",
    lightImage: reviewLight,
    darkImage: reviewDark,
    imageAlt: "LUCID staff reviewing a request and clarifying details with a client",
  },
  {
    id: 3,
    num: "3",
    title: "Site assessment",
    description: "LUCID assigns a suitable Inspector when available. If none can be assigned, you can agree once to proceed without one.",
    lightImage: assessmentLight,
    darkImage: assessmentDark,
    imageAlt: "Inspector assessing a service site and recording observations",
  },
  {
    id: 4,
    num: "4",
    title: "Provider assignment",
    description: "Admin assigns a Provider, who must accept before starting. Without an Inspector, the Provider assesses the site and starts without another Client form. Clients do not choose or contact Providers directly.",
    lightImage: assignmentLight,
    darkImage: assignmentDark,
    imageAlt: "LUCID coordinator assigning a work order to a service provider",
  },
  {
    id: 5,
    num: "5",
    title: "Work & final bill",
    description: "The Provider completes the agreed work and sends the final bill. If added work is needed, you approve its scope and cost before it begins.",
    lightImage: workAndBillLight,
    darkImage: workAndBillDark,
    imageAlt: "Provider completing repair work and preparing a final bill",
  },
  {
    id: 6,
    num: "6",
    title: "Review the bill & pay",
    description: "Accept and pay through LUCID, or reject the bill with an optional note for revision. Payment completes the request and makes your receipt available. Leaving a review is optional.",
    lightImage: paymentLight,
    darkImage: paymentDark,
    imageAlt: "Client reviewing a bill, making payment, and optionally leaving a review",
  },
];

const FAQ_DATA = [
  { id: 0, question: "Which services can I request?", answer: "LUCID currently covers plumbing, electrical work, auto mechanic services, cleaning, carpentry, construction work, and handyman services." },
  { id: 1, question: "Can I choose or contact a Provider directly?", answer: "No. LUCID reviews your request and coordinates assignment. Provider identity and direct contact details remain private to Clients." },
  { id: 2, question: "Do I need to enter payment details with my request?", answer: "No. Request submission does not collect payment details. If a Provider submits a final bill, you review it and continue to the available checkout options." },
  { id: 3, question: "Can the Provider charge more if extra work is needed?", answer: "Any added work and its cost should be shown to you for approval before that extra work starts." },
  { id: 4, question: "Do I have to leave a review?", answer: "No. Leaving a review after the service is complete is optional." },
];

const Section1 = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f1117]">
      {/* Top 3 Feature Cards */}
      <motion.div 
        className="max-w-[1240px] mx-auto grid md:grid-cols-3 gap-8 mt-16 px-6 mb-6 py-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {FEATURE_CARDS_DATA.map((card, index) => (
          <FeatureCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={card.description}
            index={index}
          />
        ))}
      </motion.div>

      {/* Platform Features Section */}
      <motion.div 
        className="items-center text-center my-4 px-2 py-6 bg-white dark:bg-[#0f1117]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="my-2 px-2 py-2 bg-white dark:bg-[#0f1117]">
          <motion.h1
            className="text-black dark:text-slate-100 font-semibold text-3xl"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Platform Features
          </motion.h1>
          <motion.p
            className="text-gray-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Managed requests, clear decisions, and service records in one place.
          </motion.p>
        </div>
      </motion.div>

      {/* Platform Feature Cards Grid */}
      <motion.div 
        className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-8 px-6 mb-16 pb-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {PLATFORM_FEATURES_DATA.map((feature, index) => (
          <PlatformFeatureCard
            key={feature.id}
            title={feature.title}
            description={feature.description}
            index={index}
          />
        ))}
      </motion.div>

      {/* How It Works Section */}
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f1117]">
        <SectionHeader title="How your request works" description="Six stages from the first request to payment and completion." />

        <motion.div 
          className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 px-6 mb-6 pb-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {STEPS_DATA.map((step, index) => (
            <HowItWorksStep key={step.id} step={step} index={index} />
          ))}
        </motion.div>
      </div>

      {/* Carousel Section - Lazy Loaded */}
      <Suspense fallback={
        <motion.div
          className="min-h-[700px] md:min-h-[560px] bg-gray-200 animate-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      }>
        <Carousel />
      </Suspense>

      {/* FAQ Section */}
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f1117]">
        <motion.div
          className="items-center text-center my-8 px-2 py-6 bg-white dark:bg-[#0f1117]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="my-4 px-2 py-6 bg-white dark:bg-[#0f1117]">
            <motion.h1
              className="text-black dark:text-slate-100 font-semibold text-3xl"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              className="text-gray-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Find answers to common questions about our platform
            </motion.p>
          </div>

          {/* FAQ Items */}
          <motion.div 
            className="items-center text-center m-8 px-2 py-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {FAQ_DATA.map((faq) => (
              <FAQItem
                key={faq.id}
                index={faq.id}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Section1;
