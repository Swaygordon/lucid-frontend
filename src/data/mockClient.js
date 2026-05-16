// Centralized mock data for the client role.
// Used by user_info.jsx (Account Settings) and client_account_overview.jsx.
// When wiring real data, replace with GET /users/me on mount.

export const MOCK_CLIENT = {
  id:          'CLIENT-001',
  name:        'Gabriel Gordon-Mensah',
  firstName:   'Gabriel',
  lastName:    'Gordon-Mensah',
  otherName:   '',
  email:       'gordongabriel2004@gmail.com',
  phone:       '+233 24 123 4567',
  dateOfBirth: '2004-01-15',
  gender:      'male',
  location:    'Achimota, Accra',
  address:     '123 Main Street',
  city:        'Accra',
  region:      'Greater Accra',
  area:        'Achimota',
  postalCode:  'GA-123-4567',
  avatarUrl:   null,
};
