import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlarmClock,
  ArrowLeft,
  Bell,
  CalendarCheck,
  CreditCard,
  Mail,
  // Megaphone,
  MessageSquare,
  Save,
  Shield,
  Smartphone,
  Star,
  UserCheck,
  Volume2
} from 'lucide-react';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useNotification } from '../contexts/NotificationContext';
import { Button, Card } from '../components/ui';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const MotionDiv = motion.div;
const MotionHeader = motion.header;

const channelLabels = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS'
};

const channelMasterKeys = {
  push: 'pushEnabled',
  email: 'emailEnabled',
  sms: 'smsEnabled'
};

const criticalRows = [
  {
    icon: CalendarCheck,
    title: 'Booking activity',
    description: 'Requests, confirmations, cancellations, and booking changes.',
    preferences: [
      { channel: 'push', key: 'pushBookingRequests' },
      { channel: 'email', key: 'emailBookingConfirm' },
      { channel: 'sms', key: 'smsBookingRequests' }
    ]
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    description: 'New client and provider conversations.',
    preferences: [
      { channel: 'push', key: 'pushMessages' },
      { channel: 'email', key: 'emailMessages' }
    ]
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Payment confirmations, failed payments, and receipts.',
    preferences: [
      { channel: 'push', key: 'pushPayments' },
      { channel: 'email', key: 'emailPayments' },
      { channel: 'sms', key: 'smsPayments' }
    ]
  },
  {
    icon: UserCheck,
    title: 'Profile updates',
    description: 'Profile changes, account status, and important account updates.',
    preferences: [
      { channel: 'push', key: 'pushProfile' },
      { channel: 'email', key: 'emailProfile' }
    ]
  },
  {
    icon: Shield,
    title: 'Verification',
    description: 'Identity, provider approval, and security verification updates.',
    preferences: [
      { channel: 'push', key: 'pushVerification' },
      { channel: 'email', key: 'emailVerification' },
      { channel: 'sms', key: 'smsVerification' }
    ]
  },
  {
    icon: AlarmClock,
    title: 'Reminders',
    description: 'Upcoming bookings, appointments, and time-sensitive reminders.',
    preferences: [
      { channel: 'push', key: 'pushReminders' },
      { channel: 'email', key: 'emailReminders' },
      { channel: 'sms', key: 'smsReminders' }
    ]
  }
];

const optionalRows = [
  {
    icon: Star,
    title: 'Reviews and ratings',
    description: 'New reviews, rating changes, and review replies.',
    preferences: [
      { channel: 'push', key: 'pushReviews' },
      { channel: 'email', key: 'emailReviews' }
    ]
  }
];

