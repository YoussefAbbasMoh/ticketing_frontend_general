/**
 * Canonical helpers for conversation list preview (REST + Socket.IO + Postgres + Mongo).
 * All normalizers return new plain objects — safe for React state (no in-place mutation).
 */

const previewDebug =
  typeof import.meta !== 'undefined' &&
  String(import.meta.env?.VITE_DEBUG_CHAT_PREVIEW || '').toLowerCase() === 'true';

export function messageSenderIdFromPayload(msg) {
  if (!msg || typeof msg !== 'object') return '';
  const s = msg.sender;
  if (s && typeof s === 'object') return String(s._id ?? s.id ?? '').trim();
  if (msg.senderId != null) return String(msg.senderId).trim();
  if (typeof s === 'string') return String(s).trim();
  return '';
}

function toIsoTimestamp(raw) {
  if (raw == null) return new Date().toISOString();
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString();
  const d = new Date(typeof raw === 'number' ? raw : String(raw));
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/**
 * Single shape for `conversation.lastMessage` everywhere in the UI.
 * @param {object} raw — message from API or socket
 * @param {string} conversationId
 * @returns {object|null}
 */
export function normalizeLastMessageForList(raw, conversationId) {
  if (!raw || typeof raw !== 'object') return null;

  const mid = String(raw._id ?? raw.id ?? '').trim();
  const createdAt = toIsoTimestamp(raw.createdAt ?? raw.timestamp ?? raw.updatedAt);

  const sid = messageSenderIdFromPayload(raw);
  let sender = raw.sender;
  if (sender && typeof sender === 'object') {
    const bid = String(sender._id ?? sender.id ?? sid);
    sender = { ...sender, _id: bid, id: String(sender.id ?? sender._id ?? bid) };
  } else if (sid) {
    sender = {
      _id: sid,
      id: sid,
      name: raw.senderName,
      email: raw.senderEmail,
    };
  }

  const content = raw.content ?? raw.text ?? '';
  const out = {
    ...raw,
    _id: mid,
    id: mid || String(raw.id ?? ''),
    content,
    text: raw.text ?? raw.content ?? '',
    type: raw.type || 'text',
    sender: sender || null,
    createdAt,
  };
  if (raw.senderId != null) out.senderId = String(raw.senderId);
  if (conversationId != null && out.conversation == null) {
    out.conversation = String(conversationId);
  }
  return out;
}

export function conversationTimeMs(c) {
  const raw = c?.lastMessageAt ?? c?.lastMessage?.createdAt;
  if (raw == null) return 0;
  const n = raw instanceof Date ? raw.getTime() : Date.parse(String(raw));
  return Number.isFinite(n) ? n : 0;
}

/** New array instance, sorted by most recent activity. */
export function sortConversationsByRecent(convs) {
  if (!Array.isArray(convs)) return [];
  return [...convs].sort((a, b) => conversationTimeMs(b) - conversationTimeMs(a));
}

export function logChatPreviewDebug(label, payload) {
  if (!previewDebug) return;
  try {
    // eslint-disable-next-line no-console
    console.log(label, JSON.parse(JSON.stringify(payload)));
  } catch {
    // eslint-disable-next-line no-console
    console.log(label, payload);
  }
}
