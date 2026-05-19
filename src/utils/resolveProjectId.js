/**
 * Ticket/API may return project as an id string or a populated `{ _id, id, projectId }` object.
 */
export function resolveProjectId(projectRef) {
  if (projectRef == null) return '';
  if (typeof projectRef === 'string' || typeof projectRef === 'number') {
    const s = String(projectRef).trim();
    if (!s || s === '[object Object]') return '';
    return s;
  }
  if (typeof projectRef === 'object') {
    const id = projectRef._id ?? projectRef.id ?? projectRef.projectId;
    return id != null ? String(id) : '';
  }
  return '';
}
