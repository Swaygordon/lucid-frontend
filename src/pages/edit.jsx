import React, { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { GHANA_LOCATIONS } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabaseClient';
import {
  CheckCircle, Users, User, Clock, SquarePlus, Minus, Plus,
  ChevronDown, ChevronUp, MapPin, Award, Languages, Camera, Trash2, ImageIcon, X
} from 'lucide-react';
import { ALL_CATEGORIES } from '../data/categories';
import { ImageUploadModal } from "../components/shared";
import { motion } from "framer-motion";
import { Button, Input } from '../components/ui';


// ============================================
// CUSTOM HOOKS
// ============================================
const useProfileForm = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    otherName: '',
    occupation: '',
    location: '',
    description: '',
    categories: [],
    skills: [],
    certifications: [],
    languages: [],
    workExperience: 0,
    paymentMethods: [],
    employees: 1,
    selectedDays: { weekdays: false, weekend: false, custom: false },
    showCustomDays: false,
    weekdaysTime: { start: '09:00', end: '17:00' },
    weekendTime: { start: '10:00', end: '16:00' },
    customDays: {
      sunday: { selected: false, start: '09:00', end: '17:00' },
      monday: { selected: false, start: '09:00', end: '17:00' },
      tuesday: { selected: false, start: '09:00', end: '17:00' },
      wednesday: { selected: false, start: '09:00', end: '17:00' },
      thursday: { selected: false, start: '09:00', end: '17:00' },
      friday: { selected: false, start: '09:00', end: '17:00' },
      saturday: { selected: false, start: '09:00', end: '17:00' }
    }
  });

  const handleInputChange = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleArrayAdd = useCallback((field, value) => {
    if (value.trim()) {
      setProfile(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  }, []);

  const handleArrayRemove = useCallback((field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  }, []);

  const handleTimeChange = useCallback((type, field, value) => {
    setProfile(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  }, []);

  const handleCustomDayChange = useCallback((day, field, value) => {
    setProfile(prev => ({
      ...prev,
      customDays: {
        ...prev.customDays,
        [day]: { ...prev.customDays[day], [field]: value }
      }
    }));
  }, []);

  const handleDaySelection = useCallback((dayType) => {
    setProfile(prev => {
      const newSelectedDays = { ...prev.selectedDays };
      if (dayType === 'custom') {
        if (!prev.selectedDays.custom) {
          newSelectedDays.weekdays = false;
          newSelectedDays.weekend = false;
          newSelectedDays.custom = true;
        } else {
          newSelectedDays.custom = false;
        }
      } else {
        if (!prev.selectedDays[dayType]) {
          newSelectedDays.custom = false;
          newSelectedDays[dayType] = true;
        } else {
          newSelectedDays[dayType] = false;
        }
      }
      return { ...prev, selectedDays: newSelectedDays };
    });
  }, []);

  const toggleCustomDays = useCallback(() => {
    setProfile(prev => ({ ...prev, showCustomDays: !prev.showCustomDays }));
  }, []);

  const handlePaymentToggle = useCallback((method) => {
    setProfile(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method],
    }));
  }, []);

  const setProfileData = useCallback((data) => {
    setProfile({
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      otherName: data.other_name || '',
      occupation: data.occupation || '',
      location: data.location || '',
      description: data.description || '',
      categories: data.categories || [],
      skills: data.skills || [],
      certifications: data.certifications || [],
      languages: data.languages || [],
      workExperience: data.work_experience || 0,
      paymentMethods: data.payment_methods || [],
      employees: data.employees || 1,
      selectedDays: data.selected_days || { weekdays: false, weekend: false, custom: false },
      weekdaysTime: data.weekdays_time || { start: '09:00', end: '17:00' },
      weekendTime: data.weekend_time || { start: '10:00', end: '16:00' },
      customDays: data.custom_days || {
        sunday: { selected: false, start: '09:00', end: '17:00' },
        monday: { selected: false, start: '09:00', end: '17:00' },
        tuesday: { selected: false, start: '09:00', end: '17:00' },
        wednesday: { selected: false, start: '09:00', end: '17:00' },
        thursday: { selected: false, start: '09:00', end: '17:00' },
        friday: { selected: false, start: '09:00', end: '17:00' },
        saturday: { selected: false, start: '09:00', end: '17:00' }
      },
      showCustomDays: false,
    });
  }, []);

  return {
    profile,
    handleInputChange,
    handleArrayAdd,
    handleArrayRemove,
    handleTimeChange,
    handleCustomDayChange,
    handleDaySelection,
    toggleCustomDays,
    handlePaymentToggle,
    setProfileData,
  };
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

