import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search, ShoppingBag, Eye, X, RefreshCw, AlertCircle, Check,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  formatSum, getStatus, PAYMENT_STATUS,
} from '../lib/helpers';
import s from './Orders.module.css';

/* ------------------------------------------------------------------ */
/* Konstantalar                                                        */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'all',       label: 'Hammasi' },
  { key: 'active',    label: 'Faol' },
  { key: 'completed', label: 'Bajarilgan' },
  { key: 'cancelled', label: 'Bekor qilingan' },
];

const ACTIVE = ['created', 'pending', 'accepted', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'on_the_way'];
const COMPLETED = ['delivered', 'completed'];
const CANCELLED = ['cancelled', 'failed'];

/* Admin qo'lda o'rnatishi mumkin bo'lgan statuslar (STATUS_MAP kalitlari). */
const STATUS_OPTIONS = [
  'created', 'accepted', 'preparing', 'ready',
  'courier_assigned', 'picked_up', 'on_the_way',
  'delivered', 'cancelled', 'failed',
];

/* To'lov usuli — emoji + o'zbekcha nom (defensiv). */
const PAY_METHOD = {
  cash:   '💵 Naqd',
  card:   '💳 Karta',
  click:  '💳 Click',
  payme:  '💳 Payme',
  uzum:   '💳 Uzum',
  wallet: '👛 Hamyon',
};

const POLL_MS = 15000;

/* ------------------------------------------------------------------ */
/* Defensiv o'qish yordamchilari (real API ID qaytaradi — nomni izla)  */
/* ------------------------------------------------------------------ */

function vendorName(o, vmap) {
  return (o.vendor && o.vendor.name) || o.vendor_name || vmap[o.vendor_id] ||
    (o.vendor_id != null ? `Restoran #${o.vendor_id}` : '—');
}
function customerName(o) {
  return (o.user && o.user.name) || (o.customer && o.customer.name) || o.customer_name ||
    (typeof o.customer === 'string' ? o.customer : null) ||
    (o.user && o.user.phone) ||
    (o.user_id != null ? `Mijoz #${o.user_id}` : '—');
}
function courierName(o) {
  return (o.courier && o.courier.name) || o.courier_name ||
    (o.courier_id != null ? `Kuryer #${o.courier_id}` : null);
}
function payMethod(m) {
  if (!m) return '—';
  return PAY_METHOD[String(m).toLowerCase()] || m;
}
function payStatusOf(o) {
  const key = o.payment_status ? String(o.payment_status).toLowerCase() : '';
  return { key, meta: PAYMENT_STATUS[key] || null };
}
function toList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

/* ------------------------------------------------------------------ */
/* Skeleton (yuklanish holati)                                          */
/* ------------------------------------------------------------------ */