const initialSettings = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: true,

  pushBookingRequests: true,
  pushMessages: true,
  pushPayments: true,
  pushProfile: true,
  pushVerification: true,
  pushReminders: true,
  pushReviews: true,

  emailBookingConfirm: true,
  emailMessages: false,
  emailPayments: true,
  emailProfile: true,
  emailVerification: true,
  emailReminders: true,
  emailReviews: true,

  smsBookingRequests: true,
  smsPayments: true,
  smsVerification: true,
  smsReminders: true,

  // marketingUpdates: false,
  // smsPromotions: false,

  soundEnabled: true,
  vibrationEnabled: true,
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '07:00'
};

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const { showNotification } = useNotification();
  const handleBackClick = useNavigateBack('/lucid/notifications', 400);

  const handleToggle = useCallback((key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleTimeChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveSettings = async () => {
    // [API] PATCH /users/:id/notification-prefs with the settings object.
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setLoading(false);
    showNotification('Notification settings saved successfully!', 'success');
  };

  const ToggleSwitch = ({ enabled, onChange, label, disabled = false }) => (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Disable' : 'Enable'} ${label}`}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-12 rounded-full transition-colors disabled:cursor-not-allowed ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-[#252b3b]'
      } ${disabled ? 'opacity-40 grayscale' : ''}`}
    >
      <MotionDiv
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );

  const ChannelToggle = ({ channel, settingKey }) => {
    const masterKey = channelMasterKeys[channel];
    const disabled = !settings[masterKey];

    return (
      <div className={`flex w-20 flex-col items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
        <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">
          {channelLabels[channel]}
        </span>
        <ToggleSwitch
          enabled={settings[settingKey]}
          onChange={() => handleToggle(settingKey)}
          label={`${channelLabels[channel]} ${settingKey}`}
          disabled={disabled}
        />
      </div>
    );
  };

  const PreferenceRow = ({ icon: Icon, title, description, preferences }) => (
    <div className="flex flex-col gap-4 border-b border-gray-200 py-4 last:border-0 dark:border-[#1e293b] md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="h-fit rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
          {React.createElement(Icon, { className: 'h-5 w-5 text-blue-600' })}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        {preferences.map(preference => (
          <ChannelToggle
            key={preference.key}
            channel={preference.channel}
            settingKey={preference.key}
          />
        ))}
      </div>
    </div>
  );

  const Section = ({ icon: Icon, title, description, rows, delay = 0 }) => (
    <MotionDiv initial="hidden" animate="visible" variants={fadeIn} transition={{ delay }}>
      <Card>
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-blue-600 p-2">
            {React.createElement(Icon, { className: 'h-6 w-6 text-white' })}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div>
          {rows.map(row => (
            <PreferenceRow key={row.title} {...row} />
          ))}
        </div>
      </Card>
    </MotionDiv>
  );

  const channelMasters = [
    {
      key: 'pushEnabled',
      icon: Bell,
      title: 'Push notifications',
      description: 'In-app and device alerts.'
    },
    {
      key: 'emailEnabled',
      icon: Mail,
      title: 'Email notifications',
      description: 'Receipts and account messages.'
    },
    {
      key: 'smsEnabled',
      icon: Smartphone,
      title: 'SMS notifications',
      description: 'Urgent phone alerts.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <MotionHeader
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-white shadow-sm dark:bg-[#1a1f2e]"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              aria-label="Go back"
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#252b3b]"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Notification Settings</h1>
              <p className="mt-1 text-gray-600 dark:text-slate-400">Choose which alerts reach you and where they arrive.</p>
            </div>
          </div>
        </div>
      </MotionHeader>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <MotionDiv initial="hidden" animate="visible" variants={fadeIn}>
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-slate-800 p-2 dark:bg-slate-700">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Delivery Channels</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Master switches control every setting under that channel.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {channelMasters.map(({ key, icon: Icon, title, description }) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-[#1e293b]"
                >
                  <div className="flex gap-3">
                    <div className="h-fit rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      {React.createElement(Icon, { className: 'h-5 w-5 text-blue-600' })}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{description}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={settings[key]}
                    onChange={() => handleToggle(key)}
                    label={title}
                  />
                </div>
              ))}
            </div>
          </Card>
        </MotionDiv>

        <Section
          icon={Shield}
          title="Critical Notifications"
          description="Operational alerts that help you manage bookings, money, account status, and time-sensitive work."
          rows={criticalRows}
          delay={0.1}
        />

        <Section
          icon={Star}
          title="Optional Updates"
          description="Helpful product and reputation updates that are not required for core workflows."
          rows={optionalRows}
          delay={0.2}
        />

        {/*
        <MotionDiv initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}>
          <Card>
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-pink-600 p-2">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Promotions</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Marketing updates are consolidated for push and email, while SMS remains separate.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 py-4 dark:border-[#1e293b]">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Marketing updates</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Offers, product news, and promotional updates by push or email.</p>
                </div>
                <ToggleSwitch
                  enabled={settings.marketingUpdates}
                  onChange={() => handleToggle('marketingUpdates')}
                  label="Push and email marketing updates"
                  disabled={!settings.pushEnabled && !settings.emailEnabled}
                />
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Promotional SMS</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Promotional text messages managed separately from push and email.</p>
                </div>
                <ToggleSwitch
                  enabled={settings.smsPromotions}
                  onChange={() => handleToggle('smsPromotions')}
                  label="Promotional SMS"
                  disabled={!settings.smsEnabled}
                />
              </div>
            </div>
          </Card>
        </MotionDiv>
        */}

        <MotionDiv initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.4 }}>
          <Card>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-purple-600 p-2">
                <Volume2 className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Sound and Vibration</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 py-4 dark:border-[#1e293b]">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Notification sounds</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Play sound when notifications arrive.</p>
                </div>
                <ToggleSwitch enabled={settings.soundEnabled} onChange={() => handleToggle('soundEnabled')} label="Notification sounds" />
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Vibration</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Vibrate your device for notifications.</p>
                </div>
                <ToggleSwitch enabled={settings.vibrationEnabled} onChange={() => handleToggle('vibrationEnabled')} label="Vibration" />
              </div>
            </div>
          </Card>
        </MotionDiv>

        <MotionDiv initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.5 }}>
          <Card>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-red-600 p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Do Not Disturb</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Silence non-critical notifications during specific hours.</p>
              </div>
              <ToggleSwitch
                enabled={settings.dndEnabled}
                onChange={() => handleToggle('dndEnabled')}
                label="Do Not Disturb"
              />
            </div>

            {settings.dndEnabled && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid gap-4 border-t border-gray-200 pt-4 dark:border-[#1e293b] md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.dndStart}
                    onChange={(event) => handleTimeChange('dndStart', event.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-600 focus:outline-none dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.dndEnd}
                    onChange={(event) => handleTimeChange('dndEnd', event.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-600 focus:outline-none dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200"
                  />
                </div>
              </MotionDiv>
            )}
          </Card>
        </MotionDiv>

        <MotionDiv initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.6 }}>
          <Button onClick={handleSaveSettings} loading={loading} size="lg" fullWidth>
            <Save className="h-5 w-5" />
            Save Notification Settings
          </Button>
        </MotionDiv>
      </div>
    </div>
  );
};

export default NotificationSettings;