const InputField = memo(({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="mb-2 font-medium text-gray-700 dark:text-slate-300">{label}</label>
    <Input
      type="text"
      {...props}
    />
  </div>
));

const CounterInput = memo(({ label, value, onChange, icon: Icon, min = 0 }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <span className="font-medium text-gray-900 dark:text-slate-100">{label}</span>
      {Icon && <Icon size={20} className="text-blue-600" />}
    </div>
    <div className="flex items-center max-w-[120px]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-3 py-2 border-2 border-gray-300 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-l-md transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
      >
        <Minus size={20} className="text-blue-600"/>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))}
        className="w-16 px-2 py-2 border-t-2 border-b-2 border-gray-300 dark:border-[#2d3748] text-center bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-200 transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min={min}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="px-3 py-2 border-2 border-gray-300 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-r-md transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
      >
        <Plus size={20} className="text-blue-600" />
      </button>
    </div>
  </div>
));

const DayCard = memo(({ selected, label, description, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer rounded-xl p-5 border-2 transition-all duration-300 transform hover:scale-102 ${
      selected
        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
        : 'border-gray-300 dark:border-[#2d3748] bg-white dark:bg-[#1a1f2e] hover:border-blue-400 hover:shadow-md'
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-gray-900 dark:text-slate-100">{label}</span>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
      }`}>
        {selected && <CheckCircle size={16} className="text-white" />}
      </div>
    </div>
    <p className="text-sm text-gray-600 dark:text-slate-400">{description}</p>
  </div>
));

const TimeInput = memo(({ label, value, onChange }) => (
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{label}</label>
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
));

const ArrayInputSection = memo(({ title, items, onAdd, onRemove, icon: Icon, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem);
      setNewItem('');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h3 className="text-gray-900 dark:text-slate-100 text-base font-semibold">{title}</h3>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2.5 rounded-lg group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <span className="flex-1 text-gray-900 dark:text-slate-100">{item}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2.5 border-2 border-gray-300 dark:border-[#2d3748] rounded-md text-sm focus:outline-none bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-200 placeholder:dark:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================
// CATEGORY CHIP SELECTOR
// ============================================
const CategoryChipSelector = memo(({ selectedCategories, onChange }) => {
  const toggle = (name) => {
    const next = selectedCategories.includes(name)
      ? selectedCategories.filter(c => c !== name)
      : [...selectedCategories, name];
    onChange(next);
  };

  return (
    <div className="animate-fade-in">
      <h3 className="text-gray-900 dark:text-slate-100 text-base font-semibold mb-1">Service Categories</h3>
      <p className="text-sm text-gray-500 dark:text-slate-500 mb-4">
        Select all categories that match your work. Clients use these to find you.
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map(({ name, icon: Icon }) => {
          const selected = selectedCategories.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                selected
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <Icon size={14} />
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ============================================
// WORKING HOURS SECTION
// ============================================
const WorkingHoursSection = memo(({ profile, onDaySelect, onTimeChange, onCustomDayChange, onToggleCustom }) => {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = {
    sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday'
  };

  const hasCustomDaysSelected = Object.values(profile.customDays).some(d => d.selected);

  return (
    <div className="md:col-span-2 animate-fade-in">
      <h3 className="text-gray-900 dark:text-slate-100 mb-6 text-lg font-bold">Working Hours</h3>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h4 className="text-base font-semibold mb-4 text-gray-800 dark:text-slate-200">Select Working Days</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DayCard
              selected={profile.selectedDays.weekdays}
              label="Weekdays"
              description="Mon - Fri"
              onClick={() => onDaySelect('weekdays')}
            />
            <DayCard
              selected={profile.selectedDays.weekend}
              label="Weekend"
              description="Sat - Sun"
              onClick={() => onDaySelect('weekend')}
            />
            <DayCard
              selected={profile.selectedDays.custom}
              label="Custom Days"
              description="Pick specific days"
              onClick={() => onDaySelect('custom')}
            />
          </div>
        </div>

        {profile.selectedDays.custom && (
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-800 dark:text-slate-200">Select Custom Days</h4>
              <button onClick={onToggleCustom} className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors">
                {profile.showCustomDays ? 'Hide' : 'Show'} Days
                {profile.showCustomDays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {profile.showCustomDays && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map(day => (
                  <div
                    key={day}
                    onClick={() => onCustomDayChange(day, 'selected', !profile.customDays[day].selected)}
                    className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${
                      profile.customDays[day].selected
                        ? 'border-blue-600 bg-blue-100 shadow-md'
                        : 'border-gray-300 dark:border-[#2d3748] bg-white dark:bg-[#252b3b] hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        profile.customDays[day].selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {profile.customDays[day].selected && <CheckCircle size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{dayLabels[day]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="text-base font-semibold mb-4 text-gray-800 dark:text-slate-200">Set Working Hours</h4>
          <div className="space-y-4">
            {profile.selectedDays.weekdays && (
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl p-5 border-2 border-blue-200 dark:border-blue-900/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <h5 className="font-semibold text-gray-900 dark:text-slate-100">Weekdays Hours</h5>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-slate-400">Mon - Fri</span>
                </div>
                <div className="flex gap-4">
                  <TimeInput label="Start Time" value={profile.weekdaysTime.start} onChange={(v) => onTimeChange('weekdaysTime', 'start', v)} />
                  <TimeInput label="End Time" value={profile.weekdaysTime.end} onChange={(v) => onTimeChange('weekdaysTime', 'end', v)} />
                </div>
              </div>
            )}

            {profile.selectedDays.weekend && (
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl p-5 border-2 border-blue-200 dark:border-blue-900/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <h5 className="font-semibold text-gray-900 dark:text-slate-100">Weekend Hours</h5>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-slate-400">Sat - Sun</span>
                </div>
                <div className="flex gap-4">
                  <TimeInput label="Start Time" value={profile.weekendTime.start} onChange={(v) => onTimeChange('weekendTime', 'start', v)} />
                  <TimeInput label="End Time" value={profile.weekendTime.end} onChange={(v) => onTimeChange('weekendTime', 'end', v)} />
                </div>
              </div>
            )}

            {profile.selectedDays.custom && hasCustomDaysSelected && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                <h5 className="font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  Custom Days Hours
                </h5>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {daysOfWeek.map(day => profile.customDays[day].selected && (
                    <div key={day} className="bg-white dark:bg-[#1a1f2e] rounded-lg p-4 border border-blue-200 dark:border-blue-900/50 shadow-sm">
                      <div className="font-medium text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {dayLabels[day]}
                      </div>
                      <div className="flex gap-3">
                        <TimeInput label="Start" value={profile.customDays[day].start} onChange={(v) => onCustomDayChange(day, 'start', v)} />
                        <TimeInput label="End" value={profile.customDays[day].end} onChange={(v) => onCustomDayChange(day, 'end', v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!profile.selectedDays.weekdays && !profile.selectedDays.weekend && !profile.selectedDays.custom && (
              <div className="bg-gray-50 dark:bg-[#252b3b] rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-[#2d3748]">
                <Clock className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-slate-400 font-medium">Please select working days above to set hours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { showNotification } = useNotification();
  const formMethods = useProfileForm();
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [heroUrl, setHeroUrl] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  useEffect(() => {
    loadProviderProfile();
  }, []);

  const loadProviderProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/lucid/signin');
        return;
      }

      const { data, error } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        formMethods.setProfileData(data);
        setAvatarUrl(data.avatar_url);
        setHeroUrl(data.hero_url);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('Failed to load profile', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const uploadImage = async (file, type) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `providers/${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const profileData = {
        user_id: user.id,
        first_name: formMethods.profile.firstName,
        last_name: formMethods.profile.lastName,
        other_name: formMethods.profile.otherName,
        occupation: formMethods.profile.occupation,
        location: formMethods.profile.location,
        description: formMethods.profile.description,
        categories: formMethods.profile.categories,
        skills: formMethods.profile.skills,
        certifications: formMethods.profile.certifications,
        languages: formMethods.profile.languages,
        work_experience: formMethods.profile.workExperience,
        employees: formMethods.profile.employees,
        payment_methods: formMethods.profile.paymentMethods,
        selected_days: formMethods.profile.selectedDays,
        weekdays_time: formMethods.profile.weekdaysTime,
        weekend_time: formMethods.profile.weekendTime,
        custom_days: formMethods.profile.customDays,
        avatar_url: avatarUrl,
        hero_url: heroUrl,
        total_completed_jobs: formMethods.profile.totalCompletedJobs || 0,
        rating_average: formMethods.profile.ratingAverage || 0,
        is_profile_complete: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('provider_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      showNotification('Profile saved successfully!', 'success');
      navigate('/lucid/account/profile', { replace: true });
    } catch (error) {
      console.error('Save error:', error);
      showNotification(error.message || 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/lucid/account/profile', { replace: true });
  };

  const openUpload = (target) => setUploadTarget(target);
  const closeUpload = () => setUploadTarget(null);

  const handleUploadComplete = async (file) => {
    try {
      const url = await uploadImage(file, uploadTarget);
      if (uploadTarget === 'avatar') {
        setAvatarUrl(url);
      } else if (uploadTarget === 'hero') {
        setHeroUrl(url);
      }
      showNotification('Image uploaded successfully!', 'success');
    } catch (error) {
      showNotification('Failed to upload image', 'error');
    }
    closeUpload();
  };

  if (loadingData) {
    return (
      <div className="bg-gray-50 dark:bg-[#0f1117] min-h-screen pb-32 animate-pulse">
        {/* Hero banner */}
        <div className="w-full h-44 md:h-56 bg-gray-300 dark:bg-[#252b3b]" />

        {/* Avatar + buttons */}
        <div className="flex flex-col items-center -mt-14 mb-6 gap-3">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-300 dark:bg-[#252b3b] border-4 border-white dark:border-[#0f1117]" />
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 space-y-6">
          {/* Name row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-14 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
            <div className="h-14 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
          </div>
          {/* Occupation / Other name row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-14 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
            <div className="h-14 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
          </div>
          {/* Location dropdown */}
          <div className="h-12 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-9 w-28 bg-gray-200 dark:bg-[#252b3b] rounded-full" />
            ))}
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-5">
            {/* Left: description + overview + payment */}
            <div className="space-y-8">
              <div className="h-28 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
              <div className="space-y-4">
                <div className="h-5 w-24 bg-gray-200 dark:bg-[#252b3b] rounded" />
                <div className="h-12 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
                <div className="h-12 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
                <div className="h-12 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 dark:bg-[#252b3b] rounded" />
                <div className="h-8 bg-gray-200 dark:bg-[#252b3b] rounded" />
                <div className="h-8 bg-gray-200 dark:bg-[#252b3b] rounded" />
              </div>
            </div>
            {/* Right: skills + certs + languages + portfolio */}
            <div className="space-y-8">
              {[0, 1, 2].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-28 bg-gray-200 dark:bg-[#252b3b] rounded" />
                  <div className="h-10 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
                </div>
              ))}
              {/* Portfolio upload area */}
              <div className="h-28 bg-gray-200 dark:bg-[#252b3b] rounded-lg border-2 border-dashed border-gray-300 dark:border-[#2d3748]" />
            </div>
          </div>

          {/* Working hours */}
          <div className="space-y-4">
            <div className="h-6 w-36 bg-gray-200 dark:bg-[#252b3b] rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-[#252b3b] rounded-xl" />
              ))}
            </div>
          </div>

          {/* Save / Cancel buttons */}
          <div className="flex gap-4 justify-center pt-8 border-t border-gray-200 dark:border-[#1e293b]">
            <div className="h-11 flex-1 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
            <div className="h-11 flex-1 bg-gray-200 dark:bg-[#252b3b] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-[#0f1117] min-h-screen pb-32">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>

      {/* ── Hero Background Section ── */}
      <div className="relative w-full h-44 md:h-56 overflow-hidden">
        {heroUrl ? (
          <img src={heroUrl} alt="Profile banner" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400" />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3">
          <button
            onClick={() => openUpload('hero')}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
          >
            <ImageIcon size={16} />
            {heroUrl ? 'Change banner' : 'Add banner'}
          </button>
          {heroUrl && (
            <button
              onClick={() => setHeroUrl(null)}
              className="flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
            >
              <X size={16} />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Picture ── */}
      <div className="flex justify-center -mt-14 mb-6 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 dark:bg-[#252b3b] flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            <div
              onClick={() => openUpload('avatar')}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
            >
              <Camera size={22} className="text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openUpload('avatar')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg shadow transition-colors"
            >
              Change picture
            </button>
            {avatarUrl && (
              <button
                onClick={() => setAvatarUrl(null)}
                className="bg-white dark:bg-[#1a1f2e] hover:bg-red-50 border border-red-300 text-red-600 text-xs font-medium px-4 py-2 rounded-lg shadow transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5">
        <div className="flex flex-col gap-6">

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="First Name"
              value={formMethods.profile.firstName}
              onChange={(e) => formMethods.handleInputChange('firstName', e.target.value)}
            />
            <InputField
              label="Last Name"
              value={formMethods.profile.lastName}
              onChange={(e) => formMethods.handleInputChange('lastName', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Other Name"
              value={formMethods.profile.otherName}
              onChange={(e) => formMethods.handleInputChange('otherName', e.target.value)}
            />
            <InputField
              label="Occupation"
              value={formMethods.profile.occupation}
              onChange={(e) => formMethods.handleInputChange('occupation', e.target.value)}
            />
          </div>

          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <label className="font-medium text-gray-700 dark:text-slate-300">Location</label>
            </div>
            <select
              value={formMethods.profile.location}
              onChange={(e) => formMethods.handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-[#2d3748] rounded-md text-sm bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
            >
              <option value="">Select your area</option>
              {GHANA_LOCATIONS.map(group => (
                <optgroup key={group.region} label={group.region}>
                  {group.areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Service Categories */}
          <CategoryChipSelector
            selectedCategories={formMethods.profile.categories}
            onChange={(cats) => formMethods.handleInputChange('categories', cats)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-5">
            {/* LEFT COLUMN */}
            <div className="space-y-8">

              {/* Description */}
              <div>
                <label className="block mb-2 text-lg font-bold text-gray-900 dark:text-slate-100">Description</label>
                <textarea
                  placeholder="Write a brief description about yourself..."
                  value={formMethods.profile.description}
                  onChange={(e) => formMethods.handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-300 dark:border-[#2d3748] rounded-md text-sm resize-y min-h-[120px] bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-200 placeholder:dark:text-slate-500 transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  rows="4"
                />
              </div>

              {/* Overview */}
              <div>
                <h3 className="text-gray-900 dark:text-slate-100 mb-4 text-lg font-bold">Overview</h3>

                <div className="mb-5 pb-4 border-b border-gray-200 dark:border-[#1e293b]">
                  <div className="flex justify-between items-center mb-2 font-medium text-gray-900 dark:text-slate-100">
                    <span>Verification Status</span>
                    <CheckCircle size={20} className="text-blue-600" />
                  </div>
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Verified</span>
                </div>

                <div className="mb-5 pb-4 border-b border-gray-200 dark:border-[#1e293b]">
                  <CounterInput
                    label="Number of Employees"
                    value={formMethods.profile.employees}
                    onChange={(val) => formMethods.handleInputChange('employees', val)}
                    icon={Users}
                    min={1}
                  />
                </div>

                <div className="mb-5">
                  <CounterInput
                    label="Work Experience (years)"
                    value={formMethods.profile.workExperience}
                    onChange={(val) => formMethods.handleInputChange('workExperience', val)}
                    icon={Clock}
                    min={0}
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-gray-900 dark:text-slate-100 mb-1 text-base font-semibold">Payment Methods</h3>
                <p className="text-gray-500 dark:text-slate-500 text-sm mb-4">Select all that apply</p>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'mobile', label: 'Mobile Money' },
                    { key: 'bank',   label: 'Bank Transfer' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={formMethods.profile.paymentMethods.includes(key)}
                        onChange={() => formMethods.handlePaymentToggle(key)}
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className="text-gray-900 dark:text-slate-100">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">
              <ArrayInputSection
                title="Skills & Tags"
                items={formMethods.profile.skills}
                onAdd={(item) => formMethods.handleArrayAdd('skills', item)}
                onRemove={(index) => formMethods.handleArrayRemove('skills', index)}
                placeholder="Add a skill (e.g., React Development)"
              />

              <ArrayInputSection
                title="Certifications"
                items={formMethods.profile.certifications}
                onAdd={(item) => formMethods.handleArrayAdd('certifications', item)}
                onRemove={(index) => formMethods.handleArrayRemove('certifications', index)}
                icon={Award}
                placeholder="Add a certification"
              />

              <ArrayInputSection
                title="Languages"
                items={formMethods.profile.languages}
                onAdd={(item) => formMethods.handleArrayAdd('languages', item)}
                onRemove={(index) => formMethods.handleArrayRemove('languages', index)}
                icon={Languages}
                placeholder="Add a language"
              />

              {/* Portfolio Projects */}
              <div>
                <h3 className="text-gray-900 dark:text-slate-100 mb-2 text-base font-semibold">Portfolio Projects</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">Upload pictures of previous work done</p>
                <div
                  onClick={() => openUpload('portfolio')}
                  className="border-2 border-dashed border-gray-300 dark:border-[#2d3748] rounded-lg p-10 bg-white dark:bg-[#252b3b] hover:border-blue-600 transition-colors flex justify-center cursor-pointer"
                >
                  <SquarePlus size={38} className="text-gray-400 hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours - Full Width */}
          <WorkingHoursSection
            profile={formMethods.profile}
            onDaySelect={formMethods.handleDaySelection}
            onTimeChange={formMethods.handleTimeChange}
            onCustomDayChange={formMethods.handleCustomDayChange}
            onToggleCustom={formMethods.toggleCustomDays}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8 pt-8 border-t border-gray-200 dark:border-[#1e293b]">
            <Button fullWidth variant='danger' size="md" onClick={handleCancel}>Cancel</Button>
            <Button fullWidth size="md" onClick={handleSave} loading={loading}>Save Changes</Button>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={uploadTarget !== null}
        onClose={closeUpload}
        onUpload={handleUploadComplete}
        title={
          uploadTarget === 'avatar'    ? 'Change Profile Picture' :
          uploadTarget === 'hero'      ? 'Change Banner Image' :
          'Upload Portfolio Image'
        }
      />
    </div>

  );
};

export default EditProfile;
