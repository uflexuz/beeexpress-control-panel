import { useState, useMemo } from 'react';
import {
  Search, Store, Star, ShoppingBag, MapPin, Phone,
  CheckCircle, XCircle, Ban, Eye, X, ChevronDown,
} from 'lucide-react';
import { FAKE_RESTAURANTS } from '../lib/fakeData';
import { formatSum, formatCompact, formatDate, RESTAURANT_STATUS } from '../lib/helpers';
import s from './Restaurants.module.css';

/* Detail drawer */
function DetailDrawer({ restaurant: r, onClose, onApprove, onSuspend, onActivate }) {
  if (!r) return null;
  const st = RESTAURANT_STATUS[r.status] || RESTAURANT_STATUS.active;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={s.drawerHeader}>
          <h3>Restoran tafsilotlari</h3>
          <button className={s.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <div className={s.drawerBody}>
          <div className={s.drawerTop}>
            <div className={s.drawerAvatar}>{r.name.charAt(0)}</div>
            <div>
              <h2 className={s.drawerName}>{r.name}</h2>
              <span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
            </div>
          </div>

          <div className={s.infoGrid}>
            <div className={s.infoItem}><span className={s.infoLabel}>Egasi</span><span>{r.owner}</span></div>
            <div className={s.infoItem}><span className={s.infoLabel}>Telefon</span><span>{r.phone}</span></div>
            <div className={s.infoItem}><span className={s.infoLabel}>Manzil</span><span>{r.address}</span></div>
            <div className={s.infoItem}><span className={s.infoLabel}>Ro'yxatdan o'tgan</span><span>{formatDate(r.created_at)}</span></div>
            <div className={s.infoItem}><span className={s.infoLabel}>Komissiya</span><span>{r.commission_rate}%</span></div>
            <div className={s.infoItem}><span className={s.infoLabel}>Reyting</span><span>⭐ {r.rating || '—'}</span></div>
          </div>

          <div className={s.metricRow}>
            <div className={s.metric}>
              <ShoppingBag size={18} />
              <div><div className={s.metricVal}>{r.total_orders.toLocaleString()}</div><div className={s.metricLabel}>Buyurtmalar</div></div>
            </div>
            <div className={s.metric}>
              <Store size={18} />
              <div><div className={s.metricVal}>{formatCompact(r.revenue)}</div><div className={s.metricLabel}>Daromad</div></div>
            </div>
          </div>

          <div className={s.drawerActions}>
            {r.status === 'pending' && (
              <button className={s.approveBtn} onClick={() => onApprove(r.id)}>
                <CheckCircle size={18} /> Tasdiqlash
              </button>
            )}
            {r.status === 'suspended' && (
              <button className={s.approveBtn} onClick={() => onActivate(r.id)}>
                <CheckCircle size={18} /> Faollashtirish
              </button>
            )}
            {r.status === 'active' && (
              <button className={s.suspendBtn} onClick={() => onSuspend(r.id)}>
                <Ban size={18} /> To'xtatish
              </button>
            )}
            {r.status === 'pending' && (
              <button className={s.suspendBtn} onClick={() => onSuspend(r.id)}>
                <XCircle size={18} /> Rad etish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState(FAKE_RESTAURANTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = restaurants;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q));
    }
    return list;
  }, [restaurants, statusFilter, search]);

  const counts = useMemo(() => ({
    all: restaurants.length,
    active: restaurants.filter((r) => r.status === 'active').length,
    pending: restaurants.filter((r) => r.status === 'pending').length,
    suspended: restaurants.filter((r) => r.status === 'suspended').length,
  }), [restaurants]);

  const updateStatus = (id, status) => {
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelected(null);
  };

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Restoranlar</h1>
      </div>

      {/* Tabs + Search */}
      <div className={s.toolbar}>
        <div className={s.tabs}>
          {[
            { key: 'all', label: 'Hammasi' },
            { key: 'active', label: 'Faol' },
            { key: 'pending', label: 'Kutilmoqda' },
            { key: 'suspended', label: 'To\'xtatilgan' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`${s.tab} ${statusFilter === key ? s.tabActive : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} <span className={s.tabBadge}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className={s.searchBar}>
          <Search size={18} />
          <input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Restoran</th>
              <th>Egasi</th>
              <th>Holat</th>
              <th>Reyting</th>
              <th>Buyurtmalar</th>
              <th>Daromad</th>
              <th>Komissiya</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className={s.emptyRow}><Store size={32} /><p>Restoranlar topilmadi</p></td></tr>
            )}
            {filtered.map((r) => {
              const st = RESTAURANT_STATUS[r.status] || RESTAURANT_STATUS.active;
              return (
                <tr key={r.id}>
                  <td>
                    <div className={s.restaurantCell}>
                      <div className={s.restAvatar}>{r.name.charAt(0)}</div>
                      <div>
                        <div className={s.restName}>{r.name}</div>
                        <div className={s.restAddr}><MapPin size={12} /> {r.address}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={s.ownerCell}>
                      <div>{r.owner}</div>
                      <div className={s.ownerPhone}><Phone size={12} /> {r.phone}</div>
                    </div>
                  </td>
                  <td><span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                  <td className={s.mono}>{r.rating ? `⭐ ${r.rating}` : '—'}</td>
                  <td className={s.mono}>{r.total_orders.toLocaleString()}</td>
                  <td className={s.mono}>{formatCompact(r.revenue)}</td>
                  <td className={s.mono}>{r.commission_rate}%</td>
                  <td>
                    <button className={s.viewBtn} onClick={() => setSelected(r)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <DetailDrawer
          restaurant={selected}
          onClose={() => setSelected(null)}
          onApprove={(id) => updateStatus(id, 'active')}
          onSuspend={(id) => updateStatus(id, 'suspended')}
          onActivate={(id) => updateStatus(id, 'active')}
        />
      )}
    </div>
  );
}
