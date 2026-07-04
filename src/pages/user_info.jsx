import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from "../hooks/useNavigateBack.js";
import { useNotification } from '../contexts/NotificationContext';
import { useSearchLocation } from '../contexts/LocationContext';
import { useRole } from '../hooks/useRole';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Lock,
  Shield,
  Trash2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Button, Input, Card } from '../components/ui';

const GENDER_OPTIONS = [
  { value: 'male',             label: 'Male'            },
  { value: 'female',           label: 'Female'          },
  { value: 'other',            label: 'Other'           },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const GenderDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = GENDER_OPTIONS.find(o => o.value === value) ?? GENDER_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg bg-white dark:bg-[#252b3b] text-base font-medium transition-all ${
          open ? 'border-primary text-primary' : 'border-gray-300 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 hover:border-gray-400'
        }`}
      >
        {selected.label}
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-20 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[#1e293b] rounded-xl shadow-xl overflow-hidden w-full">
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange({ target: { name: 'gender', value: opt.value } }); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#252b3b] ${
                value === opt.value ? 'text-primary font-semibold bg-primary/5' : 'text-gray-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
import { ConfirmActionModal } from '../components/shared';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const EMPTY_PERSONAL = { firstName: '', lastName: '', otherName: '', email: '', phone: '', dateOfBirth: '', gender: 'male' };
const EMPTY_LOCATION  = { address: '', city: '', region: '', area: '', postalCode: '' };

const UserInfo = () => {
  const { showNotification } = useNotification();
  const { updateDefaultLocation } = useSearchLocation();
  const role = useRole(); // null while loading, then 'client' | 'service_provider'
  const [activeTab, setActiveTab] = useState('personal');
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
  const handleBackClick = useNavigateBack('/lucid/account', 400);

  const [personalInfo, setPersonalInfo] = useState(EMPTY_PERSONAL);
  const [locationInfo, setLocationInfo] = useState(EMPTY_LOCATION);

  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePersonalInfoChange   = (e) => setPersonalInfo(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleLocationInfoChange   = (e) => setLocationInfo(l => ({ ...l, [e.target.name]: e.target.value }));
  const handlePasswordChange       = (e) => setPasswordInfo(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSavePersonalInfo = () => {
    // [API] PUT /users/me/personal — {firstName, lastName, email, phone, dateOfBirth, gender}
    showNotification('Personal information updated successfully!', 'success');
  };

  const handleSaveLocationInfo = () => {
    // [API] PUT /users/me/location — {address, city, region, area, postalCode}
    updateDefaultLocation({
      area:   locationInfo.area,
      city:   locationInfo.city,
      region: locationInfo.region,
    });
    showNotification('Location information updated successfully!', 'success');
  };

  const handleChangePassword = async () => {
    if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }
    if (passwordInfo.newPassword.length < 8) {
      showNotification('Password must be at least 8 characters!', 'error');
      return;
    }
    // [API] PUT /users/me/password — {currentPassword, newPassword}
    setPasswordInfo({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showNotification('Password changed successfully!', 'success');
  };

  const openConfirmModal = (type) => setConfirmModal({ open: true, type });
  const closeConfirmModal = () => setConfirmModal({ open: false, type: null });

  const handleConfirmAction = async () => {
    const { type } = confirmModal;
    closeConfirmModal();
    if (type === 'deactivate') {
      // [API] POST /users/me/deactivate — server sends confirmation email
      showNotification('Account deactivation requested. Check your email for confirmation.', 'warning');
    } else if (type === 'delete') {
      // [API] DELETE /users/me — server sends confirmation email before hard delete
      showNotification('Account deletion initiated. Check your email to complete the process.', 'error');
    }
  };

  const handleDeactivateAccount = () => openConfirmModal('deactivate');
  const handleDeleteAccount     = () => openConfirmModal('delete');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'location', label: 'Location',      icon: MapPin },
    { id: 'security', label: 'Security',      icon: Shield },
    { id: 'danger',   label: 'Account',       icon: AlertCircle }
  ];

  // Show skeleton while role resolves from Supabase
  if (role === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#252b3b] animate-pulse">
        {/* Header */}
        <div className="bg-white dark:bg-[#1a1f2e] shadow-sm px-4 sm:px-6 lg:px-8 py-6 mb-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#252b3b]" />
            <div className="space-y-2">
              <div className="h-7 bg-gray-200 dark:bg-[#252b3b] rounded-lg w-52" />
              <div className="h-4 bg-gray-100 dark:bg-[#252b3b] rounded-lg w-80" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar tabs */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border p-3 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-11 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
              ))}
            </div>

            {/* Form content */}
            <div className="lg:col-span-3 bg-white dark:bg-[#1a1f2e] rounded-xl border p-6 space-y-5">
              <div className="h-7 bg-gray-200 dark:bg-[#252b3b] rounded w-52 mb-2" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
                <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
              </div>
              <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
              <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
              <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
                <div className="h-12 bg-gray-100 dark:bg-[#252b3b] rounded-lg" />
              </div>
              <div className="h-10 bg-gray-200 dark:bg-[#252b3b] rounded-lg w-36 mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Account Settings</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your account information and preferences</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="lg:col-span-1"
          >
            <Card className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="lg:col-span-3 space-y-6"
          >
            {/* Personal Information */}
            {activeTab === 'personal' && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Personal Information</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={personalInfo.firstName}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={personalInfo.lastName}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>
                  <Input
                    label="Other Name"
                    name="otherName"
                    value={personalInfo.otherName}
                    onChange={handlePersonalInfoChange}
                    placeholder="Middle name or other name (optional)"
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={handlePersonalInfoChange}
                    required
                    endIcon={<Mail className="w-5 h-5 text-gray-400" />}
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    required
                    endIcon={<Phone className="w-5 h-5 text-gray-400" />}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      value={personalInfo.dateOfBirth}
                      onChange={handlePersonalInfoChange}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="font-medium text-gray-700 dark:text-slate-300">Gender</label>
                      <GenderDropdown
                        value={personalInfo.gender}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSavePersonalInfo} className="mt-4">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            )}

            {/* Location Information */}
            {activeTab === 'location' && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Location Information</h2>
                <div className="space-y-4">
                  <Input
                    label="Street Address"
                    name="address"
                    value={locationInfo.address}
                    onChange={handleLocationInfoChange}
                    required
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={locationInfo.city}
                      onChange={handleLocationInfoChange}
                      required
                    />
                    <Input
                      label="Region"
                      name="region"
                      value={locationInfo.region}
                      onChange={handleLocationInfoChange}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Area"
                      name="area"
                      value={locationInfo.area}
                      onChange={handleLocationInfoChange}
                      required
                    />
                    <Input
                      label="Postal Code"
                      name="postalCode"
                      value={locationInfo.postalCode}
                      onChange={handleLocationInfoChange}
                    />
                  </div>
                  <Button onClick={handleSaveLocationInfo} className="mt-4">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Change Password</h2>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordInfo.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      endIcon={<Lock className="w-5 h-5 text-gray-400" />}
                    />
                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordInfo.newPassword}
                      onChange={handlePasswordChange}
                      required
                      helperText="Must be at least 8 characters"
                      endIcon={<Lock className="w-5 h-5 text-gray-400" />}
                    />
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordInfo.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      endIcon={<Lock className="w-5 h-5 text-gray-400" />}
                    />
                    <Button onClick={handleChangePassword} className="mt-4">
                      <Shield className="w-4 h-4" />
                      Change Password
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Two-Factor Authentication</h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  {/* [API] POST /users/me/2fa/enable — {} → {qrCodeUrl, secret} */}
                  <Button variant="outline">Enable 2FA</Button>
                </Card>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <Card className="border-2 border-yellow-200 bg-yellow-50">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Deactivate Account</h2>
                  <p className="text-gray-700 dark:text-slate-300 mb-4">
                    Temporarily deactivate your account. You can reactivate it within 30 days by logging in again.
                  </p>
                  <Button variant="secondary" onClick={handleDeactivateAccount}>
                    Deactivate Account
                  </Button>
                </Card>

                <Card className="border-2 border-error bg-red-50">
                  <h2 className="text-2xl font-bold text-red-900 mb-4">Delete Account</h2>
                  <div className="bg-red-100 border border-error rounded-lg p-4 mb-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 mb-1">Warning: This action is permanent</h3>
                        <p className="text-red-800 text-sm">
                          Deleting your account will permanently remove all your data, including bookings, reviews, and messages. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="danger" onClick={handleDeleteAccount}>
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete Account
                  </Button>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>

    {confirmModal.open && (
      <ConfirmActionModal
        type={confirmModal.type}
        onConfirm={handleConfirmAction}
        onClose={closeConfirmModal}
      />
    )}
    </>
  );
};

export default UserInfo;
