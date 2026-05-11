// [MOCK] Centralized mock data for frontend development.
// Replace all imports from this file with real API calls before production.
// All data structures mirror the expected API response shapes.

// ─── IDs ─────────────────────────────────────────────────────────────────────
export const CURRENT_PROVIDER_ID = 'PRV001';
export const CURRENT_CLIENT_ID   = 'CLT001';

// ─── Providers ───────────────────────────────────────────────────────────────
// [API] GET /providers/:id  →  shape of each object below
export const MOCK_PROVIDERS = [
  {
    id: 'PRV001',
    fullName: 'Cyprian Amponsah',
    occupation: 'Electrician',
    phone: '+233 24 111 0001',
    email: '36cyprianamponsah@gmail.com',
    bio: 'Licensed electrician with 8 years experience in residential and commercial wiring.',
    profileImage: null,
    location: {
      area: 'Osu',
      city: 'Accra',
      coordinates: { lat: 5.5557, lng: -0.1969 },
    },
    skills: ['Wiring', 'Panel Upgrades', 'CCTV Installation', 'Solar Setup', 'Security Lighting'],
    rating: { overall: 4.8, count: 127 },
    workExperience: { yearsActive: 8, totalJobs: 127 },
    availability: { status: 'available' },
    isVerified: true,
  },
  {
    id: 'PRV002',
    fullName: 'Yaw Mensah',
    occupation: 'Plumber',
    phone: '+233 24 111 0002',
    email: 'yaw.mensah@email.com',
    bio: 'Expert plumber specialising in leak detection, pipe work, and bathroom installations.',
    profileImage: null,
    location: {
      area: 'East Legon',
      city: 'Accra',
      coordinates: { lat: 5.6300, lng: -0.1500 },
    },
    skills: ['Leak Repair', 'Pipe Replacement', 'Bathroom Fitting', 'Water Heater Install', 'Drain Cleaning'],
    rating: { overall: 4.6, count: 89 },
    workExperience: { yearsActive: 6, totalJobs: 89 },
    availability: { status: 'busy' },
    isVerified: true,
  },
  {
    id: 'PRV003',
    fullName: 'Abena Darko',
    occupation: 'Painter',
    phone: '+233 24 111 0003',
    email: 'abena.darko@email.com',
    bio: 'Professional painter offering interior and exterior painting with 5-year workmanship guarantee.',
    profileImage: null,
    location: {
      area: 'Spintex',
      city: 'Accra',
      coordinates: { lat: 5.6580, lng: -0.1280 },
    },
    skills: ['Interior Painting', 'Exterior Painting', 'Texture Finish', 'Wallpaper Removal', 'Colour Consulting'],
    rating: { overall: 4.7, count: 74 },
    workExperience: { yearsActive: 5, totalJobs: 74 },
    availability: { status: 'available' },
    isVerified: false,
  },
];

// ─── Clients ──────────────────────────────────────────────────────────────────
// [API] GET /clients/:id  →  shape of each object below
export const MOCK_CLIENTS = [
  {
    id: 'CLT001',
    fullName: 'Cyprian',
    phone: '+233 24 222 0001',
    email: '63cyprian@gmail.com',
    location: { area: 'Osu', city: 'Accra' },
    profileImage: null,
  },
  {
    id: 'CLT002',
    fullName: 'Ama Serwaa',
    phone: '+233 24 222 0002',
    email: 'ama.serwaa@email.com',
    location: { area: 'East Legon', city: 'Accra' },
    profileImage: null,
  },
  {
    id: 'CLT003',
    fullName: 'Bishop Mensah',
    phone: '+233 24 222 0003',
    email: 'bishop.mensah@email.com',
    location: { area: 'Tema', city: 'Greater Accra' },
    profileImage: null,
  },
];

// ─── Locations ────────────────────────────────────────────────────────────────
// [DB] Stored on the booking row: address, area, city, coordinates
export const MOCK_LOCATIONS = {
  LOC001: { address: '14 Oxford Street', area: 'Osu',         city: 'Accra',          region: 'Greater Accra' },
  LOC002: { address: '7 Boundary Road',  area: 'East Legon',  city: 'Accra',          region: 'Greater Accra' },
  LOC003: { address: '22 Spintex Road',  area: 'Spintex',     city: 'Accra',          region: 'Greater Accra' },
  LOC004: { address: '5 Tema Station',   area: 'Tema',        city: 'Greater Accra',  region: 'Greater Accra' },
  LOC005: { address: '3 Ring Road',      area: 'Adabraka',    city: 'Accra',          region: 'Greater Accra' },
  LOC006: { address: '18 Akuafo Rd',     area: 'Legon',       city: 'Accra',          region: 'Greater Accra' },
};

