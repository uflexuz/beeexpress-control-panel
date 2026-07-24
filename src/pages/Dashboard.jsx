import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingBag, Wallet, Store, Users, Clock,
  RefreshCw, AlertCircle, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatSum, formatCompact, getStatus, timeAgo } from '../lib/helpers';
import s from './Dashboard.module.css';

// ---------------------------------------------------------------------------
// Yordamchilar (lokal — umumiy helper faylni tahrirlamaymiz)
// ---------------------------------------------------------------------------

/** API javobidan ro'yxatni defensiv ajratadi ({data}, {data:{data}}, massiv). */
function pickList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

/** Jami sonni meta.total dan (yoki fallback ro'yxat uzunligidan) oladi. */
function pickTotal(res, list) {
  return (
    res?.meta?.total ??
    res?.data?.meta?.total ??
    res?.total ??
    (Array.isArray(list) ? list.length : 0)
  );
}

/** Sana → 'YYYY-MM-DD' (lokal). */
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Buyurtmadan sanani defensiv o'qiydi. */
function orderDate(o) {
  const raw = o?.created_at || o?.createdAt || o?.scheduled_at || o?.delivered_at;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/** Oxirgi `days` kun uchun buyurtma dinamikasi qatorini quradi. */
function buildDailySeries(orders, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  const index = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = ymd(d);
    const bucket = {
      key,
      label: d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }),
      orders: 0,
    };
    index[key] = bucket;
    buckets.push(bucket);
  }
  for (const o of orders) {
    const d = orderDate(o);
    if (!d) continue;
    const bucket = index[ymd(d)];
    if (bucket) bucket.orders += 1;
  }
  return buckets;
}

/** Status bo'yicha taqsimot (donut uchun). */
function buildStatusDist(orders) {
  const counts = {};
  for (const o of orders) {
    const k = o?.status || 'unknown';
    counts[k] = (counts[k] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([status, value]) => {
      const st = getStatus(status);
      return { status, name: st.label, value, color: st.color };
    })
    .sort((a, b) => b.value - a.value);
}

/** To'lov ro'yxatidan tushum (yig'ilgan to'lovlar summasi). */
const NON_REVENUE = new Set([
  'failed', 'cancelled', 'canceled', 'refunded', 'refund', 'error',
  'declined', 'rejected', 'pending', 'unpaid', 'created', 'new',
  'processing', 'waiting', 'expired', 'void',
]);
function collectedRevenue(payments) {
  return payments.reduce((sum, p) => {
    const st = String(p?.status || '').toLowerCase();
    if (!st || NON_REVENUE.has(st)) return sum;
    return sum + (Number(p?.amount) || 0);
  }, 0);
}

const PAYMENT_LABEL = {
  cash: 'Naqd',
  card: 'Karta',
  click: 'Click',
  payme: 'Payme',
  wallet: 'Hamyon',
};

// ---------------------------------------------------------------------------
// Resurs holati (parallel yuklash uchun)
// ---------------------------------------------------------------------------

const INITIAL = { loading: true, error: null, list: [], total: 0 };

/** Bitta resursni state'ga yuklaydi (skeleton → data / error). */
async function loadInto(setState, fetcher) {
  setState((s0) => ({ ...s0, loading: true, error: null }));
  try {
    const res = await fetcher();
    const list = pickList(res);
    setState({ loading: false, error: null, list, total: pickTotal(res, list) });
  } catch (e) {
    setState({
      loading: false,
      error: (e && e.message) || 'Ma\'lumotni yuklab bo\'lmadi',
      list: [],
      total: 0,
    });
  }
}

// ---------------------------------------------------------------------------
// Kichik prezentatsion komponentlar
// ---------------------------------------------------------------------------

function ErrorState({ message, onRetry, compact }) {
  return (
    <div className={compact ? s.blockStateCompact : s.blockState}>
      <AlertCircle size={compact ? 22 : 30} className={s.blockStateIcon} />
      <div className={s.blockStateText}>{message}</div>
      <button className="btn btn-secondary btn-sm" onClick={onRetry}>
        <RefreshCw size={15} /> Qayta urinish
      </button>
    </div>
  );
}

function EmptyState({ emoji, title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-state__emoji">{emoji}</div>
      <div className="empty-state__title">{title}</div>
      {text && <div className="empty-state__text">{text}</div>}
    </div>
  );
}

function KpiCard({ loading, error, onRetry, icon: Icon, color, bg, label, value, hint }) {
  return (
    <div className={s.statCard}>
      <div className={s.statIcon} style={{ background: bg, color }}>
        <Icon size={20} />
      </div>
      <div className={s.statInfo}>
        {loading ? (
          <>
            <div className="skeleton skeleton-title" style={{ width: '62%', height: 26, marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '82%' }} />
          </>
        ) : error ? (
          <>
            <div className={s.statValue} style={{ color: 'var(--color-error)' }}>—</div>
            <button className={s.retryLink} onClick={onRetry}>
              <RefreshCw size={12} /> Qayta urinish
            </button>
          </>
        ) : (
          <>
            <div className={s.statValue} title={hint}>{value}</div>
            <div className={s.statLabel}>{label}</div>
          </>
        )}
      </div>
    </div>
  );
}

/** Chart/jadval bloklari uchun 3 holatli o'ram. */
function AsyncBlock({ loading, error, onRetry, isEmpty, emptyEmoji, emptyTitle, emptyText, skeleton, children }) {
  if (loading) return skeleton;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState emoji={emptyEmoji} title={emptyTitle} text={emptyText} />;
  return children;
}

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #EBEBEB',
  boxShadow: '0 4px 16px rgba(33,32,31,.08)',
  fontSize: 13,
  padding: '8px 12px',
};

