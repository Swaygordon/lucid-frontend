// ============================================
// BOOKING REQUEST FORM PAGE
// File: src/pages/booking_request.jsx
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigateBack } from "../hooks/useNavigateBack.js";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import { Button, Card, Input } from '../components/ui';
import { GHANA_LOCATIONS } from '../contexts/LocationContext';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const LocationDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const filteredGroups = query.trim()
    ? GHANA_LOCATIONS.map(g => ({
        ...g,
        areas: g.areas.filter(a => a.toLowerCase().includes(query.toLowerCase())),
      })).filter(g => g.areas.length > 0)
    : GHANA_LOCATIONS;

  function handleSelect(area, region) {
    onChange(area, region);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-[#252b3b] text-sm transition-all duration-200 ${
          open ? 'border-blue-500' : 'border-gray-200 dark:border-[#2d3748] hover:border-gray-300'
        }`}
      >
        <span className={value ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'}>
          {value || 'Select area / neighbourhood'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 z-50 w-full bg-white dark:bg-[#252b3b] border border-gray-200 dark:border-[#1e293b] rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-[#1e293b]">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              placeholder="Search locations..."
              className="w-full px-3 py-1.5 text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-[#2d3748] rounded-lg focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400 dark:text-slate-500 text-center">No locations found</p>
            ) : (
              filteredGroups.map(group => (
                <div key={group.region}>
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    {group.region}
                  </p>
                  {group.areas.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleSelect(area, group.region)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1f2e] ${
                        value === area ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-primary/10' : 'text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BookingRequest = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { providerId } = useParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [provider, setProvider] = useState(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const handleBackClick = useNavigateBack(`/lucid/providers/${providerId}`, 600);

  // Get current user and provider
  useEffect(() => {
    async function fetchData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Don't fetch profile here to avoid 400 error - use user metadata instead
      }
      
      // Get provider
      if (providerId) {
        const { data } = await supabase
          .from('provider_profiles')
          .select('user_id, first_name, last_name, occupation, location')
          .eq('user_id', providerId)
          .single();
        if (data) {
          setProvider({
            id: data.user_id,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Service Provider',
            profession: data.occupation || '',
            location: data.location || '',
          });
        }
        setProviderLoading(false);
      }
    }
    fetchData();
  }, [providerId]);

  // Form state
  const [formData, setFormData] = useState({
    serviceType: '',
    customService: '',
    description: '',
    urgency: 'normal',
    preferredDate: '',
    preferredTime: '',
    alternateDate: '',
    alternateTime: '',
    address: '',
    city: '',
    area: '',
    landmark: '',
    postalCode: '',
    estimatedDuration: '',
    budgetMin: '',
    budgetMax: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    additionalNotes: ''
  });

  const serviceTypes = [
    'Plumbing Repair',
    'Electrical Installation',
    'Pipe Installation',
    'Water Heater Repair',
    'Circuit Repair',
    'Emergency Service',
    'Maintenance',
    'Other (Specify)'
  ];

  const urgencyLevels = [
    { value: 'normal', label: 'Normal', description: 'Within 3-5 days' },
    { value: 'urgent', label: 'Urgent', description: 'Within 24 hours' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      showNotification('Maximum 5 images allowed', 'error');
      return;
    }

    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file)
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.serviceType) {
          showNotification('Please select a service type', 'error');
          return false;
        }
        if (formData.serviceType === 'Other (Specify)' && !formData.customService) {
          showNotification('Please specify the service', 'error');
          return false;
        }
        if (!formData.description) {
          showNotification('Please provide a description', 'error');
          return false;
        }
        return true;

      case 2:
        if (!formData.preferredDate || !formData.preferredTime) {
          showNotification('Please select preferred date and time', 'error');
          return false;
        }
        return true;

      case 3:
        if (!formData.address || !formData.area) {
          showNotification('Please provide complete address', 'error');
          return false;
        }
        return true;

      case 4:
        if (!formData.contactName || !formData.contactPhone) {
          showNotification('Please provide contact information', 'error');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateStep(4)) return;

  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showNotification('Please log in to book a service', 'error');
      navigate('/lucid/signin');
      return;
    }

    const serviceTitle = formData.serviceType === 'Other (Specify)'
      ? formData.customService
      : formData.serviceType;

    // Calculate duration in hours
    let durationHours = null;
    if (formData.estimatedDuration) {
      const match = formData.estimatedDuration.match(/(\d+)/);
      if (match) durationHours = parseInt(match[1], 10);
    }

    // Create the full location string
    const locationString = `${formData.address}, ${formData.area}, ${formData.city || 'Accra'}`;

    // Create booking with ALL form data - using ONLY columns that exist
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        // Basic booking info (these columns exist)
        client_id: user.id,
        provider_id: provider.id,
        service_date: formData.preferredDate,
        service_time: formData.preferredTime,
        duration_hours: durationHours,
        total_amount: 0,
        status: 'pending',
        description: formData.description,
        cancellation_reason: null,
        
        // These columns will be added by the SQL above
        location: locationString,
        urgency: formData.urgency,
        alternate_date: formData.alternateDate || null,
        alternate_time: formData.alternateTime || null,
        street_address: formData.address,
        area: formData.area,
        landmark: formData.landmark || null,
        postal_code: formData.postalCode || null,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail || null,
        budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
        budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        additional_notes: formData.additionalNotes || null,
        service_type: serviceTitle,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (bookingError) {
      console.error('Booking error details:', bookingError);
      throw bookingError;
    }

    if (!booking || booking.length === 0) {
      throw new Error('No booking data returned');
    }

    const newBooking = booking[0];

    // Create notification for provider
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: provider.id,
        type: 'booking',
        title: 'New Booking Request',
        message: `New booking request from ${formData.contactName} for ${serviceTitle}`,
        metadata: { 
          booking_id: newBooking.id, 
          client_name: formData.contactName,
          service_type: serviceTitle,
          date: formData.preferredDate,
          time: formData.preferredTime
        },
        created_at: new Date().toISOString(),
        is_read: false
      });

    if (notifError) {
      console.error('Notification error:', notifError);
    }

    showNotification('Booking request sent successfully!', 'success');

    navigate('/lucid/bookings/confirmation', {
      state: {
        bookingData: {
          id: newBooking.id,
          title: serviceTitle,
          serviceType: serviceTitle,
          status: 'pending',
          date: formData.preferredDate,
          time: formData.preferredTime,
          alternateDate: formData.alternateDate || null,
          alternateTime: formData.alternateTime || null,
          price: 0,
          description: formData.description,
          duration: formData.estimatedDuration,
          urgency: formData.urgency,
          bookingReference: `BK${newBooking.id.slice(0, 8)}`,
          provider: {
            name: provider.name,
            profession: provider.profession,
          },
          client: {
            name: formData.contactName,
            phone: formData.contactPhone,
            email: formData.contactEmail || null
          },
          location: {
            address: formData.address,
            area: formData.area,
            city: formData.city,
            landmark: formData.landmark || null,
            postalCode: formData.postalCode || null
          },
          budget: {
            min: formData.budgetMin ? parseInt(formData.budgetMin, 10) : null,
            max: formData.budgetMax ? parseInt(formData.budgetMax, 10) : null
          },
          additionalNotes: formData.additionalNotes || null
        },
        provider
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    showNotification(error.message || 'Failed to submit booking. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
};

  const steps = [
    { number: 1, title: 'Service Details', icon: FileText },
    { number: 2, title: 'Schedule', icon: Calendar },
    { number: 3, title: 'Location', icon: MapPin },
    { number: 4, title: 'Contact & Review', icon: CheckCircle }
  ];

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 dark:text-slate-400 text-lg">Provider not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Request Booking</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">
                Book service from <span className="font-semibold">{provider.name}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-600'
                        : isActive
                          ? 'bg-primary'
                          : 'bg-gray-300'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <StepIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <span className={`text-sm font-medium text-center ${
                      isActive ? 'text-primary' : 'text-gray-600 dark:text-slate-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 mb-8 transition-colors ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Service Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
              >
                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Service Details</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Select Service Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {serviceTypes.map((service) => (
                          <button
                            key={service}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, serviceType: service }))}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              formData.serviceType === service
                                ? 'border-blue-600 bg-blue-50 dark:bg-primary/10'
                                : 'border-gray-200 dark:border-[#2d3748] hover:border-blue-300'
                            }`}
                          >
                            <span className="text-gray-700 dark:text-slate-300 font-medium">{service}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.serviceType === 'Other (Specify)' && (
                      <Input
                        label="Specify Service"
                        name="customService"
                        value={formData.customService}
                        onChange={handleChange}
                        placeholder="e.g., Custom installation"
                        required
                      />
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="6"
                        className="w-full px-4 py-3 text-gray-700 dark:text-slate-200 bg-white dark:bg-[#252b3b] border-2 border-gray-300 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none"
                        placeholder="Please provide detailed description of the work needed, any specific requirements, materials needed, etc."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Urgency Level <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {urgencyLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, urgency: level.value }))}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                              formData.urgency === level.value
                                ? 'border-blue-600 bg-blue-50 dark:bg-primary/10'
                                : 'border-gray-200 dark:border-[#2d3748] hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-slate-100">{level.label}</div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">{level.description}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Schedule */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
              >
                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Schedule</h2>

                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-primary/10 border border-blue-200 dark:border-blue-700/40 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-300">
                          <p className="font-semibold mb-1">Important</p>
                          <p>The service provider will confirm availability after reviewing your request.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Preferred Date"
                        name="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      <Input
                        label="Preferred Time"
                        name="preferredTime"
                        type="time"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Alternate Date (Optional)"
                        name="alternateDate"
                        type="date"
                        value={formData.alternateDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        label="Alternate Time (Optional)"
                        name="alternateTime"
                        type="time"
                        value={formData.alternateTime}
                        onChange={handleChange}
                      />
                    </div>

                    <Input
                      label="Estimated Duration"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleChange}
                      placeholder="e.g., 2-3 hours, Half day, Full day"
                      helperText="Approximate time you expect the job to take"
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
              >
                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Location Details</h2>

                  <div className="space-y-6">
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House number and street name"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Area / Neighbourhood <span className="text-red-500">*</span>
                      </label>
                      <LocationDropdown
                        value={formData.area}
                        onChange={(area, region) =>
                          setFormData(prev => ({ ...prev, area, city: region }))
                        }
                      />
                    </div>

                    <Input
                      label="Landmark"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="Nearby landmark for easy location"
                      helperText="e.g., Near ABC Mall, Behind XYZ School"
                    />

                    <Input
                      label="Postal/Digital Address"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="GA-123-4567"
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Contact & Review */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
                className="space-y-6"
              >
                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Contact Information</h2>

                  <div className="space-y-6">
                    <Input
                      label="Contact Name"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Phone Number"
                        name="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+233 XX XXX XXXX"
                        required
                      />
                      <Input
                        label="Email Address"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Budget Range (Min) GH₵"
                        name="budgetMin"
                        type="number"
                        value={formData.budgetMin}
                        onChange={handleChange}
                        placeholder="100"
                      />
                      <Input
                        label="Budget Range (Max) GH₵"
                        name="budgetMax"
                        type="number"
                        value={formData.budgetMax}
                        onChange={handleChange}
                        placeholder="500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        name="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-3 text-gray-700 dark:text-slate-200 bg-white dark:bg-[#252b3b] border-2 border-gray-300 dark:border-[#2d3748] rounded-lg focus:border-blue-600 focus:outline-none"
                        placeholder="Any other information the service provider should know..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Review Summary */}
                <Card className="bg-gray-50 dark:bg-[#1a1f2e]">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Booking Summary</h2>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Service Provider</p>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{provider.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Service Type</p>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                          {formData.serviceType === 'Other (Specify)'
                            ? formData.customService
                            : formData.serviceType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Preferred Date & Time</p>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                          {formData.preferredDate} at {formData.preferredTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Location</p>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                          {formData.area}, {formData.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Urgency</p>
                        <p className="font-semibold text-gray-900 dark:text-slate-100 capitalize">
                          {formData.urgency}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex gap-4 mt-8"
          >
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Back
              </Button>
            )}
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                size="lg"
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                loading={loading}
                size="lg"
                className="flex-1"
              >
                <CheckCircle className="w-5 h-5" />
                Submit Request
              </Button>
            )}
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default BookingRequest;