// ─── Raw Bookings ─────────────────────────────────────────────────────────────
// [API] GET /bookings/:id  →  shape of each object below (before population)
// Status lifecycle: pending → confirmed → in-progress → completed → paid + reviewed / cancelled
const BOOKINGS_RAW = [
  // ── CLT001 ↔ PRV001 ─────────────────────────────────────────────────────

  {
    id: 'BK001',
    title: 'TV Wall Mounting',
    description: 'Mount a 65-inch TV on the living room wall. Need cable management too.',
    category: 'Electrical',
    status: 'pending',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-05-15',
    scheduledTime: '10:00 AM',
    quotedPrice: null,
    agreedPrice: null,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-08T09:00:00Z',
  },
  {
    id: 'BK002',
    title: 'Electrical Panel Upgrade',
    description: 'Replace outdated 60A panel with a new 200A service panel.',
    category: 'Electrical',
    status: 'confirmed',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-05-18',
    scheduledTime: '08:00 AM',
    quotedPrice: 1500,
    agreedPrice: 1500,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-06T11:00:00Z',
  },
  {
    id: 'BK003',
    title: 'Security Lights Installation',
    description: 'Install 4 motion-sensor security lights around the perimeter.',
    category: 'Electrical',
    status: 'confirmed',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-05-20',
    scheduledTime: '09:00 AM',
    quotedPrice: 750,
    agreedPrice: 750,
    // Provider requested a price adjustment — awaiting client approval
    priceAdjustment: {
      status: 'pending',
      newPrice: 950,
      reason: 'Two extra lights requested on-site. Additional materials required.',
      requestedAt: '2026-05-07T14:00:00Z',
    },
    cancellationRequest: null,
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-04T08:30:00Z',
  },
  {
    id: 'BK004',
    title: 'CCTV Camera Wiring',
    description: 'Wire and configure a 4-camera CCTV system for a 3-bedroom house.',
    category: 'Electrical',
    status: 'in-progress',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-05-08',
    scheduledTime: '07:30 AM',
    quotedPrice: 950,
    agreedPrice: 950,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'BK005',
    title: 'Ceiling Fan Installation',
    description: 'Install two ceiling fans in master and guest bedrooms.',
    category: 'Electrical',
    status: 'in-progress',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-05-07',
    scheduledTime: '02:00 PM',
    quotedPrice: 160,
    agreedPrice: 160,
    priceAdjustment: null,
    cancellationRequest: null,
    // Provider has marked job done — waiting for client confirmation
    completionRequest: {
      status: 'pending',
      requestedBy: 'provider',
      requestedAt: '2026-05-07T17:00:00Z',
    },
    payment: null,
    rating: null,
    createdAt: '2026-04-28T09:00:00Z',
  },
  {
    id: 'BK006',
    title: 'Power Socket Replacement',
    description: 'Replace 6 faulty power sockets throughout the house.',
    category: 'Electrical',
    status: 'completed',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-04-25',
    scheduledTime: '10:00 AM',
    quotedPrice: 110,
    agreedPrice: 110,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: { status: 'confirmed', confirmedAt: '2026-04-25T13:00:00Z' },
    payment: {
      status: 'paid',
      amount: 110,
      platformFee: Math.round(110 * 0.18),
      providerReceives: Math.round(110 * 0.82),
      method: 'MTN Mobile Money',
      transactionId: 'TXN-SOCK-006',
      paidAt: '2026-04-25T13:30:00Z',
    },
    rating: { score: 5, comment: 'Fast, clean, and professional. Highly recommend!', reviewedAt: '2026-04-25T14:00:00Z' },
    createdAt: '2026-04-22T08:00:00Z',
  },
  {
    id: 'BK007',
    title: 'Bathroom Exhaust Fan Installation',
    description: 'Install an exhaust fan in the master bathroom.',
    category: 'Electrical',
    status: 'completed',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-04-20',
    scheduledTime: '11:00 AM',
    quotedPrice: 200,
    agreedPrice: 200,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: { status: 'confirmed', confirmedAt: '2026-04-20T14:00:00Z' },
    // Completed but payment not yet collected (e.g. agreed to pay in person later)
    payment: { status: 'unpaid', amount: 200 },
    rating: null,
    createdAt: '2026-04-17T07:00:00Z',
  },
  {
    id: 'BK008',
    title: 'Gate Electrical Wiring',
    description: 'Wire an automatic sliding gate motor.',
    category: 'Electrical',
    status: 'cancelled',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-04-10',
    scheduledTime: '09:00 AM',
    quotedPrice: 600,
    agreedPrice: null,
    priceAdjustment: null,
    cancellationRequest: {
      status: 'approved',
      requestedBy: 'client',
      reason: 'Changed my mind — going with a manual gate instead.',
      requestedAt: '2026-04-08T10:00:00Z',
    },
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'BK009',
    title: 'Kitchen Exhaust Fan Repair',
    description: 'Diagnose and repair a noisy kitchen exhaust fan.',
    category: 'Electrical',
    status: 'pending',
    clientId: 'CLT001',
    providerId: 'PRV001',
    locationId: 'LOC001',
    scheduledDate: '2026-05-22',
    scheduledTime: '01:00 PM',
    quotedPrice: null,
    agreedPrice: null,
    priceAdjustment: null,
    // Client requested cancellation — awaiting provider acknowledgement
    cancellationRequest: {
      status: 'pending',
      requestedBy: 'client',
      reason: 'Found a local repair shop that can fix it today.',
      requestedAt: '2026-05-08T08:00:00Z',
    },
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-07T16:00:00Z',
  },

  // ── CLT002 ↔ PRV002 ─────────────────────────────────────────────────────
  {
    id: 'BK010',
    title: 'Kitchen Sink Leak Repair',
    description: 'Fix a persistent drip under the kitchen sink and replace the waste trap.',
    category: 'Plumbing',
    status: 'completed',
    clientId: 'CLT002',
    providerId: 'PRV002',
    locationId: 'LOC002',
    scheduledDate: '2026-04-30',
    scheduledTime: '10:00 AM',
    quotedPrice: 200,
    agreedPrice: 200,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: { status: 'confirmed', confirmedAt: '2026-04-30T12:00:00Z' },
    payment: {
      status: 'paid',
      amount: 200,
      platformFee: Math.round(200 * 0.18),
      providerReceives: Math.round(200 * 0.82),
      method: 'Vodafone Cash',
      transactionId: 'TXN-SINK-010',
      paidAt: '2026-04-30T12:30:00Z',
    },
    rating: { score: 4, comment: 'Great job. Came on time and was very tidy.', reviewedAt: '2026-04-30T13:00:00Z' },
    createdAt: '2026-04-27T09:00:00Z',
  },

  // ── CLT002 ↔ PRV003 ─────────────────────────────────────────────────────
  {
    id: 'BK011',
    title: 'Bedroom Interior Painting',
    description: 'Paint master and two guest bedrooms. Client supplying paint.',
    category: 'Painting',
    status: 'confirmed',
    clientId: 'CLT002',
    providerId: 'PRV003',
    locationId: 'LOC002',
    scheduledDate: '2026-05-19',
    scheduledTime: '08:00 AM',
    quotedPrice: 1000,
    agreedPrice: 1000,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-05T14:00:00Z',
  },

  // ── CLT003 ↔ PRV002 ─────────────────────────────────────────────────────
  {
    id: 'BK012',
    title: 'Bathroom Pipe Replacement',
    description: 'Replace corroded pipes in the main bathroom and reseal fixtures.',
    category: 'Plumbing',
    status: 'in-progress',
    clientId: 'CLT003',
    providerId: 'PRV002',
    locationId: 'LOC004',
    scheduledDate: '2026-05-08',
    scheduledTime: '09:00 AM',
    quotedPrice: 520,
    agreedPrice: 520,
    priceAdjustment: null,
    cancellationRequest: null,
    completionRequest: null,
    payment: null,
    rating: null,
    createdAt: '2026-05-03T11:00:00Z',
  },
];

