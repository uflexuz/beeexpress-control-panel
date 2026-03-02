import { useState, useMemo } from 'react';
import { Search, Bike, Phone, Star, MapPin, Wallet } from 'lucide-react';
import { FAKE_COURIERS } from '../lib/fakeData';
import { formatSum, COURIER_STATUS, VEHICLE_MAP } from '../lib/helpers';
import s from './Couriers.module.css';

export default function Couriers() {
  const [couriers] = useState(FAKE_COURIERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = couriers;
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list;
  }, [couriers, statusFilter, search]);

  const counts = useMemo(() => ({
    all: couriers.length,
    online: couriers.filter((c) => c.status === 'online').length,
    busy: couriers.filter((c) => c.status === 'busy').length,
    offline: couriers.filter((c) => c.status === 'offline').length,
  }), [couriers]);

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Kuryerlar</h1>
        <div className={s.headerStats}>
          <span className={s.statChip} style={{ background: '#E6F9ED', color: '#00B33C' }}>🟢 Online: {counts.online}</span>
          <span className={s.statChip} style={{ background: '#FFF5E6', color: '#FF9500' }}>🟡 Band: {counts.busy}</span>
          <span className={s.statChip} style={{ background: '#F5F4F2', color: '#9E9B98' }}>⚫ Offline: {counts.offline}</span>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={s.tabs}>
          {[
            { key: 'all', label: 'Hammasi' },
            { key: 'online', label: 'Online' },
            { key: 'busy', label: 'Band' },
            { key: 'offline', label: 'Offline' },
          ].map(({ key, label }) => (
            <button key={key} className={`${s.tab} ${statusFilter === key ? s.tabActive : ''}`} onClick={() => setStatusFilter(key)}>
              {label} <span className={s.tabBadge}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className={s.searchBar}>
          <Search size={18} />
          <input placeholder="Ism yoki telefon..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Courier cards grid */}
      <div className={s.grid}>
        {filtered.length === 0 && (
          <div className={s.empty}><Bike size={40} /><p>Kuryerlar topilmadi</p></div>
        )}
        {filtered.map((c) => {
          const st = COURIER_STATUS[c.status];
          return (
            <div key={c.id} className={s.card}>
              <div className={s.cardTop}>
                <div className={s.cardAvatar}>{c.name.charAt(0)}</div>
                <div className={s.cardInfo}>
                  <div className={s.cardName}>{c.name}</div>
                  <div className={s.cardPhone}><Phone size={12} /> {c.phone}</div>
                </div>
                <span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
              </div>

              <div className={s.cardMeta}>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Transport</span>
                  <span>{VEHICLE_MAP[c.vehicle] || c.vehicle}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Reyting</span>
                  <span>⭐ {c.rating}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Jami yetkazishlar</span>
                  <span className={s.bold}>{c.total_deliveries.toLocaleString()}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Bugun</span>
                  <span className={s.bold}>{c.today_deliveries}</span>
                </div>
              </div>

              <div className={s.cardBottom}>
                <div className={s.balance}>
                  <Wallet size={14} />
                  <span>Balans: <strong>{formatSum(c.balance)}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
