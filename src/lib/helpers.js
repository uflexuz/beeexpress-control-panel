export function formatSum(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return Number(amount).toLocaleString('uz-UZ') + ' сўм';
}

export function formatCompact(amount) {
  if (amount == null || isNaN(amount)) return '—';
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' mlrd';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + ' mln';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'K';
  return String(amount);
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hozirgina';
  if (mins < 60) return `${mins} min oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  return `${days} kun oldin`;
}

export const STATUS_MAP = {
  created:          { label: 'Yangi',            color: '#5B8DEF', bg: '#EBF1FD' },
  accepted:         { label: 'Qabul qilindi',    color: '#5B8DEF', bg: '#EBF1FD' },
  preparing:        { label: 'Tayyorlanmoqda',   color: '#FF9500', bg: '#FFF5E6' },
  ready:            { label: 'Tayyor',           color: '#00B33C', bg: '#E6F9ED' },
  courier_assigned: { label: 'Kuryer topildi',   color: '#5B8DEF', bg: '#EBF1FD' },
  picked_up:        { label: 'Olingan',          color: '#FF9500', bg: '#FFF5E6' },
  on_the_way:       { label: 'Yo\'lda',          color: '#00B33C', bg: '#E6F9ED' },
  delivered:        { label: 'Yetkazildi',       color: '#00B33C', bg: '#E6F9ED' },
  cancelled:        { label: 'Bekor qilindi',    color: '#FA3E2C', bg: '#FFF0EE' },
  failed:           { label: 'Muvaffaqiyatsiz',  color: '#FA3E2C', bg: '#FFF0EE' },
};

export function getStatus(status) {
  return STATUS_MAP[status] || { label: status, color: '#999', bg: '#F5F4F2' };
}

export const RESTAURANT_STATUS = {
  active:    { label: 'Faol',       color: '#00B33C', bg: '#E6F9ED' },
  pending:   { label: 'Kutilmoqda', color: '#FF9500', bg: '#FFF5E6' },
  suspended: { label: 'To\'xtatilgan', color: '#FA3E2C', bg: '#FFF0EE' },
};

export const COURIER_STATUS = {
  online:  { label: 'Online',  color: '#00B33C', bg: '#E6F9ED' },
  busy:    { label: 'Band',    color: '#FF9500', bg: '#FFF5E6' },
  offline: { label: 'Offline', color: '#9E9B98', bg: '#F5F4F2' },
};

export const VEHICLE_MAP = {
  motorcycle: '🏍️ Mototsikl',
  bicycle:    '🚲 Velosiped',
  car:        '🚗 Avtomobil',
};

export const PAYOUT_STATUS = {
  completed: { label: 'To\'langan',  color: '#00B33C', bg: '#E6F9ED' },
  pending:   { label: 'Kutilmoqda', color: '#FF9500', bg: '#FFF5E6' },
  failed:    { label: 'Xatolik',    color: '#FA3E2C', bg: '#FFF0EE' },
};