// ─── populateBooking ──────────────────────────────────────────────────────────
// Joins a raw booking with its provider, client, and location objects.
// [API] In production this data arrives pre-joined from GET /bookings/:id
export const populateBooking = (booking) => {
  const p   = MOCK_PROVIDERS.find(x => x.id === booking.providerId);
  const c   = MOCK_CLIENTS.find(x => x.id === booking.clientId);
  const loc = MOCK_LOCATIONS[booking.locationId];

  return {
    ...booking,
    date:  booking.scheduledDate,
    time:  booking.scheduledTime,
    price: booking.agreedPrice ?? booking.quotedPrice ?? 0,
    // Flatten rating to a number for all existing display code (star loops, "{n}.0" strings).
    // Full review data is available via ratingDetails.
    rating:        booking.rating?.score ?? null,
    ratingDetails: booking.rating ?? null,
    provider: p ? {
      id:         p.id,
      name:       p.fullName,
      profession: p.occupation,
      phone:      p.phone,
      email:      p.email,
      rating:     p.rating.overall,
    } : null,
    client: c ? {
      id:    c.id,
      name:  c.fullName,
      phone: c.phone,
      email: c.email,
    } : null,
    location: loc ?? null,
  };
};

// ─── Query Utilities ──────────────────────────────────────────────────────────
// [API] Each function below maps to a real API endpoint — see inline comments.

