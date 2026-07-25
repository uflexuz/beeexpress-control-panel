/**
 * Bee Express — Control Panel format va status yordamchilari.
 *
 * Pul, sana, telefon formatlash + buyurtma / restoran / kuryer / to'lov
 * statuslari uchun o'zbekcha nomlar va ranglar.
 */

// ---------------------------------------------------------------------------
// Pul
// ---------------------------------------------------------------------------

/**
 * Summani so'mda formatlaydi: `1 234 567 so'm`.
 * @param {number|string|null} amount butun so'm (tiyin emas).
 * @returns {string}
 */
export function formatSum(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return Number(amount).toLocaleString('uz-UZ') + ' so\'m';
}

/**
 * Katta summani qisqartiradi: `1.2 mlrd`, `3.4 mln`, `56K`.
 * @param {number|string|null} amount
 * @returns {string}
 */
export function formatCompact(amount) {
  if (amount == null || isNaN(amount)) return '—';
  const n = Number(amount);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

// ---------------------------------------------------------------------------
// Sana / vaqt
// ---------------------------------------------------------------------------

/**
 * Vaqt: `14:05`.
 * @param {string|number|Date|null} dateStr
 * @returns {string}
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Sana: `24 iyul 2026`.
 * @param {string|number|Date|null} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Sana + vaqt: `24 iyul 2026, 14:05`.
 * @param {string|number|Date|null} dateStr
 * @returns {string}
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
}

/**
 * Nisbiy vaqt: `hozirgina`, `5 min oldin`, `2 soat oldin`, `3 kun oldin`.
 * @param {string|number|Date|null} dateStr
 * @returns {string}
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hozirgina';
  if (mins < 60) return `${mins} min oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  return `${days} kun oldin`;
}

// ---------------------------------------------------------------------------
// Telefon
// ---------------------------------------------------------------------------

/**
 * O'zbek telefon raqamini formatlaydi: `+998 90 123 45 67`.
 * `+998901234567`, `998901234567`, `901234567` kabi kirishlarni qabul qiladi.
 * Noto'g'ri uzunlikda asl qiymatni qaytaradi.
 * @param {string|number|null} phone
 * @returns {string}
 */
export function phoneFormat(phone) {
  if (!phone) return '—';
  let d = String(phone).replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  if (d.length !== 9) return String(phone);
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

// ---------------------------------------------------------------------------
// Status xaritalari (o'zbekcha nom + rang + fon)
// ---------------------------------------------------------------------------

/** Buyurtma statuslari. */
export const STATUS_MAP = {
  created:          { label: 'Yangi',            color: '#5B8DEF', bg: '#EBF1FD' },
  pending:          { label: 'Kutilmoqda',       color: '#FF9500', bg: '#FFF5E6' },
  accepted:         { label: 'Qabul qilindi',    color: '#5B8DEF', bg: '#EBF1FD' },
  preparing:        { label: 'Tayyorlanmoqda',   color: '#FF9500', bg: '#FFF5E6' },
  ready:            { label: 'Tayyor',           color: '#00B33C', bg: '#E6F9ED' },
  courier_assigned: { label: 'Kuryer topildi',   color: '#5B8DEF', bg: '#EBF1FD' },
  picked_up:        { label: 'Olingan',          color: '#FF9500', bg: '#FFF5E6' },
  on_the_way:       { label: 'Yo\'lda',          color: '#00B33C', bg: '#E6F9ED' },
  delivered:        { label: 'Yetkazildi',       color: '#00B33C', bg: '#E6F9ED' },
  completed:        { label: 'Yakunlandi',       color: '#00B33C', bg: '#E6F9ED' },
  cancelled:        { label: 'Bekor qilindi',    color: '#FA3E2C', bg: '#FFF0EE' },
  failed:           { label: 'Muvaffaqiyatsiz',  color: '#FA3E2C', bg: '#FFF0EE' },
};

/** Restoran (vendor) statuslari. `is_active` bool → active/suspended. */
export const RESTAURANT_STATUS = {
  active:    { label: 'Faol',           color: '#00B33C', bg: '#E6F9ED' },
  pending:   { label: 'Kutilmoqda',     color: '#FF9500', bg: '#FFF5E6' },
  suspended: { label: 'To\'xtatilgan',  color: '#FA3E2C', bg: '#FFF0EE' },
  blocked:   { label: 'Bloklangan',     color: '#FA3E2C', bg: '#FFF0EE' },
};

/** Kuryer holatlari. */
export const COURIER_STATUS = {
  online:  { label: 'Online',  color: '#00B33C', bg: '#E6F9ED' },
  busy:    { label: 'Band',    color: '#FF9500', bg: '#FFF5E6' },
  offline: { label: 'Offline', color: '#9E9B98', bg: '#F5F4F2' },
};

/** Transport turi (nom). Ikona kerak bo'lsa chaqiruvchi lucide-react ishlatadi. */
export const VEHICLE_MAP = {
  motorcycle: 'Mototsikl',
  bicycle:    'Velosiped',
  car:        'Avtomobil',
};

/** To'lov holatlari (payment_status / payment ro'yxati). */
export const PAYMENT_STATUS = {
  paid:     { label: 'To\'langan',   color: '#00B33C', bg: '#E6F9ED' },
  unpaid:   { label: 'To\'lanmagan', color: '#FF9500', bg: '#FFF5E6' },
  pending:  { label: 'Kutilmoqda',   color: '#FF9500', bg: '#FFF5E6' },
  refunded: { label: 'Qaytarilgan',  color: '#5B8DEF', bg: '#EBF1FD' },
  failed:   { label: 'Xatolik',      color: '#FA3E2C', bg: '#FFF0EE' },
  cancelled:{ label: 'Bekor qilindi',color: '#FA3E2C', bg: '#FFF0EE' },
};

/** To'lov (payout) statuslari. */
export const PAYOUT_STATUS = {
  completed: { label: 'To\'langan',  color: '#00B33C', bg: '#E6F9ED' },
  pending:   { label: 'Kutilmoqda',  color: '#FF9500', bg: '#FFF5E6' },
  failed:    { label: 'Xatolik',     color: '#FA3E2C', bg: '#FFF0EE' },
};

// Birlashgan xarita. Umumiy kalitlarda buyurtma (STATUS_MAP) semantikasi ustun
// bo'lishi uchun eng oxirida spread qilinadi.
const ALL_STATUS = {
  ...PAYMENT_STATUS,
  ...PAYOUT_STATUS,
  ...COURIER_STATUS,
  ...RESTAURANT_STATUS,
  ...STATUS_MAP,
};

const STATUS_FALLBACK = { label: '—', color: '#9E9B98', bg: '#F5F4F2' };

/**
 * Status kaliti bo'yicha o'zbekcha nom va ranglarni qaytaradi.
 * Barcha status turlari (buyurtma, restoran, kuryer, to'lov) bo'yicha qidiradi.
 * @param {string|null|undefined} status
 * @returns {{label:string, color:string, bg:string}}
 */
export function statusLabel(status) {
  if (!status) return STATUS_FALLBACK;
  const key = String(status).toLowerCase();
  return ALL_STATUS[key] || { ...STATUS_FALLBACK, label: String(status) };
}

/**
 * Buyurtma statusini qaytaradi (backward-compat alias — `statusLabel` bilan bir xil).
 * @param {string} status
 * @returns {{label:string, color:string, bg:string}}
 */
export function getStatus(status) {
  return statusLabel(status);
}
