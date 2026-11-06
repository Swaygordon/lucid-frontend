export const isCurrentVerifiedCredential = (credential, serviceId, today = new Date().toISOString().slice(0, 10)) => Boolean(
  credential?.credentialTypeId && credential.serviceId === serviceId && credential.verificationStatus === 'verified'
  && (!credential.expiresAt || credential.expiresAt >= today) && !credential.retiredAt
);

export const rankCredentialMatch = (candidates, serviceId, preferVerifiedCredential) => [...(candidates || [])].sort((left, right) => {
  if (!preferVerifiedCredential) return 0;
  const leftMatch = (left.credentials || []).some(credential => isCurrentVerifiedCredential(credential, serviceId));
  const rightMatch = (right.credentials || []).some(credential => isCurrentVerifiedCredential(credential, serviceId));
  return Number(rightMatch) - Number(leftMatch);
});

// Keep form strings convenient for editing, but send stable typed/null values to the API.
export const normalizeCredentialForSave = credential => ({
  id: credential.id,
  credentialTypeId: credential.credentialTypeId || null,
  otherTypeLabel: credential.credentialTypeId === 'other' ? (credential.otherTypeLabel || '').trim() || null : null,
  serviceId: credential.serviceId || null,
  issuer: (credential.issuer || '').trim() || null,
  level: (credential.level || '').trim() || null,
  certificateNumber: (credential.certificateNumber || credential.reference || '').trim() || null,
  issuedYear: credential.issuedYear ? Number(credential.issuedYear) : null,
  expiresAt: credential.expiresAt || null,
  evidenceObjectKey: credential.evidenceObjectKey || null,
});

const TITLES = {
  'ctvet-proficiency-i': 'CTVET National Proficiency I',
  'ctvet-proficiency-ii': 'CTVET National Proficiency II',
  'ctvet-national-certificate-i': 'CTVET National Certificate I',
  'ctvet-national-certificate-ii': 'CTVET National Certificate II',
  'ctvet-master-craft-person': 'CTVET-certified Master Craft Person',
  'ghana-apprenticeship-certificate': 'Ghana Apprenticeship Programme certificate',
  'nvti-trade-test': 'NVTI trade test certificate',
  'nabtex-technician': 'NaBTEX Technician or Advanced Technician certificate',
  'hnd-btech': 'HND or BTech',
  'trade-licence': 'Trade-specific licence',
  'trade-association': 'Trade association membership',
  'apprenticeship-no-certificate': 'Apprenticeship-trained, no certificate',
  other: 'Other qualification',
};

export const projectClientCredential = (credential, serviceId) => {
  if (!isCurrentVerifiedCredential(credential, serviceId)) return null;
  return { title: TITLES[credential.credentialTypeId] || 'Trade credential', badge: 'Verified by LUCID' };
};