/** [API] GET /bookings?clientId={id}  → BookingList */
export const getBookingsByClient = (clientId) =>
  BOOKINGS_RAW.filter(b => b.clientId === clientId).map(populateBooking);

/** [API] GET /bookings?providerId={id}  → BookingList */
export const getBookingsByProvider = (providerId) =>
  BOOKINGS_RAW.filter(b => b.providerId === providerId).map(populateBooking);

/** [API] GET /bookings?clientId={id}&status={status}  → BookingList */
export const getBookingsByClientAndStatus = (clientId, status) =>
  BOOKINGS_RAW.filter(b => b.clientId === clientId && b.status === status).map(populateBooking);

/** [API] GET /bookings?providerId={id}&status={status}  → BookingList */
export const getBookingsByProviderAndStatus = (providerId, status) =>
  BOOKINGS_RAW.filter(b => b.providerId === providerId && b.status === status).map(populateBooking);

/** [API] GET /bookings/:id  → Booking */
export const getBookingById = (id) => {
  const b = BOOKINGS_RAW.find(x => x.id === id);
  return b ? populateBooking(b) : null;
};

/**
 * [API] GET /providers/:id/stats  → ProviderStats
 * Computes summary stats from a populated booking list.
 */
export const calculateBookingStats = (bookings) => {
  const completed = bookings.filter(b => b.status === 'completed');
  const totalEarnings = completed.reduce((sum, b) => sum + (b.agreedPrice ?? 0), 0);
  const ratings = completed.filter(b => b.rating?.score).map(b => b.rating.score);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : 'N/A';

  const pending    = bookings.filter(b => b.status === 'pending').length;
  const confirmed  = bookings.filter(b => b.status === 'confirmed').length;
  const inProgress = bookings.filter(b => b.status === 'in-progress').length;

  return {
    total:      bookings.length,
    completed:  completed.length,
    pending,
    confirmed,
    inProgress,
    cancelled:  bookings.filter(b => b.status === 'cancelled').length,
    totalEarnings,
    avgRating,
    // Aliases used by dashboard and history pages
    active:         pending + confirmed + inProgress,
    totalRevenue:   totalEarnings,
    completionRate: bookings.length > 0
      ? Math.round((completed.length / bookings.length) * 100)
      : 0,
  };
};

/**
 * [API] GET /providers/nearby?lat={lat}&lng={lng}&radius={km}  → Provider[]
 * Haversine distance filter — replace with PostGIS ST_DWithin in production.
 */
export const getProvidersNearLocation = (lat, lng, radiusKm = 10) => {
  const toRad = deg => deg * Math.PI / 180;
  return MOCK_PROVIDERS.filter(p => {
    const { lat: pLat, lng: pLng } = p.location.coordinates;
    const dLat = toRad(pLat - lat);
    const dLon = toRad(pLng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(pLat)) * Math.sin(dLon / 2) ** 2;
    const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distKm <= radiusKm;
  });
};

/**
 * [API] GET /providers/:id  → Provider
 */
export const getProviderById = (id) => MOCK_PROVIDERS.find(p => p.id === id) ?? null;

/**
 * [API] GET /clients/:id  → Client
 */
export const getClientById = (id) => MOCK_CLIENTS.find(c => c.id === id) ?? null;

// ─── React Hooks ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

/** [API] Wraps getBookingsByClient with loading/error state. */
export const useClientBookings = (clientId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    try {
      setBookings(getBookingsByClient(clientId));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  return { bookings, loading, error };
};

/** [API] Wraps getBookingsByProvider with loading/error state. */
export const useProviderBookings = (providerId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    try {
      setBookings(getBookingsByProvider(providerId));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  return { bookings, loading, error };
};

// ─── Legacy Alias Exports ─────────────────────────────────────────────────────
// These aliases preserve backward compatibility for old import paths.
// Old files (mockBookings.js, mockProfiles.js, etc.) re-export from here.

export const MOCK_USERS = {
  providers: Object.fromEntries(MOCK_PROVIDERS.map(p => [p.id, p])),
  clients:   Object.fromEntries(MOCK_CLIENTS.map(c => [c.id, c])),
};

export const mockProviders = MOCK_PROVIDERS;
export const mockClients   = MOCK_CLIENTS;

export const MOCK_CURRENT_CLIENT   = MOCK_CLIENTS.find(c => c.id === CURRENT_CLIENT_ID);
export const MOCK_CURRENT_PROVIDER = MOCK_PROVIDERS.find(p => p.id === CURRENT_PROVIDER_ID);

export const MASTER_BOOKINGS = BOOKINGS_RAW;

