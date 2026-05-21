import React, { useState, useEffect, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useFavourites } from '../contexts/FavouritesContext';
import { useNavigateBack } from '../hooks/useNavigateBack';
import { ReviewThread } from '../components/shared';

import {
  Star,
  CheckCircle,
  Users,
  User,
  Clock,
  MessageCircle,
  Phone,
  ChevronDown,
  BriefcaseBusiness,
  MapPin,
  Calendar,
  Share2,
  Heart,
  Award,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui';
import { supabase } from '../lib/supabaseClient';

const PAYMENT_LABELS = { mobile: 'Mobile Money', bank: 'Bank Transfer' };

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

// Lazy load heavy components
const ProjectCarousel = lazy(() => import("../components/project_Carousel.jsx"));
const BackToTop = lazy(() => import('../components/back_the_top_btn.jsx'));
 
// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
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
      staggerChildren: 0.1
    }
  }
};




// ============================================
// MEMOIZED COMPONENTS
// ============================================

// Hero Section
const HeroSection = memo(({ heroUrl }) => (
  <motion.div
    className="relative overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6 }}
    style={{ minHeight: 240 }}
  >
    {heroUrl ? (
      <img src={heroUrl} alt="Profile banner" className="w-full h-full object-cover" loading="lazy" style={{ minHeight: 240 }} />
    ) : (
      <div className="w-full bg-gradient-to-br from-blue-600 to-blue-400" style={{ minHeight: 240 }} />
    )}
  </motion.div>
));

// Profile Avatar
const ProfileAvatar = memo(({ avatarUrl }) => (
  <motion.div
    className="relative -top-14 left-2 transform -translate-x-1/2 z-30"
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ duration: 0.5, type: "spring" }}
  >
    <div className="w-24 h-24 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 border-blue-600 bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
      {avatarUrl ? (
        <img src={avatarUrl} alt="profile picture" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <User size={48} className="text-gray-400" />
      )}
    </div>
  </motion.div>
));

// Skill Badge
const SkillBadge = memo(({ skill, index }) => (
  <motion.span
    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.05 }}
  >
    {skill}
  </motion.span>
));

// Info Card
const InfoCard = memo(({ title, children, icon: Icon, delay = 0 }) => (
  <motion.div
    className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow p-6 hover:shadow-xl transition-shadow duration-200"
    variants={scaleIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    transition={{ delay }}
    whileHover={{ y: -5 }}
  >
    <div className="flex items-center space-x-2 mb-4">
      {Icon && <Icon className="w-5 h-5 text-blue-600" />}
      <h2 className="text-xl text-black dark:text-slate-100 font-bold">{title}</h2>
    </div>
    {children}
  </motion.div>
));

// Working Hours Display — reads the same shape the edit page saves
const DAY_LABELS = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday',
  wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
};

const WorkingHoursDisplay = memo(({ selectedDays, weekdaysTime, weekendTime, customDays }) => {
  const rows = [];

  if (selectedDays.weekdays) {
    rows.push({ label: 'Mon – Fri', start: weekdaysTime.start, end: weekdaysTime.end });
  }
  if (selectedDays.weekend) {
    rows.push({ label: 'Sat – Sun', start: weekendTime.start, end: weekendTime.end });
  }
  if (selectedDays.custom) {
    Object.entries(customDays)
      .filter(([, d]) => d.selected)
      .forEach(([day, d]) => rows.push({ label: DAY_LABELS[day], start: d.start, end: d.end }));
  }

  if (rows.length === 0) {
    return <p className="text-gray-500 dark:text-slate-500 text-sm">Not specified</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map(({ label, start, end }) => (
        <div key={label} className="flex items-center justify-between text-gray-700 dark:text-slate-300">
          <span className="font-medium">{label}</span>
          <span className="text-sm">{formatTime(start)} – {formatTime(end)}</span>
        </div>
      ))}
    </div>
  );
});

// Info Item
const InfoItem = memo(({ icon: Icon, text }) => (
  <motion.div
    className="flex items-center space-x-3"
    whileHover={{ x: 5 }}
    transition={{ duration: 0.2 }}
  >
    <Icon className="w-6 h-6 text-blue-600" />
    <span className="text-gray-700 dark:text-slate-300">{text}</span>
  </motion.div>
));

