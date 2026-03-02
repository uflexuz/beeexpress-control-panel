import { useState } from 'react';
import {
  ShoppingBag, DollarSign, Store, Users, Bike,
  Star, TrendingUp, Percent, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FAKE_PLATFORM_STATS, FAKE_CHART, FAKE_ALL_ORDERS, FAKE_RESTAURANTS } from '../lib/fakeData';
import { formatSum, formatCompact, getStatus, timeAgo, RESTAURANT_STATUS } from '../lib/helpers';
import s from './Dashboard.module.css';

const STAT_CARDS = [
  { key: 'today_orders',       label: 'Bugungi buyurtmalar', icon: ShoppingBag, color: '#5B8DEF', bg: '#EBF1FD', fmt: (v) => v.toLocaleString() },
  { key: 'today_revenue',      label: 'Bugungi daromad',     icon: DollarSign,  color: '#00B33C', bg: '#E6F9ED', fmt: formatCompact },
  { key: 'today_commission',   label: 'Bugungi komissiya',   icon: Percent,     color: '#FF9500', bg: '#FFF5E6', fmt: formatCompact },
  { key: 'active_restaurants',  label: 'Faol restoranlar',   icon: Store,       color: '#8B5CF6', bg: '#F3EFFE', fmt: (v) => v.toLocaleString() },
  { key: 'active_users_today', label: 'Faol foydalanuvchilar', icon: Users,     color: '#5B8DEF', bg: '#EBF1FD', fmt: (v) => v.toLocaleString() },
  { key: 'online_couriers',    label: 'Online kuryerlar',    icon: Bike,        color: '#00B33C', bg: '#E6F9ED', fmt: (v) => v.toLocaleString() },
  { key: 'avg_order',          label: 'O\'rtacha chek',      icon: TrendingUp,  color: '#FF9500', bg: '#FFF5E6', fmt: formatSum },
  { key: 'platform_rating',    label: 'Platforma reytingi',  icon: Star,        color: '#FCE000', bg: '#FFF9C4', fmt: (v) => v.toFixed(1) },
];

export default function Dashboard() {
  const [period, setPeriod] = useState('week');
  const stats = FAKE_PLATFORM_STATS;

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Dashboard</h1>
        <div className={s.periodTabs}>
          {['week', 'month'].map((p) => (
            <button key={p} className={`${s.periodTab} ${period === p ? s.periodTabActive : ''}`} onClick={() => setPeriod(p)}>
              {p === 'week' ? 'Hafta' : 'Oy'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className={s.statsGrid}>
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, fmt }) => (
          <div key={key} className={s.statCard}>
            <div className={s.statIcon} style={{ background: bg, color }}>
              <Icon size={20} />
            </div>
            <div className={s.statInfo}>
              <div className={s.statValue}>{fmt(stats[key])}</div>
              <div className={s.statLabel}>{label}</div>
            </div>
            <div className={s.statChange} style={{ color: '#00B33C' }}>
              <ArrowUpRight size={14} /> 12%
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className={s.chartsRow}>
        <div className={s.chartCard}>
          <h3>Buyurtmalar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={FAKE_CHART}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EFED" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E8E6E3', fontSize: 13 }}
                formatter={(v) => [v.toLocaleString(), 'Buyurtmalar']}
              />
              <Bar dataKey="orders" fill="#5B8DEF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={s.chartCard}>
          <h3>Daromad & Komissiya</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={FAKE_CHART}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EFED" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCompact} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E8E6E3', fontSize: 13 }}
                formatter={(v) => [formatSum(v)]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00B33C" fill="#E6F9ED" strokeWidth={2} name="Daromad" />
              <Area type="monotone" dataKey="commission" stroke="#FF9500" fill="#FFF5E6" strokeWidth={2} name="Komissiya" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom tables */}
      <div className={s.bottomRow}>
        {/* Recent orders */}
        <div className={s.tableCard}>
          <div className={s.tableHeader}>
            <h3>Oxirgi buyurtmalar</h3>
            <a href="/orders" className={s.viewAll}>Barchasini ko'rish →</a>
          </div>
          <table className={s.table}>
            <thead>
              <tr><th>#</th><th>Restoran</th><th>Mijoz</th><th>Summa</th><th>Holat</th><th>Vaqt</th></tr>
            </thead>
            <tbody>
              {FAKE_ALL_ORDERS.slice(0, 6).map((o) => {
                const st = getStatus(o.status);
                return (
                  <tr key={o.id}>
                    <td className={s.mono}>#{o.id}</td>
                    <td>{o.restaurant}</td>
                    <td>{o.customer}</td>
                    <td className={s.mono}>{formatSum(o.total)}</td>
                    <td><span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td className={s.muted}>{timeAgo(o.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pending restaurants */}
        <div className={s.tableCard} style={{ maxWidth: 420 }}>
          <div className={s.tableHeader}>
            <h3>Kutilayotgan restoranlar</h3>
            <a href="/restaurants" className={s.viewAll}>Barchasi →</a>
          </div>
          <div className={s.pendingList}>
            {FAKE_RESTAURANTS.filter((r) => r.status === 'pending').map((r) => (
              <div key={r.id} className={s.pendingItem}>
                <div className={s.pendingAvatar}>{r.name.charAt(0)}</div>
                <div className={s.pendingInfo}>
                  <div className={s.pendingName}>{r.name}</div>
                  <div className={s.pendingOwner}>{r.owner} · {r.phone}</div>
                </div>
                <span className={s.badge} style={{ background: RESTAURANT_STATUS.pending.bg, color: RESTAURANT_STATUS.pending.color }}>
                  {RESTAURANT_STATUS.pending.label}
                </span>
              </div>
            ))}
            {FAKE_RESTAURANTS.filter((r) => r.status === 'pending').length === 0 && (
              <div className={s.emptyPending}>Kutilayotgan restoranlar yo'q</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
