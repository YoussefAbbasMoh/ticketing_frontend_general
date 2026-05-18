/** Match backend membership company id resolution. */
export const membershipCompanyId = (entry) => {
  if (!entry) return '';
  const raw = entry.companyId ?? entry.company;
  if (raw == null) return '';
  if (typeof raw === 'object' && raw._id != null) return String(raw._id);
  return String(raw);
};

/** Display name from populated `company` object (not raw id string). */
export const companyNameFromMembership = (entry) => {
  if (entry?.companyName) return String(entry.companyName).trim();
  const c = entry?.company;
  if (c && typeof c === 'object' && c.name) return String(c.name).trim();
  if (typeof c === 'string' && c.length > 0 && !/^[a-f0-9]{24}$/i.test(c)) {
    return c.trim();
  }
  return '';
};

export const activeMembershipEntry = (user, activeCompanyId) => {
  const id = activeCompanyId != null ? String(activeCompanyId) : '';
  if (!id) return null;
  return (user?.companies || []).find((e) => membershipCompanyId(e) === id) || null;
};

export const activeCompanyDisplayName = (user, activeCompanyId) => {
  const m = activeMembershipEntry(user, activeCompanyId);
  return companyNameFromMembership(m);
};