// ---------------------------------------------------------------------------
// Sahifa
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const [orders, setOrders] = useState(INITIAL);
  const [users, setUsers] = useState(INITIAL);
  const [restaurants, setRestaurants] = useState(INITIAL);
  const [payments, setPayments] = useState(INITIAL);

  const loadOrders = useCallback(() => loadInto(setOrders, () => api.admin.orders({ limit: 1000 })), []);
  const loadUsers = useCallback(() => loadInto(setUsers, () => api.admin.users({ limit: 1000 })), []);
  const loadRestaurants = useCallback(() => loadInto(setRestaurants, () => api.admin.restaurants({ limit: 1000 })), []);
  const loadPayments = useCallback(() => loadInto(setPayments, () => api.admin.payments({ limit: 1000 })), []);

  const reloadAll = useCallback(() => {
    // Hammasi parallel — bir-birini kutmaydi.
    loadOrders();
    loadUsers();
    loadRestaurants();
    loadPayments();
  }, [loadOrders, loadUsers, loadRestaurants, loadPayments]);

  useEffect(() => { reloadAll(); }, [reloadAll]);

  const anyLoading = orders.loading || users.loading || restaurants.loading || payments.loading;

  // --- Agregatlar (real ma'lumotdan hisoblanadi) ---
  const todayKey = ymd(new Date());
  const todayOrders = useMemo(
    () => orders.list.filter((o) => { const d = orderDate(o); return d && ymd(d) === todayKey; }).length,
    [orders.list, todayKey],
  );
  const revenue = useMemo(() => collectedRevenue(payments.list), [payments.list]);
  const activeRestaurants = useMemo(
    () => restaurants.list.filter((r) => Boolean(r?.is_active)).length,
    [restaurants.list],
  );
  const dailySeries = useMemo(() => buildDailySeries(orders.list, 14), [orders.list]);
  const statusDist = useMemo(() => buildStatusDist(orders.list), [orders.list]);
  const statusTotal = useMemo(() => statusDist.reduce((a, b) => a + b.value, 0), [statusDist]);

  // Nom aniqlash uchun xaritalar (buyurtma jadvalidagi vendor_id / user_id → nom).
  const vendorMap = useMemo(() => {
    const m = {};
    for (const v of restaurants.list) m[v.id] = v;
    return m;
  }, [restaurants.list]);
  const userMap = useMemo(() => {
    const m = {};
    for (const u of users.list) m[u.id] = u;
    return m;
  }, [users.list]);

  const recentOrders = useMemo(() => {
    const list = [...orders.list];
    list.sort((a, b) => {
      const da = orderDate(a)?.getTime() ?? 0;
      const db = orderDate(b)?.getTime() ?? 0;
      if (db !== da) return db - da;
      return (b.id || 0) - (a.id || 0);
    });
    return list.slice(0, 10);
  }, [orders.list]);

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Boshqaruv paneli</h1>
        <button className="btn btn-secondary btn-sm" onClick={reloadAll} disabled={anyLoading}>
          <RefreshCw size={16} className={anyLoading ? s.spin : undefined} /> Yangilash
        </button>
      </div>

      {/* KPI kartalar — har biri o'z manbasiga bog'langan (o'z skeleton/xato holati). */}
      <div className={s.statsGrid}>
        <KpiCard
          loading={orders.loading} error={orders.error} onRetry={loadOrders}
          icon={ShoppingBag} color="#5B8DEF" bg="#EBF1FD"
          label="Jami buyurtma" value={Number(orders.total).toLocaleString('uz-UZ')}
        />
        <KpiCard
          loading={orders.loading} error={orders.error} onRetry={loadOrders}
          icon={Clock} color="#FF9500" bg="#FFF5E6"
          label="Bugungi buyurtmalar" value={todayOrders.toLocaleString('uz-UZ')}
        />
        <KpiCard
          loading={payments.loading} error={payments.error} onRetry={loadPayments}
          icon={Wallet} color="#00B33C" bg="#E6F9ED"
          label="Jami tushum" value={formatCompact(revenue)} hint={formatSum(revenue)}
        />
        <KpiCard
          loading={users.loading} error={users.error} onRetry={loadUsers}
          icon={Users} color="#8B5CF6" bg="#F3EFFE"
          label="Foydalanuvchilar" value={Number(users.total).toLocaleString('uz-UZ')}
        />
        <KpiCard
          loading={restaurants.loading} error={restaurants.error} onRetry={loadRestaurants}
          icon={Store} color="#8A7B00" bg="#FFF9C4"
          label="Faol restoranlar" value={activeRestaurants.toLocaleString('uz-UZ')}
          hint={`Jami: ${Number(restaurants.total).toLocaleString('uz-UZ')}`}
        />
      </div>

      {/* Grafiklar */}
      <div className={s.chartsRow}>
        {/* Buyurtma dinamikasi */}
        <div className={s.chartCard}>
          <div className={s.cardHead}>
            <h3 className={s.cardTitle}>Buyurtma dinamikasi</h3>
            <span className={s.cardSub}>Oxirgi 14 kun</span>
          </div>
          <AsyncBlock
            loading={orders.loading} error={orders.error} onRetry={loadOrders}
            isEmpty={orders.list.length === 0}
            emptyEmoji="📈" emptyTitle="Ma'lumot yo'q"
            emptyText="Buyurtmalar paydo bo'lgach, dinamika shu yerda ko'rinadi."
            skeleton={<div className={`skeleton ${s.chartSkeleton}`} />}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#5B8DEF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#EBEBEB' }} formatter={(v) => [Number(v).toLocaleString('uz-UZ'), 'Buyurtma']} labelStyle={{ color: '#999999', marginBottom: 4 }} />
                <Area type="monotone" dataKey="orders" stroke="#5B8DEF" strokeWidth={2.5} fill="url(#ordersFill)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </AsyncBlock>
        </div>

        {/* Status taqsimoti (donut) */}
        <div className={s.chartCard}>
          <div className={s.cardHead}>
            <h3 className={s.cardTitle}>Status taqsimoti</h3>
            <span className={s.cardSub}>{statusTotal.toLocaleString('uz-UZ')} ta</span>
          </div>
          <AsyncBlock
            loading={orders.loading} error={orders.error} onRetry={loadOrders}
            isEmpty={statusDist.length === 0}
            emptyEmoji="🍩" emptyTitle="Ma'lumot yo'q"
            emptyText="Buyurtmalar bo'lmagani uchun taqsimot yo'q."
            skeleton={<div className={`skeleton ${s.chartSkeleton}`} />}
          >
            <div className={s.donutWrap}>
              <div className={s.donutChart}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
                      {statusDist.map((d) => <Cell key={d.status} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [Number(v).toLocaleString('uz-UZ'), n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={s.donutCenter}>
                  <div className={s.donutCenterValue}>{statusTotal.toLocaleString('uz-UZ')}</div>
                  <div className={s.donutCenterLabel}>buyurtma</div>
                </div>
              </div>
              <ul className={s.legend}>
                {statusDist.map((d) => (
                  <li key={d.status} className={s.legendItem}>
                    <span className={s.legendDot} style={{ background: d.color }} />
                    <span className={s.legendName}>{d.name}</span>
                    <span className={s.legendVal}>{d.value}</span>
                    <span className={s.legendPct}>
                      {statusTotal ? Math.round((d.value / statusTotal) * 100) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </AsyncBlock>
        </div>
      </div>

      {/* Oxirgi 10 buyurtma */}
      <div className={s.tableCard}>
        <div className={s.cardHead}>
          <h3 className={s.cardTitle}>Oxirgi buyurtmalar</h3>
          <Link to="/orders" className={s.viewAll}>Barchasini ko'rish →</Link>
        </div>
        <AsyncBlock
          loading={orders.loading} error={orders.error} onRetry={loadOrders}
          isEmpty={recentOrders.length === 0}
          emptyEmoji="📦" emptyTitle="Buyurtmalar yo'q"
          emptyText="Hozircha buyurtmalar mavjud emas. Yangilari shu yerda ko'rinadi."
          skeleton={<TableSkeleton />}
        >
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Restoran</th>
                  <th>Mijoz</th>
                  <th className={s.right}>Summa</th>
                  <th>To'lov</th>
                  <th>Holat</th>
                  <th className={s.right}>Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const st = getStatus(o.status);
                  const vName = vendorMap[o.vendor_id]?.name || (o.vendor_id ? `Restoran #${o.vendor_id}` : '—');
                  const uName = userMap[o.user_id]?.name || (o.user_id ? `Mijoz #${o.user_id}` : '—');
                  const pm = PAYMENT_LABEL[String(o.payment_method || '').toLowerCase()] || (o.payment_method || '—');
                  const d = orderDate(o);
                  return (
                    <tr key={o.id ?? o.uuid}>
                      <td className={s.mono}>#{o.id ?? '—'}</td>
                      <td className={s.bold}>{vName}</td>
                      <td>{uName}</td>
                      <td className={`${s.mono} ${s.right}`}>{formatSum(o.total)}</td>
                      <td className={s.muted}>{pm}</td>
                      <td>
                        <span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td className={`${s.muted} ${s.right}`}>{d ? timeAgo(d) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncBlock>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={s.tableSkeleton}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={s.skelRow}>
          <div className="skeleton skeleton-circle" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="skeleton skeleton-text" style={{ flex: 1 }} />
          <div className="skeleton skeleton-text" style={{ width: 90 }} />
          <div className="skeleton skeleton-text" style={{ width: 64 }} />
        </div>
      ))}
    </div>
  );
}