function SkeletonTable() {
  return (
    <div className={s.tableWrap}>
      <div className={s.skelHead} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div className={s.skelRow} key={i}>
          <div className="skeleton skeleton-text" style={{ width: 48 }} />
          <div className="skeleton skeleton-text" style={{ width: '22%' }} />
          <div className="skeleton skeleton-text" style={{ width: '18%' }} />
          <div className="skeleton skeleton-text" style={{ width: 80 }} />
          <div className="skeleton skeleton-text" style={{ width: 64 }} />
          <div className="skeleton skeleton-text" style={{ width: 72 }} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sahifa                                                              */
/* ------------------------------------------------------------------ */

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [vmap, setVmap] = useState({});           // vendor_id -> nom
  const [loading, setLoading] = useState(true);   // faqat birinchi yuklash
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Drawer'dagi status o'zgartirish formasi
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  const mounted = useRef(true);
  // StrictMode (dev) effektni ikki marta ishga tushiradi: birinchi cleanup
  // mounted=false qiladi, remount'da qayta true bo'lishi shart — aks holda
  // barcha `if (!mounted.current) return` gard'lari yiqilib, loading hech
  // qachon o'chmaydi (skeleton qotib qoladi).
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /* --- Ma'lumot yuklash --- */
  const load = useCallback(async ({ silent } = {}) => {
    if (silent) setRefreshing(true);
    else { setLoading(true); setError(null); }
    try {
      const res = await api.admin.orders({ limit: 100 });
      if (!mounted.current) return;
      setOrders(toList(res));
      setError(null);
    } catch (e) {
      if (!mounted.current) return;
      if (!silent) setError(e && e.message ? e.message : 'Buyurtmalarni yuklab bo\'lmadi');
      // silent xatoda eski ma'lumot saqlanadi
    } finally {
      if (!mounted.current) return;
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* --- Vendor nomlarini bir marta yuklash (best-effort) --- */
  useEffect(() => {
    let alive = true;
    api.admin.restaurants({ limit: 200 })
      .then((res) => {
        if (!alive) return;
        const m = {};
        for (const v of toList(res)) if (v && v.id != null) m[v.id] = v.name;
        setVmap(m);
      })
      .catch(() => { /* nomlar ixtiyoriy — ID fallback ishlaydi */ });
    return () => { alive = false; };
  }, []);

  /* --- 15s avto-yangilash --- */
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  /* --- Filtr / qidiruv (client-side) --- */
  const filtered = useMemo(() => {
    let list = orders;
    if (tab === 'active') list = list.filter((o) => ACTIVE.includes(o.status));
    else if (tab === 'completed') list = list.filter((o) => COMPLETED.includes(o.status));
    else if (tab === 'cancelled') list = list.filter((o) => CANCELLED.includes(o.status));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        String(o.id).includes(q) ||
        (o.uuid && String(o.uuid).toLowerCase().includes(q)) ||
        vendorName(o, vmap).toLowerCase().includes(q) ||
        customerName(o).toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, tab, search, vmap]);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o) => ACTIVE.includes(o.status)).length,
    completed: orders.filter((o) => COMPLETED.includes(o.status)).length,
    cancelled: orders.filter((o) => CANCELLED.includes(o.status)).length,
  }), [orders]);

  /* --- Drawer ochish/yopish --- */
  const openDrawer = (o) => {
    setSelected(o);
    setNewStatus(o.status || '');
    setNote('');
    setSaveErr(null);
    setSaveOk(false);
  };
  const closeDrawer = () => setSelected(null);

  /* --- Status o'zgartirish (POST /admin/order/{id}/status) --- */
  const submitStatus = async () => {
    if (!selected || !newStatus || newStatus === selected.status) return;
    const label = getStatus(newStatus).label;
    if (!window.confirm(`Buyurtma #${selected.id} holatini "${label}" ga o'zgartirasizmi?`)) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(false);
    try {
      await api.admin.setOrderStatus(selected.id, {
        status: newStatus,
        note: note.trim() || undefined,
      });
      if (!mounted.current) return;
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: newStatus } : o)));
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setNote('');
      setSaveOk(true);
      load({ silent: true });        // serverdagi haqiqiy holatni tortib olish
    } catch (e) {
      if (!mounted.current) return;
      setSaveErr(e && e.message ? e.message : 'Holatni saqlab bo\'lmadi');
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Buyurtmalar</h1>
        <div className={s.headerActions}>
          <button
            className={`${s.autoBtn} ${autoRefresh ? s.autoOn : ''}`}
            onClick={() => setAutoRefresh((v) => !v)}
            title="Har 15 soniyada avtomatik yangilash"
          >
            <span className={`${s.dot} ${autoRefresh ? s.dotOn : ''}`} />
            Avto-yangilash {autoRefresh ? 'yoniq' : 'o\'chiq'}
          </button>
          <button
            className={s.refreshBtn}
            onClick={() => load({ silent: true })}
            disabled={loading}
            title="Yangilash"
          >
            <RefreshCw size={16} className={refreshing ? s.spin : undefined} />
          </button>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={s.tabs}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`${s.tab} ${tab === key ? s.tabActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label} <span className={s.tabBadge}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className={s.searchBar}>
          <Search size={18} />
          <input
            placeholder="ID, restoran yoki mijoz..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* --- Holatlar: loading / error / empty / jadval --- */}
      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <div className={s.stateBox}>
          <AlertCircle size={40} className={s.stateErrIcon} />
          <div className={s.stateTitle}>Xatolik yuz berdi</div>
          <div className={s.stateText}>{error}</div>
          <button className="btn btn-primary" onClick={() => load()}>Qayta urinish</button>
        </div>
      ) : orders.length === 0 ? (
        <div className={s.stateBox}>
          <div className={s.stateEmoji}>📦</div>
          <div className={s.stateTitle}>Buyurtmalar yo'q</div>
          <div className={s.stateText}>Hozircha birorta buyurtma yo'q. Yangi buyurtmalar shu yerda paydo bo'ladi.</div>
          <button className="btn btn-secondary" onClick={() => load()}>Yangilash</button>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Mijoz</th>
                <th>Restoran</th>
                <th>Summa</th>
                <th>To'lov</th>
                <th>Holat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={s.emptyRow}>
                    <ShoppingBag size={32} />
                    <p>Filtrga mos buyurtma topilmadi</p>
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const st = getStatus(o.status);
                const ps = payStatusOf(o);
                return (
                  <tr
                    key={o.id}
                    className={selected && selected.id === o.id ? s.rowSelected : undefined}
                    onClick={() => openDrawer(o)}
                  >
                    <td className={s.mono}>#{o.id}</td>
                    <td className={s.bold}>{customerName(o)}</td>
                    <td>{vendorName(o, vmap)}</td>
                    <td className={s.mono}>{formatSum(o.total)}</td>
                    <td>
                      <div className={s.payCell}>
                        <span className={s.payMethod}>{payMethod(o.payment_method)}</span>
                        {ps.meta && (
                          <span className={s.payStatus} style={{ background: ps.meta.bg, color: ps.meta.color }}>
                            {ps.meta.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td>
                      <button
                        className={s.viewBtn}
                        onClick={(e) => { e.stopPropagation(); openDrawer(o); }}
                        title="Tafsilotlar"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Detail drawer --- */}
      {selected && (
        <div className={s.overlay} onClick={closeDrawer}>
          <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={s.drawerHeader}>
              <h3>Buyurtma #{selected.id}</h3>
              <button className={s.closeBtn} onClick={closeDrawer}><X size={20} /></button>
            </div>

            <div className={s.drawerBody}>
              {(() => {
                const st = getStatus(selected.status);
                const ps = payStatusOf(selected);
                const items = Array.isArray(selected.items) ? selected.items : [];
                const courier = courierName(selected);
                return (
                  <>
                    <span
                      className={s.badge}
                      style={{ background: st.bg, color: st.color, alignSelf: 'flex-start' }}
                    >
                      {st.label}
                    </span>

                    <div className={s.infoGrid}>
                      <div className={s.infoItem}><span className={s.infoLabel}>Mijoz</span><span>{customerName(selected)}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>Restoran</span><span>{vendorName(selected, vmap)}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>Kuryer</span><span>{courier || 'Tayinlanmagan'}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>To'lov usuli</span><span>{payMethod(selected.payment_method)}</span></div>
                      <div className={s.infoItem}>
                        <span className={s.infoLabel}>To'lov holati</span>
                        <span>{ps.meta ? ps.meta.label : (selected.payment_status || '—')}</span>
                      </div>
                    </div>

                    {/* Manzil / Izoh — note ba'zan "Manzil / GPS / Telefon" matnini o'z ichiga oladi */}
                    {selected.note && String(selected.note).trim() && (
                      <div className={s.section}>
                        <div className={s.sectionTitle}>Manzil / Izoh</div>
                        <div className={s.muted} style={{ whiteSpace: 'pre-line' }}>
                          {String(selected.note).trim()}
                        </div>
                      </div>
                    )}

                    {/* Mahsulotlar */}
                    <div className={s.section}>
                      <div className={s.sectionTitle}>Mahsulotlar</div>
                      {items.length === 0 ? (
                        <div className={s.muted}>Mahsulotlar ma'lumoti yo'q</div>
                      ) : (
                        <div className={s.items}>
                          {items.map((it, i) => (
                            <div className={s.itemRow} key={it.id ?? i}>
                              <div className={s.itemMain}>
                                <span className={s.itemQty}>{it.quantity ?? 1}×</span>
                                <span className={s.itemName}>{it.name || `Mahsulot #${it.product_id ?? ''}`}</span>
                              </div>
                              <span className={s.itemPrice}>
                                {formatSum(it.total_price != null ? it.total_price : (it.unit_price || 0) * (it.quantity || 1))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summalar */}
                    <div className={s.section}>
                      <div className={s.sectionTitle}>Hisob-kitob</div>
                      <div className={s.sumRows}>
                        <div className={s.sumRow}><span>Mahsulotlar</span><span className={s.mono}>{formatSum(selected.subtotal)}</span></div>
                        <div className={s.sumRow}><span>Yetkazish</span><span className={s.mono}>{formatSum(selected.delivery_fee)}</span></div>
                        {selected.discount ? (
                          <div className={s.sumRow}><span>Chegirma</span><span className={s.mono}>−{formatSum(selected.discount)}</span></div>
                        ) : null}
                        {selected.tip ? (
                          <div className={s.sumRow}><span>Tip</span><span className={s.mono}>{formatSum(selected.tip)}</span></div>
                        ) : null}
                        <div className={`${s.sumRow} ${s.sumTotal}`}><span>Jami</span><span className={s.mono}>{formatSum(selected.total)}</span></div>
                        {selected.commission_amount != null && (
                          <div className={`${s.sumRow} ${s.muted}`}>
                            <span>Komissiya{selected.commission_percent != null ? ` (${selected.commission_percent}%)` : ''}</span>
                            <span className={s.mono}>{formatSum(selected.commission_amount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status o'zgartirish */}
                    <div className={s.section}>
                      <div className={s.sectionTitle}>Holatni o'zgartirish</div>
                      <select
                        className={s.statusSelect}
                        value={newStatus}
                        onChange={(e) => { setNewStatus(e.target.value); setSaveOk(false); setSaveErr(null); }}
                      >
                        {STATUS_OPTIONS.map((k) => (
                          <option key={k} value={k}>{getStatus(k).label}</option>
                        ))}
                      </select>
                      <textarea
                        className={s.noteInput}
                        placeholder="Izoh (ixtiyoriy)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                      />
                      {saveErr && <div className={s.saveErr}><AlertCircle size={14} /> {saveErr}</div>}
                      {saveOk && <div className={s.saveOk}><Check size={14} /> Holat yangilandi</div>}
                      <button
                        className={s.saveBtn}
                        onClick={submitStatus}
                        disabled={saving || !newStatus || newStatus === selected.status}
                      >
                        {saving ? 'Saqlanmoqda...' : 'Holatni saqlash'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
