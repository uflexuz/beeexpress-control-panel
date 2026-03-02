import { useState } from 'react';
import {
  DollarSign, TrendingUp, ArrowDownRight, Clock,
  CheckCircle, AlertCircle, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FAKE_FINANCE, FAKE_PAYOUTS, FAKE_CHART } from '../lib/fakeData';
import { formatSum, formatCompact, formatDate, PAYOUT_STATUS } from '../lib/helpers';
import s from './Finance.module.css';

const PERIOD_LABELS = { today: 'Bugun', week: 'Hafta', month: 'Oy' };

export default function Finance() {
  const [period, setPeriod] = useState('today');
  const fin = FAKE_FINANCE[period];

  const CARDS = [
    { label: 'Umumiy daromad', value: fin.revenue, icon: DollarSign, color: '#00B33C', bg: '#E6F9ED' },
    { label: 'Komissiya', value: fin.commission, icon: TrendingUp, color: '#5B8DEF', bg: '#EBF1FD' },
    { label: 'To\'lovlar', value: fin.payouts, icon: ArrowDownRight, color: '#FF9500', bg: '#FFF5E6' },
    { label: 'Kutilmoqda', value: fin.pending, icon: Clock, color: '#9E9B98', bg: '#F5F4F2' },
  ];

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Moliya</h1>
        <div className={s.periodTabs}>
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button key={key} className={`${s.periodTab} ${period === key ? s.periodTabActive : ''}`} onClick={() => setPeriod(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className={s.cardsGrid}>
        {CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={s.card}>
            <div className={s.cardIcon} style={{ background: bg, color }}>
              <Icon size={22} />
            </div>
            <div>
              <div className={s.cardValue}>{formatCompact(value)}</div>
              <div className={s.cardLabel}>{label}</div>
              <div className={s.cardFull}>{formatSum(value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className={s.chartCard}>
        <h3>Haftalik daromad & komissiya</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={FAKE_CHART}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EFED" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCompact} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E8E6E3', fontSize: 13 }}
              formatter={(v) => [formatSum(v)]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#00B33C" fill="#E6F9ED" strokeWidth={2} name="Daromad" />
            <Area type="monotone" dataKey="commission" stroke="#5B8DEF" fill="#EBF1FD" strokeWidth={2} name="Komissiya" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payouts table */}
      <div className={s.tableCard}>
        <div className={s.tableHeader}>
          <h3>To'lovlar tarixi</h3>
        </div>
        <table className={s.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Restoran</th>
              <th>Summa</th>
              <th>Holat</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {FAKE_PAYOUTS.map((p) => {
              const st = PAYOUT_STATUS[p.status];
              const Icon = p.status === 'completed' ? CheckCircle : p.status === 'pending' ? Clock : XCircle;
              return (
                <tr key={p.id}>
                  <td className={s.mono}>#{p.id}</td>
                  <td className={s.bold}>{p.restaurant}</td>
                  <td className={s.mono}>{formatSum(p.amount)}</td>
                  <td>
                    <span className={s.statusBadge} style={{ background: st.bg, color: st.color }}>
                      <Icon size={13} /> {st.label}
                    </span>
                  </td>
                  <td className={s.muted}>{formatDate(p.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
