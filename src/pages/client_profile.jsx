import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { useNavigateBack } from '../hooks/useNavigateBack';
import { supabase } from '../lib/supabaseClient';
import {
  Star,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Clock,
  Edit2,
  ArrowLeft,
  CheckCircle,
  Shield
} from 'lucide-react';
import { Avatar, Button, Card } from '../components/ui';
import { Link } from 'react-router-dom';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const ClientProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] animate-pulse">
    <div className="bg-white dark:bg-[#1a1f2e] shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="w-9 h-9 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
        <div className="text-sm text-gray-600 dark:text-slate-400">Client Profile</div>
        <div className="w-9 h-9" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-gray-200 dark:bg-[#252b3b] rounded-full mb-4" />
        <div className="h-8 w-48 bg-gray-200 dark:bg-[#252b3b] rounded mb-2" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-[#252b3b] rounded" />
      </div>
      <div className="mt-8 grid gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-xl p-6">
            <div className="h-6 w-32 bg-gray-200 dark:bg-[#252b3b] rounded mb-4" />
            <div className="space-y-3">
              <div className="h-5 w-full bg-gray-200 dark:bg-[#252b3b] rounded" />
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-[#252b3b] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ClientProfile = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const handleBack = useNavigateBack('/lucid/dashboard', 400);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    totalSpent: 0
  });

  useEffect(() => {
    loadClientProfile();
  }, []);

  const loadClientProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/lucid/signin');
        return;
      }

      // Get client profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get client stats (bookings)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, total_amount')
        .eq('client_id', user.id);

      if (!bookingsError && bookingsData) {
        const totalBookings = bookingsData.length;
        const completedBookings = bookingsData.filter(b => b.status === 'completed').length;
        const totalSpent = bookingsData.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        setStats({ totalBookings, completedBookings, totalSpent });
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading client profile:', error);
      showNotification('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ClientProfileSkeleton />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-400 mb-4">Profile not found</p>
          <Button onClick={() => navigate('/lucid/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const fullName = profile.full_name || 'Client';
  const joinedDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long'
  }) : 'Recently';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] shadow-sm sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </button>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              <span className="font-semibold text-blue-600">Client Profile</span>
            </div>
            <Link to="/lucid/account/profile/edit">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors">
                <Edit2 className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{fullName}</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Member since {joinedDate}</p>
            
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {profile.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="text-center">
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.totalBookings}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Total Bookings</div>
            </div>
          </Card>
          <Card className="text-center">
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.completedBookings}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Completed</div>
            </div>
          </Card>
          <Card className="text-center">
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                GH₵{stats.totalSpent.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Total Spent</div>
            </div>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-[#1e293b]">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Email Address</p>
                <p className="text-gray-900 dark:text-slate-100">{profile.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-[#1e293b]">
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Phone Number</p>
                <p className="text-gray-900 dark:text-slate-100">{profile.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Location</p>
                <p className="text-gray-900 dark:text-slate-100">{profile.location || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-[#1e293b]">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Account Type</p>
                <p className="text-gray-900 dark:text-slate-100 capitalize">{profile.user_type || 'Client'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Member Since</p>
                <p className="text-gray-900 dark:text-slate-100">{joinedDate}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="mt-8 flex gap-4"
        >
          <Link to="/lucid/bookings" className="flex-1">
            <Button fullWidth size="lg">
              <ShoppingBag className="w-5 h-5" />
              View My Bookings
            </Button>
          </Link>
          <Link to="/lucid/services" className="flex-1">
            <Button fullWidth variant="outline" size="lg">
              Browse Services
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default memo(ClientProfile);