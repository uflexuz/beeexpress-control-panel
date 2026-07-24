import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search, Store, MapPin, MoreVertical, Ban, CheckCircle,
  Wallet, Percent, X, RefreshCw, AlertCircle,
} from 'lucide-react';
import api from '../lib/api';
import { formatSum, phoneFormat, RESTAURANT_STATUS } from '../lib/helpers';
import s from './Restaurants.module.css';

/* ------------------------------------------------------------------ *
 * Yordamchi: vendor obyektidan maydonlarni himoyalangan tarzda o'qish.
 * Admin ro'yxati Vendor + VendorProfile'ni turli shaklda qaytarishi
 * mumkin — bir nechta ehtimoliy nom bo'yicha tekshiramiz.
 * ------------------------------------------------------------------ */
function isActive(r) {
  if (r.is_active === undefined || r.is_active === null) {
    if (r.status) return String(r.status).toLowerCase() === 'active';
    if (r.blocked_at) return false;
    return true;
  }
  return !!r.is_active;
}

function getCommission(r) {
  const v =
    r.commission_percent ??
    r.commission_rate ??
    r.profile?.commission_percent ??
    r.vendor_profile?.commission_percent ??
    r.vendorProfile?.commission_percent;
  return v === undefined || v === null || v === '' ? null : Number(v);
}

function getBalance(r) {
  const v =
    r.balance ??
    r.profile?.balance ??
    r.vendor_profile?.balance ??
    r.vendorProfile?.balance ??
    r.wallet?.balance;
  return v === undefined || v === null || v === '' ? null : Number(v);
}

/* ------------------------------------------------------------------ *
 * Amallar menyusi (fixed pozitsiya — jadval overflow'i kesib qo'ymaydi)
 * ------------------------------------------------------------------ */
function ActionsMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuW = 232;
      const menuH = items.length * 44 + 12;
      let left = rect.right - menuW;
      if (left < 8) left = 8;
      let top = rect.bottom + 6;
      if (top + menuH > window.innerHeight - 8) top = rect.top - menuH - 6;
      setPos({ top, left });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button ref={btnRef} className={s.menuBtn} onClick={toggle} aria-label="Amallar">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className={s.menuOverlay} onClick={() => setOpen(false)}>
          <div
            className={s.menu}
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it, i) => (
              <button
                key={i}
                className={`${s.menuItem} ${it.danger ? s.menuItemDanger : ''}`}
                onClick={() => { setOpen(false); it.onClick(); }}
              >
                {it.icon}
                <span>{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Bloklash / blokdan chiqarish tasdiq modali
 * ------------------------------------------------------------------ */
function ConfirmModal({ r, action, onClose, onDone, pushToast }) {
  const [submitting, setSubmitting] = useState(false);
  const block = action === 'block';

  const submit = async () => {
    setSubmitting(true);
    try {
      if (block) await api.admin.vendorBlock(r.id);
      else await api.admin.vendorUnblock(r.id);
      pushToast('success', block ? `${r.name} bloklandi` : `${r.name} blokdan chiqarildi`);
      onDone();
    } catch (e) {
      pushToast('error', e?.message || 'Amalni bajarib bo\'lmadi');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{block ? 'Restoranni bloklash' : 'Blokdan chiqarish'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className={s.confirmText}>
            {block ? (
              <><b>{r.name}</b> bloklanadi. Restoran mijozlarga ko'rinmay qoladi va
              yangi buyurtma qabul qila olmaydi. Davom etasizmi?</>
            ) : (
              <><b>{r.name}</b> qayta faollashtiriladi va buyurtma qabul qila boshlaydi.
              Davom etasizmi?</>
            )}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button
            className={block ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? 'Bajarilmoqda…' : (block ? 'Bloklash' : 'Blokdan chiqarish')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Balans to'ldirish modali
 * ------------------------------------------------------------------ */
function TopupModal({ r, balance, onClose, onDone, pushToast }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const num = Math.round(Number(amount));
    if (!amount || isNaN(num) || num <= 0) {
      setErr('To\'g\'ri summa kiriting (0 dan katta).');
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      await api.admin.vendorTopup(r.id, { amount: num, note: note.trim() || undefined });
      pushToast('success', `${r.name} balansiga ${formatSum(num)} qo'shildi`);
      onDone();
    } catch (e) {
      const msg = e?.message || 'Balansni to\'ldirib bo\'lmadi';
      setErr(msg);
      pushToast('error', msg);
      setSubmitting(false);
    }
  };

  const preview = amount && !isNaN(Number(amount)) ? Number(amount) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Balans to'ldirish</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className={s.subject}>
            <span className="avatar">{(r.name || '?').charAt(0).toUpperCase()}</span>
            <div>
              <div className={s.subjectName}>{r.name}</div>
              <div className={s.subjectMeta}>
                Joriy balans: {balance != null ? formatSum(balance) : '—'}
              </div>
            </div>
          </div>

          <label className="field">
            <span className="field__label">Summa (so'm)</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Masalan: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            {preview > 0 && (
              <span className="field__hint">Qo'shiladi: {formatSum(Math.round(preview))}</span>
            )}
          </label>

          <label className="field">
            <span className="field__label">Izoh (ixtiyoriy)</span>
            <textarea
              className="textarea"
              placeholder="To'ldirish sababi…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {err && <span className="field__error">{err}</span>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saqlanmoqda…' : 'To\'ldirish'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Komissiya o'zgartirish modali
 * ------------------------------------------------------------------ */
function CommissionModal({ r, current, onClose, onDone, pushToast }) {
  const [value, setValue] = useState(current != null ? String(current) : '');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const num = Number(value);
    if (value === '' || isNaN(num) || num < 0 || num > 100) {
      setErr('Komissiya 0 dan 100 gacha bo\'lishi kerak.');
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      await api.admin.setCommission(r.id, { commission_percent: num });
      pushToast('success', `${r.name} komissiyasi ${num}% ga o'zgartirildi`);
      onDone();
    } catch (e) {
      const msg = e?.message || 'Komissiyani o\'zgartirib bo\'lmadi';
      setErr(msg);
      pushToast('error', msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Komissiya o'zgartirish</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className={s.subject}>
            <span className="avatar">{(r.name || '?').charAt(0).toUpperCase()}</span>
            <div>
              <div className={s.subjectName}>{r.name}</div>
              <div className={s.subjectMeta}>
                Joriy komissiya: {current != null ? `${current}%` : '—'}
              </div>
            </div>
          </div>

          <label className="field">
            <span className="field__label">Yangi komissiya (%)</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.5"
              placeholder="Masalan: 12"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <span className="field__hint">Har bir buyurtmadan olinadigan platforma ulushi.</span>
          </label>

          {err && <span className="field__error">{err}</span>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Asosiy sahifa
 * ================================================================== */
export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // { type, r }
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.restaurants({ limit: 100 });
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setRestaurants(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Restoranlarni yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDone = useCallback(() => { setModal(null); load(); }, [load]);

  const filtered = useMemo(() => {
    let list = restaurants;
    if (statusFilter === 'active') list = list.filter((r) => isActive(r));
    else if (statusFilter === 'blocked') list = list.filter((r) => !isActive(r));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q) ||
        String(r.phone || '').toLowerCase().includes(q));
    }
    return list;
  }, [restaurants, statusFilter, search]);

  const counts = useMemo(() => ({
    all: restaurants.length,
    active: restaurants.filter((r) => isActive(r)).length,
    blocked: restaurants.filter((r) => !isActive(r)).length,
  }), [restaurants]);

  const TABS = [
    { key: 'all', label: 'Hammasi' },
    { key: 'active', label: 'Faol' },
    { key: 'blocked', label: 'Bloklangan' },
  ];

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className="page-title">Restoranlar</h1>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> Yangilash
        </button>
      </div>

      {/* Toolbar: chiplar + qidiruv */}
      <div className={s.toolbar}>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`chip ${statusFilter === key ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} <span className="chip__count">{counts[key]}</span>
            </button>
          ))}
        </div>
        <label className={`search ${s.search}`}>
          <Search size={18} />
          <input
            placeholder="Nom, manzil yoki telefon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {/* Holatlar */}
      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <div className={s.stateCard}>
          <div className="empty-state">
            <div className="empty-state__emoji">⚠️</div>
            <div className="empty-state__title">Xatolik yuz berdi</div>
            <div className="empty-state__text">{error}</div>
            <button className="btn btn-primary" onClick={load}>
              <RefreshCw size={16} /> Qayta urinish
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.stateCard}>
          <div className="empty-state">
            <div className="empty-state__emoji">🏪</div>
            <div className="empty-state__title">
              {restaurants.length === 0 ? 'Restoranlar yo\'q' : 'Hech narsa topilmadi'}
            </div>
            <div className="empty-state__text">
              {restaurants.length === 0
                ? 'Hozircha ro\'yxatdan o\'tgan restoranlar yo\'q.'
                : 'Qidiruv yoki filtrga mos restoran topilmadi. Boshqa so\'rov bilan urinib ko\'ring.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Restoran</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Komissiya</th>
                <th>Faollik</th>
                <th className="td-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const active = isActive(r);
                const st = active ? RESTAURANT_STATUS.active : RESTAURANT_STATUS.blocked;
                const comm = getCommission(r);
                const bal = getBalance(r);
                const items = [
                  active
                    ? {
                        label: 'Bloklash', danger: true,
                        icon: <Ban size={16} />,
                        onClick: () => setModal({ type: 'block', r }),
                      }
                    : {
                        label: 'Blokdan chiqarish',
                        icon: <CheckCircle size={16} />,
                        onClick: () => setModal({ type: 'unblock', r }),
                      },
                  {
                    label: 'Balans to\'ldirish',
                    icon: <Wallet size={16} />,
                    onClick: () => setModal({ type: 'topup', r, balance: bal }),
                  },
                  {
                    label: 'Komissiya o\'zgartirish',
                    icon: <Percent size={16} />,
                    onClick: () => setModal({ type: 'commission', r, current: comm }),
                  },
                ];
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="cell">
                        <span className="avatar">{(r.name || '?').charAt(0).toUpperCase()}</span>
                        <div>
                          <div className="cell__title">{r.name || '—'}</div>
                          <div className="cell__sub">
                            {r.rating ? `⭐ ${Number(r.rating).toFixed(1)}` : 'Reyting yo\'q'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="td-mono">{phoneFormat(r.phone)}</td>
                    <td>
                      <div className={s.addrCell}>
                        <MapPin size={14} />
                        <span>{r.address || '—'}</span>
                      </div>
                    </td>
                    <td className="td-mono">{comm != null ? `${comm}%` : '—'}</td>
                    <td>
                      <span className="badge" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="td-right">
                      <ActionsMenu items={items} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modallar */}
      {modal?.type === 'block' && (
        <ConfirmModal
          r={modal.r} action="block"
          onClose={() => setModal(null)} onDone={onDone} pushToast={pushToast}
        />
      )}
      {modal?.type === 'unblock' && (
        <ConfirmModal
          r={modal.r} action="unblock"
          onClose={() => setModal(null)} onDone={onDone} pushToast={pushToast}
        />
      )}
      {modal?.type === 'topup' && (
        <TopupModal
          r={modal.r} balance={modal.balance}
          onClose={() => setModal(null)} onDone={onDone} pushToast={pushToast}
        />
      )}
      {modal?.type === 'commission' && (
        <CommissionModal
          r={modal.r} current={modal.current}
          onClose={() => setModal(null)} onDone={onDone} pushToast={pushToast}
        />
      )}

      {/* Toastlar */}
      <div className={s.toastWrap}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${s.toast} ${t.type === 'error' ? s.toastError : s.toastSuccess}`}
          >
            {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Skeleton jadval (yuklanish holati)
 * ------------------------------------------------------------------ */
function SkeletonTable() {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Restoran</th>
            <th>Telefon</th>
            <th>Manzil</th>
            <th>Komissiya</th>
            <th>Faollik</th>
            <th className="td-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>
              <td>
                <div className="cell">
                  <div className="skeleton skeleton-circle" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '55%', marginBottom: 6 }} />
                    <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                  </div>
                </div>
              </td>
              <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
              <td><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
              <td><div className="skeleton skeleton-text" style={{ width: 48 }} /></td>
              <td><div className="skeleton skeleton-text" style={{ width: 64, height: 22 }} /></td>
              <td className="td-right"><div className="skeleton skeleton-text" style={{ width: 32, height: 32, marginLeft: 'auto' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
