// Replaced by src/data/mockData.js — backward-compat re-export stub.
export {
  getBookingsByClient,
  getBookingsByProvider,
  getBookingsByClientAndStatus,
  getBookingsByProviderAndStatus,
  getBookingById,
  calculateBookingStats,
  useClientBookings,
  useProviderBookings,
} from './mockData';

import { MASTER_BOOKINGS, populateBooking } from './mockData';
export const getAllBookings = () => MASTER_BOOKINGS.map(populateBooking);

// filterBookingsByPeriod — filters a pre-fetched booking list by time period.
// [API] In production, pass ?period=week|month|year|all as a query param instead.
export const filterBookingsByPeriod = (bookings, period = 'all') => {
  if (period === 'all') return bookings;

  const now  = new Date();
  const sod  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day  = 24 * 60 * 60 * 1000;

  const ranges = {
    today:   { start: sod,                                             end: new Date(sod.getTime() + day) },
    week:    { start: new Date(now.getTime() - 7 * day),              end: now },
    month:   { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) },
    quarter: { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0) },
    year:    { start: new Date(now.getFullYear(), 0, 1),              end: new Date(now.getFullYear(), 11, 31) },
  };

  const range = ranges[period];
  if (!range) return bookings;

  return bookings.filter(b => {
    const d = new Date(b.scheduledDate ?? b.date ?? b.createdAt);
    return d >= range.start && d <= range.end;
  });
};
