import profileImg from "../assets/profile.svg";

export const PAYMENT_LABELS = { mobile: 'Mobile Money', bank: 'Bank Transfer' };

export const formatTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

// Single source of truth for both user_Profile.jsx and general_profilePage.jsx.
// Shape mirrors edit.jsx state exactly so the display always reflects what was "saved".
export const MOCK_PROVIDER = {
  id:             'PROV-101',
  name:           'Cyprian Amponsah',
  firstName:      'Cyprian',
  lastName:       'Amponsah',
  otherName:      '',
  email:          'cyprian.amponsah@example.com',
  phone:          '+233 20 456 7890',
  dateOfBirth:    '1985-03-20',
  gender:         'male',
  occupation:     'Electrician',
  location:       'Achimota, Accra',
  address:        '14 Achimota Road',
  city:           'Accra',
  region:         'Greater Accra',
  area:           'Achimota',
  postalCode:     'GA-045-2300',
  description:    'Professional electrician with over 8 years of experience installing and maintaining electrical systems. I specialise in residential and commercial wiring, troubleshooting, and safety compliance.',
  skills:         ['Electrical Installation', 'Circuit Troubleshooting', 'Safety Compliance'],
  certifications: ['Certified Electrician', 'OSHA Safety Trainer'],
  languages:      ['English', 'Twi', 'Ga'],
  workExperience: 8,
  paymentMethods: ['mobile', 'bank'],
  categories:     ['Home Repairs & Maintenance', 'Skilled Trades'],
  employees:      14,
  rating:         5.0,
  reviewCount:    1,
  hiredCount:     32,
  successRate:    98,
  avatarUrl:      profileImg,
  heroUrl:        null,
  // Mirrors edit.jsx state shape
  selectedDays:  { weekdays: true, weekend: false, custom: false },
  weekdaysTime:  { start: '09:00', end: '17:00' },
  weekendTime:   { start: '10:00', end: '16:00' },
  customDays: {
    sunday:    { selected: false, start: '09:00', end: '17:00' },
    monday:    { selected: false, start: '09:00', end: '17:00' },
    tuesday:   { selected: false, start: '09:00', end: '17:00' },
    wednesday: { selected: false, start: '09:00', end: '17:00' },
    thursday:  { selected: false, start: '09:00', end: '17:00' },
    friday:    { selected: false, start: '09:00', end: '17:00' },
    saturday:  { selected: false, start: '09:00', end: '17:00' },
  },
  portfolioUrls: [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format',
    'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format',
  ],
};