// Action Button
const ActionButton = memo(({ icon: Icon, text, onClick, variant = 'primary' }) => (
  <motion.button
    className={`py-4 rounded-lg flex items-center justify-center space-x-2 transition-colors font-semibold ${
      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-white dark:bg-[#1a1f2e] text-blue-600 border-2 border-blue-600 hover:bg-blue-50 dark:hover:bg-primary/10'
    }`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
  >
    <Icon className="w-5 h-5" />
    <span>{text}</span>
  </motion.button>
));

// Rating Bar
const RatingBar = memo(({ rating, index }) => (
  <motion.div 
    className="flex items-center space-x-3"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <span className="w-8 text-right dark:text-slate-300">{rating.stars}</span>
    <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
    <div className="flex-1 bg-gray-200 dark:bg-[#252b3b] rounded-full h-2 overflow-hidden">
      <motion.div
        className="bg-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${rating.percentage}%` }}
        transition={{ duration: 0.8, delay: index * 0.1 }}
      />
    </div>
    <span className="w-12 text-right text-sm text-gray-600 dark:text-slate-400">
      {rating.percentage}%
    </span>
  </motion.div>
));

// Review Item
const ReviewItem = memo(({ review, index }) => (
  <motion.div 
    className="border-t dark:border-[#1e293b] pt-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-gray-300 dark:bg-[#252b3b] rounded-full flex items-center justify-center">
        <User size={32} className="text-gray-400 dark:text-slate-500" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-semibold text-gray-900 dark:text-slate-100">{review.name}</div>
            <p className="text-sm text-gray-600 dark:text-slate-400">{review.jobType}</p>
          </div>
          <span className="text-sm text-gray-500 dark:text-slate-500">{review.date}</span>
        </div>
        <div className="flex space-x-1 my-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.rating
                  ? 'fill-blue-600 text-blue-600'
                  : 'text-gray-300 dark:text-slate-600'
              }`}
            />
          ))}
        </div>
        <p className="text-gray-700 dark:text-slate-300 mt-2">{review.text}</p>
      </div>
    </div>
  </motion.div>
));

const LoadingSkeleton = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
);

const GeneralProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    {/* Header */}
    <div className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Hero */}
    <div className="bg-gray-300" style={{ minHeight: 240 }} />

    {/* Profile card */}
    <div className="max-w-7xl mx-auto px-4 -mt-14">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-300 border-4 border-white mb-4" />
        <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="h-5 w-36 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-4/5 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {['w-20', 'w-24', 'w-16', 'w-28', 'w-20'].map((w, i) => (
            <div key={i} className={`h-8 ${w} bg-gray-200 rounded-lg`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-6 w-20 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>
    </div>

    {/* Main content */}
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="h-7 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-28 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2, 3].map(j => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-7 w-20 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 bg-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Portfolio carousel */}
      <div className="h-64 bg-gray-200 rounded-lg mb-8" />

      {/* Reviews accordion */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const GeneralProfile = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { id } = useParams();
  const handleBack = useNavigateBack('/lucid/services', 400);

  const [PROFILE_DATA, setPROFILE_DATA] = useState(null);
  const [RATING_DISTRIBUTION, setRATING_DISTRIBUTION] = useState([]);
  const [REVIEWS, setREVIEWS] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }

    supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setPROFILE_DATA(data);
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // [API] GET provider reviews — fill in table/column once reviews table is created
    supabase
      .from('YOUR_REVIEWS_TABLE')
      .select('*')
      .eq('YOUR_PROVIDER_ID_COLUMN', id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setREVIEWS(data);
      });
  }, [id]);

  const { isFavourite, toggleFavourite } = useFavourites();
  const isFavorite = isFavourite(PROFILE_DATA?.id);

  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [showCallModal, setShowCallModal] = useState(null);
  const [notification, setNotification] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");


const insertReply = (items, parentId, reply) => {
  return items.map(item => {
    if (item.id === parentId) {
      return { ...item, replies: [...item.replies, reply] };
    }
    if (item.replies?.length) {
      return {
        ...item,
        replies: insertReply(item.replies, parentId, reply)
      };
    }
    return item;
  });
};


const [REVIEWS, setREVIEWS] = useState([]);



// [API] POST /reviews/:reviewId/replies — {authorId, reviewText} → {id, createdAt, ...reply}
const handlePostReply = () => {
  if (!replyTarget || !replyText.trim()) return;

  const reply = {
  id: crypto.randomUUID(),
  parentId: replyTarget.id,
  author: {
    id: id ?? "PROV-101",
    name: PROFILE_DATA?.name || "Provider",
    role: "provider"
  },
  reviewText: replyText.trim(), // ✅ FIX HERE
  createdAt: new Date().toISOString(),
  replies: []
};


  setREVIEWS(prev =>
    insertReply(prev, replyTarget.id, reply)
  );

  setReplyText("");
  setReplyTarget(null);
};


  // [WS] Initiate WebRTC/WebSocket voice call session — requires signalling server handshake
  const handleCall = (type = 'voice') => {
    setShowCallModal(type);
  };

  const endCall = () => {
    showNotification('Voice call ended');
    setShowCallModal(null);
  };

  // [API] POST /bookings/request — {clientId, providerId, serviceDetails} → {bookingId, status}
  const handleRequestBooking = () => {
    navigate('/lucid/bookings/new');
  };

  // [WS] Opens real-time chat channel — requires GET /conversations/:id or POST /conversations
  const handleMessage = () => {
    showNotification('Opening chat...', 'info');
    navigate('/lucid/messages');
  };

  // [API] No endpoint needed for clipboard copy; profile URL is public
  const handleShare = () => {
    showNotification('Profile link copied to clipboard!');
  };

  // [API] POST /users/:id/favourites — {providerId} → {saved: true} / DELETE for removal
  const toggleFavorite = () => {
    toggleFavourite({
      id: PROFILE_DATA.id,
      name: PROFILE_DATA.name,
      role: PROFILE_DATA.occupation,
      location: PROFILE_DATA.location,
      rating: PROFILE_DATA.rating?.overall ?? 0,
      image: PROFILE_DATA.profileImage ?? null,
    });
    showNotification(isFavorite ? 'Removed from favourites' : 'Added to favourites');
  };

  if (isLoading) return <GeneralProfileSkeleton />;

  if (!PROFILE_DATA) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex flex-col items-center justify-center gap-4">
      <button onClick={handleBack} className="self-start ml-8 p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
      </button>
      <p className="text-lg text-gray-500 dark:text-slate-400">Provider profile not available.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header with Back Button and Actions */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] shadow-sm sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <button
                onClick={toggleFavorite}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-slate-300'}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <HeroSection heroUrl={PROFILE_DATA.heroUrl} />

      {/* Profile Card */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 -mt-14">
        <motion.div 
          className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-lg p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Profile Avatar */}
          <ProfileAvatar avatarUrl={PROFILE_DATA.avatarUrl} />

          {/* Profile Info */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {PROFILE_DATA.name}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
                          <BriefcaseBusiness className="mb-2 w-6 h-6 text-blue-600" />
                        <span className="text-lg text-gray-700 dark:text-slate-300 mb-3">{PROFILE_DATA.occupation}</span>
                        </div>

           <div className="flex items-center space-x-4 mb-4 flex-wrap gap-2">
                         <div className="flex items-center space-x-1">
                           <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
                           <span className="font-semibold text-blue-600">{PROFILE_DATA.rating}</span>
                           <span className="text-gray-500 dark:text-slate-500 text-sm">({PROFILE_DATA.reviewCount} reviews)</span>
                         </div>
                         <div className="flex items-center space-x-2 text-gray-600 dark:text-slate-400">
                           <MapPin className="w-4 h-4 text-blue-600" />
                           <span>{PROFILE_DATA.location}</span>
                         </div>
                       </div>

            <p className="text-gray-700 dark:text-slate-300 mb-4">{PROFILE_DATA.description}</p>

            <div className="flex flex-wrap gap-3 mb-4">
              {PROFILE_DATA.skills.map((skill, index) => (
                <SkillBadge key={index} skill={skill} index={index} />
              ))}
            </div>

            {PROFILE_DATA.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {PROFILE_DATA.categories.map((cat, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-[#252b3b] text-gray-600 dark:text-slate-400 rounded-full text-sm font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <InfoCard title="" delay={0}>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{PROFILE_DATA.hiredCount}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Jobs Completed</div>
            </div>
          </InfoCard>
          <InfoCard title="" delay={0.1}>
            <div className="text-center">
              <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{PROFILE_DATA.rating}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Average Rating</div>
            </div>
          </InfoCard>
          <InfoCard title="" delay={0.2}>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">98%</div>{/* [DB] Computed from bookings table; consider caching */}
              <div className="text-sm text-gray-600 dark:text-slate-400">Success Rate</div>
            </div>
          </InfoCard>
        </motion.div>

        {/* Info Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Overview */}
          <InfoCard title="Overview" icon={Users}>
            <div className="space-y-4">
              <InfoItem icon={Users} text={`Hired ${PROFILE_DATA.hiredCount} Times`} />
              <InfoItem icon={CheckCircle} text="User has been verified" />
              <InfoItem icon={Users} text={`${PROFILE_DATA.employees} employees`} />
              <InfoItem icon={Clock} text={`${PROFILE_DATA.workExperience} years experience`} />
            </div>
          </InfoCard>

          {/* Payment Methods */}
          <InfoCard title="Payment Methods" delay={0.1}>
            <div className="space-y-1">
              {PROFILE_DATA.paymentMethods.map((m, i) => (
                <p key={i} className="text-gray-700 dark:text-slate-300">{PAYMENT_LABELS[m] || m}</p>
              ))}
            </div>
          </InfoCard>

          {/* Working Hours */}
          <InfoCard title="Working Hours" icon={Clock} delay={0.2}>
            <WorkingHoursDisplay
              selectedDays={PROFILE_DATA.selectedDays}
              weekdaysTime={PROFILE_DATA.weekdaysTime}
              weekendTime={PROFILE_DATA.weekendTime}
              customDays={PROFILE_DATA.customDays}
            />
          </InfoCard>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <InfoCard title="Certifications">
            <div className="space-y-2">
              {PROFILE_DATA.certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </InfoCard>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <InfoCard title="Languages">
            <div className="flex flex-wrap gap-2">
              {PROFILE_DATA.languages.map((lang, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 rounded-full text-sm font-medium"
                >
                  {lang}
                </span>
              ))}
            </div>
          </InfoCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <ActionButton 
            icon={Calendar} 
            text="Request Booking" 
            onClick={handleRequestBooking}
            variant="primary"
          />
          <ActionButton 
            icon={MessageCircle} 
            text="Send Message" 
            onClick={handleMessage}
            variant="secondary"
          />
          <ActionButton 
            icon={Phone} 
            text="Call Now" 
            onClick={() => handleCall('voice')}
            variant="secondary"
          />
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Suspense fallback={<LoadingSkeleton />}>
            <ProjectCarousel projects={PROFILE_DATA.portfolioUrls} />
          </Suspense>
        </motion.div>

        {/* Reviews Section */}
        <motion.div 
          className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow mt-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.button
            onClick={() => setReviewsOpen(!reviewsOpen)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors"
            whileHover={{ backgroundColor: undefined }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Reviews ({PROFILE_DATA.reviewCount})
            </h2>
            <motion.div
              animate={{ rotate: reviewsOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-6 h-6 text-gray-600 dark:text-slate-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {reviewsOpen && (
              <motion.div 
                className="px-6 pb-6"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Rating Summary */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-center mb-6">
                      <div className="text-5xl font-bold text-gray-900 dark:text-slate-100">
                        Great {PROFILE_DATA.rating}
                      </div>
                      <div className="flex justify-center space-x-1 my-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-6 h-6 ${
                              i < Math.floor(PROFILE_DATA.rating)
                                ? 'fill-blue-600 text-blue-600'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-gray-600 dark:text-slate-400">
                        {PROFILE_DATA.reviewCount} reviews
                      </div>
                    </div>
                  </motion.div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {RATING_DISTRIBUTION.map((rating, index) => (
                      <RatingBar key={rating.stars} rating={rating} index={index} />
                    ))}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="mt-8 space-y-6">
  {REVIEWS.map(review => (
    <ReviewThread
      key={review.id}
      item={review}
      onReply={setReplyTarget}
    />
  ))}
</div>

{replyTarget && (
  <div className="mt-6 bg-gray-50 dark:bg-[#252b3b] p-4 rounded-lg border dark:border-[#1e293b]">
    <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
      Replying to <strong>{replyTarget.author.name}</strong>:
<span className="italic text-gray-500 ml-1">
  “{replyTarget.reviewText.slice(0, 40)}…”
</span>

    </p>

    <textarea
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      className="w-full bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-slate-200 border dark:border-[#2d3748] rounded-lg p-3 focus:border-2 focus:border-blue-600 focus:outline-none"
      rows={3}
      placeholder="Write your reply..."
    />

    <div className="flex justify-end mt-3 gap-3">
      <button
        onClick={() => setReplyTarget(null)}
        className="px-6 py-2 bg-white dark:bg-[#1a1f2e] border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold flex items-center gap-2"
                      >
                      Cancel
                      </button>
      <button
        onClick={handlePostReply}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Post Reply
      </button>
    </div>
  </div>
)}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Modal */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center z-50"
          >
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Phone className="w-16 h-16 text-white" />
              </div>

              <h2 className="text-2xl font-semibold text-white mb-2">
                {PROFILE_DATA.name}
              </h2>

              <p className="text-gray-400">
                Voice calling...
              </p>
            </div>

            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full flex items-center space-x-2"
            >
              <Phone className="w-6 h-6 rotate-135" />
              <span>End Call</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top */}
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>
    </div>
  );
};

export default memo(GeneralProfile);