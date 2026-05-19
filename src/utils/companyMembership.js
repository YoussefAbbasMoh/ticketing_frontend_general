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

export const normalizeCompanyRole = (role) => String(role || '').trim().toLowerCase();

/** Company role for a user in a specific workspace (prefer membership over global user.role). */
export const resolveCompanyMemberRole = (u, activeCompanyId) => {
  const cid =
    activeCompanyId != null && String(activeCompanyId).trim()
      ? String(activeCompanyId).trim()
      : String(u?.activeCompanyId || '').trim();
  if (cid && Array.isArray(u?.companies)) {
    const m = activeMembershipEntry(u, cid);
    if (m) {
      if (m.isOwner) return 'owner';
      if (m.companyRole) return normalizeCompanyRole(m.companyRole);
    }
  }
  if (u?.companyMemberRole) return normalizeCompanyRole(u.companyMemberRole);
  if (u?.companyIsOwner) return 'owner';
  return normalizeCompanyRole(u?.role || 'user');
};

export const membershipRoleFlags = (role) => {
  const companyRole = normalizeCompanyRole(role);
  return {
    companyRole,
    isOwner: companyRole === 'owner',
    companyMemberRole: companyRole,
    companyIsOwner: companyRole === 'owner',
  };
};

/** Keep companies[] in sync with role change for the active workspace. */
export const patchUserCompanyMembership = (user, activeCompanyId, role) => {
  if (!user) return user;
  const cid = String(activeCompanyId || '');
  const flags = membershipRoleFlags(role);
  const companies = (user.companies || []).map((entry) =>
    membershipCompanyId(entry) === cid ? { ...entry, ...flags } : entry
  );
  return {
    ...user,
    ...flags,
    role: flags.companyRole,
    companies,
  };
};

/** First workspace in list order, excluding `excludeCompanyId`. */
export const firstOtherWorkspaceId = (companies, excludeCompanyId) => {
  const exclude = excludeCompanyId != null ? String(excludeCompanyId) : '';
  for (const entry of companies || []) {
    const id = membershipCompanyId(entry);
    if (id && id !== exclude) return id;
  }
  return '';
};
