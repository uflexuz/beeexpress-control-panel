import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard, ScrollText, RotateCcw, RefreshCw, User, Hash, FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatSum, formatDateTime, statusLabel } from '../lib/helpers';
import s from './Finance.module.css';

/* ---------------------------------------------------------------------------
 * Moliya bo'limi — 3 tab:
 *   1) To'lovlar  — GET /admin/payments  (order, provider, summa, status)
 *   2) Audit      — GET /admin/audits    (harakatlar jurnali)
 *   3) Qaytarish  — POST /admin/wallet/refund (user_id, summa, order_id?, izoh)
 * Ro'yxatlar: {data:[...], meta} yoki oddiy massiv — defensiv o'qiladi.
 * Live yangilanish uchun aktiv list tabida 15s polling (unmount'da tozalanadi).
 * ------------------------------------------------------------------------- */

const TABS = [
  { key: 'payments', label: "To'lovlar", icon: CreditCard },
  { key: 'audits',   label: 'Audit',     icon: ScrollText },
  { key: 'refund',   label: 'Qaytarish', icon: RotateCcw },
];

const POLL_MS = 15000;

// To'lov holati -> status-pill variant (defensiv, noma'lum -> neutral).
const PAY_PILL = {
  paid: '--delivered', completed: '--delivered', success: '--delivered', succeeded: '--delivered',
  pending: '--pending', processing: '--pending', created: '--pending', waiting: '--pending',
  refunded: '--delivering', partial_refund: '--delivering',
  failed: '--cancelled', cancelled: '--cancelled', canceled: '--cancelled', declined: '--cancelled',
};

function cap(v) {
  if (!v) return '—';
  const str = String(v);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Ro'yxat yuklovchi hook (loading / error / data + sokin poll refresh)
// ---------------------------------------------------------------------------
function useListLoader(fetchFn) {
  const [state, setState] = useState({ loading: true, error: null, data: [] });
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const res = await fetchRef.current();
      const list = Array.isArray(res)
        ? res
        : res && Array.isArray(res.data)
          ? res.data
          : [];
      setState({ loading: false, error: null, data: list });
    } catch (e) {
      if (silent) {
        // Poll xatosi — mavjud ma'lumotni saqlaymiz, foydalanuvchini bezovta qilmaymiz.
        setState((p) => ({ ...p, loading: false }));
      } else {
        setState((p) => ({
          ...p,
          loading: false,
          error: (e && e.message) || 'Ma\'lumotni yuklab bo\'lmadi.',
        }));
      }
    }
  }, []);

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { ...state, reload: () => load(false) };
}

// ---------------------------------------------------------------------------
// Umumiy holat bloklari
// ---------------------------------------------------------------------------
function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-state__emoji">⚠️</div>
      <div className="empty-state__title">Xatolik yuz berdi</div>
      <div className="empty-state__text">{message}</div>
      <button className="btn btn-primary" onClick={onRetry}>Qayta urinish</button>
    </div>
  );
}

function ListHeader({ title, count, onRefresh, loading }) {
  return (
    <div className={s.listHead}>
      <div className={s.listTitle}>
        {title}
        {count != null && <span className={s.count}>{count}</span>}
      </div>
      <button className="btn-icon" onClick={onRefresh} title="Yangilash" disabled={loading}>
        <RefreshCw size={18} className={loading ? s.spin : undefined} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1) To'lovlar
// ---------------------------------------------------------------------------
function PaymentsTab() {
  const { loading, error, data, reload } = useListLoader(
    useCallback(() => api.admin.payments({ limit: 50 }), []),
  );

  if (loading && data.length === 0) {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Buyurtma</th><th>Provayder</th>
              <th className="td-right">Summa</th><th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 4 }).map((__, j) => (
                  <td key={j}><div className="skeleton skeleton-text" style={{ width: j === 0 ? '60%' : '80%' }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__emoji">💳</div>
          <div className="empty-state__title">To'lovlar yo'q</div>
          <div className="empty-state__text">Hozircha to'lovlar ro'yxati bo'sh. Yangi to'lovlar shu yerda ko'rinadi.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.block}>
      <ListHeader title="To'lovlar" count={data.length} onRefresh={reload} loading={loading} />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Buyurtma</th>
              <th>Provayder</th>
              <th className="td-right">Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => {
              const st = statusLabel(p.status);
              const variant = PAY_PILL[String(p.status || '').toLowerCase()] || '--neutral';
              const orderId = p.order_id ?? p.order?.id;
              return (
                <tr key={p.id ?? p.provider_payment_id ?? i}>
                  <td>
                    <span className={s.orderRef}>
                      {orderId != null ? `#${orderId}` : '—'}
                    </span>
                    {p.provider_payment_id && (
                      <div className={s.subRef}>{p.provider_payment_id}</div>
                    )}
                  </td>
                  <td>{cap(p.provider)}</td>
                  <td className="td-right td-mono">{formatSum(p.amount)}</td>
                  <td>
                    <span className={`status-pill status-pill${variant}`}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) Audit — shakl noma'lum, defensiv o'qiladi
// ---------------------------------------------------------------------------
function auditActor(a) {
  return (
    a.user?.name || a.causer?.name || a.actor?.name || a.admin?.name ||
    a.user_name || (a.user_id != null ? `Foydalanuvchi #${a.user_id}` :
    a.causer_id != null ? `#${a.causer_id}` : '—')
  );
}
function auditAction(a) {
  return a.event || a.action || a.type || a.log_name || a.activity || 'Amal';
}
function auditTarget(a) {
  const t = a.auditable_type || a.subject_type || a.model_type || a.entity_type || a.model;
  const id = a.auditable_id ?? a.subject_id ?? a.model_id ?? a.entity_id;
  const short = t ? String(t).split('\\').pop() : null;
  if (short && id != null) return `${short} #${id}`;
  if (short) return short;
  if (id != null) return `#${id}`;
  return '';
}
function auditWhen(a) {
  return a.created_at || a.createdAt || a.timestamp || a.date || a.logged_at || a.time;
}
function auditDesc(a) {
  return a.description || a.message || a.note || a.details || '';
}

function AuditsTab() {
  const { loading, error, data, reload } = useListLoader(
    useCallback(() => api.admin.audits({ limit: 50 }), []),
  );

  if (loading && data.length === 0) {
    return (
      <div className={s.auditList}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.auditRow}>
            <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '45%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__emoji">📋</div>
          <div className="empty-state__title">Audit yozuvlari yo'q</div>
          <div className="empty-state__text">Tizimdagi harakatlar shu yerda qayd etiladi. Hozircha yozuv yo'q.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.block}>
      <ListHeader title="Audit jurnali" count={data.length} onRefresh={reload} loading={loading} />
      <div className={s.auditList}>
        {data.map((a, i) => {
          const target = auditTarget(a);
          const desc = auditDesc(a);
          return (
            <div key={a.id ?? i} className={s.auditRow}>
              <div className={s.auditIco}><ScrollText size={17} /></div>
              <div className={s.auditBody}>
                <div className={s.auditTop}>
                  <span className={s.auditAction}>{cap(auditAction(a))}</span>
                  {target && <span className={s.auditTarget}>{target}</span>}
                </div>
                {desc && <div className={s.auditDesc}>{desc}</div>}
                <div className={s.auditMeta}>
                  <span className={s.auditActor}><User size={13} /> {auditActor(a)}</span>
                  <span className={s.auditWhen}>{formatDateTime(auditWhen(a))}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Qaytarish (refund) — POST /admin/wallet/refund, tasdiq bilan
// ---------------------------------------------------------------------------
function RefundTab() {
  const [form, setForm] = useState({ user_id: '', amount: '', order_id: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok:boolean, message:string }

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setResult(null);
  };

  const amountNum = Number(form.amount);
  const amountValid = form.amount !== '' && !isNaN(amountNum) && amountNum > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!form.user_id || Number(form.user_id) <= 0) {
      setResult({ ok: false, message: 'Foydalanuvchi ID kiritilishi shart.' });
      return;
    }
    if (!amountValid) {
      setResult({ ok: false, message: "Summa 0 dan katta bo'lishi kerak." });
      return;
    }

    const ok = window.confirm(
      `${formatSum(amountNum)} summa #${form.user_id} foydalanuvchi hamyoniga qaytarilsinmi?`,
    );
    if (!ok) return;

    const payload = { user_id: Number(form.user_id), amount: amountNum };
    if (form.order_id) payload.order_id = Number(form.order_id);
    if (form.note.trim()) payload.note = form.note.trim();

    setSubmitting(true);
    try {
      await api.admin.walletRefund(payload);
      setResult({ ok: true, message: `${formatSum(amountNum)} muvaffaqiyatli qaytarildi.` });
      setForm({ user_id: '', amount: '', order_id: '', note: '' });
    } catch (err) {
      setResult({ ok: false, message: (err && err.message) || 'Qaytarishda xatolik yuz berdi.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.refundWrap}>
      <form className="card" onSubmit={handleSubmit}>
        <div className={s.refundHead}>
          <div className={s.refundIco}><RotateCcw size={20} /></div>
          <div>
            <h2 className={s.refundTitle}>Mablag'ni qaytarish</h2>
            <p className="muted">Foydalanuvchi hamyoniga summa qaytariladi.</p>
          </div>
        </div>

        {result && (
          <div className={`${s.alert} ${result.ok ? s.alertOk : s.alertErr}`}>
            {result.message}
          </div>
        )}

        <div className={s.formGrid}>
          <label className="field">
            <span className={`field__label ${s.lbl}`}><User size={14} /> Foydalanuvchi ID *</span>
            <input
              className="input"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Masalan: 128"
              value={form.user_id}
              onChange={(e) => set('user_id', e.target.value)}
            />
          </label>

          <label className="field">
            <span className={`field__label ${s.lbl}`}><Hash size={14} /> Buyurtma ID (ixtiyoriy)</span>
            <input
              className="input"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Masalan: 5042"
              value={form.order_id}
              onChange={(e) => set('order_id', e.target.value)}
            />
          </label>

          <label className="field">
            <span className={`field__label ${s.lbl}`}><CreditCard size={14} /> Summa (so'm) *</span>
            <input
              className="input"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Masalan: 25000"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
            {amountValid && <span className="field__hint">{formatSum(amountNum)}</span>}
          </label>

          <label className={`field ${s.full}`}>
            <span className={`field__label ${s.lbl}`}><FileText size={14} /> Izoh (ixtiyoriy)</span>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Qaytarish sababi..."
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
            />
          </label>
        </div>

        <div className={s.formActions}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting || !form.user_id || !amountValid}
          >
            <RotateCcw size={18} />
            {submitting ? 'Qaytarilmoqda...' : 'Qaytarishni tasdiqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sahifa
// ---------------------------------------------------------------------------
export default function Finance() {
  const [tab, setTab] = useState('payments');

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className="page-title">Moliya</h1>
      </div>

      <div className={s.tabBar}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`chip ${tab === key ? 'is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'payments' && <PaymentsTab />}
      {tab === 'audits' && <AuditsTab />}
      {tab === 'refund' && <RefundTab />}
    </div>
  );
}
