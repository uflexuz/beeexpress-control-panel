import { useState, useMemo } from 'react';
import { Search, ShoppingBag, Eye, X } from 'lucide-react';
import { FAKE_ALL_ORDERS } from '../lib/fakeData';
import { formatSum, getStatus, timeAgo, formatDateTime } from '../lib/helpers';
import s from './Orders.module.css';

const TABS = [
  { key: 'all',       label: 'Hammasi' },
  { key: 'active',    label: 'Faol' },
  { key: 'completed', label: 'Bajarilgan' },
  { key: 'cancelled', label: 'Bekor qilingan' },
];

const ACTIVE = ['created', 'accepted', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'on_the_way'];

export default function Orders() {
  const [orders, setOrders] = useState(FAKE_ALL_ORDERS);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab === 'active') list = list.filter((o) => ACTIVE.includes(o.status));
    else if (tab === 'completed') list = list.filter((o) => o.status === 'delivered');
    else if (tab === 'cancelled') list = list.filter((o) => o.status === 'cancelled');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        String(o.id).includes(q) ||
        o.restaurant.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, tab, search]);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o) => ACTIVE.includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }), [orders]);

  const handleCancel = (id) => {
    if (!confirm('Buyurtmani bekor qilmoqchimisiz?')) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)));
    setSelected(null);
  };

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Buyurtmalar</h1>
      </div>

      <div className={s.toolbar}>
        <div className={s.tabs}>
          {TABS.map(({ key, label }) => (
            <button key={key} className={`${s.tab} ${tab === key ? s.tabActive : ''}`} onClick={() => setTab(key)}>
              {label} <span className={s.tabBadge}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className={s.searchBar}>
          <Search size={18} />
          <input placeholder="ID, restoran yoki mijoz..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Restoran</th>
              <th>Mijoz</th>
              <th>Kuryer</th>
              <th>Summa</th>
              <th>To'lov</th>
              <th>Holat</th>
              <th>Vaqt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className={s.emptyRow}><ShoppingBag size={32} /><p>Buyurtmalar topilmadi</p></td></tr>
            )}
            {filtered.map((o) => {
              const st = getStatus(o.status);
              return (
                <tr key={o.id} className={selected?.id === o.id ? s.rowSelected : undefined}>
                  <td className={s.mono}>#{o.id}</td>
                  <td className={s.bold}>{o.restaurant}</td>
                  <td>{o.customer}</td>
                  <td className={s.muted}>{o.courier || '—'}</td>
                  <td className={s.mono}>{formatSum(o.total)}</td>
                  <td>
                    <span className={s.payBadge}>{o.payment === 'cash' ? '💵 Naqd' : '💳 Karta'}</span>
                  </td>
                  <td><span className={s.badge} style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                  <td className={s.muted}>{timeAgo(o.created_at)}</td>
                  <td>
                    <button className={s.viewBtn} onClick={() => setSelected(o)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className={s.overlay} onClick={() => setSelected(null)}>
          <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={s.drawerHeader}>
              <h3>Buyurtma #{selected.id}</h3>
              <button className={s.closeBtn} onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className={s.drawerBody}>
              {(() => {
                const st = getStatus(selected.status);
                return (
                  <>
                    <span className={s.badge} style={{ background: st.bg, color: st.color, alignSelf: 'flex-start' }}>{st.label}</span>
                    <div className={s.infoGrid}>
                      <div className={s.infoItem}><span className={s.infoLabel}>Restoran</span><span>{selected.restaurant}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>Mijoz</span><span>{selected.customer}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>Kuryer</span><span>{selected.courier || 'Tayinlanmagan'}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>To'lov</span><span>{selected.payment === 'cash' ? 'Naqd' : 'Karta'}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>Summa</span><span className={s.bold}>{formatSum(selected.total)}</span></div>
                      <div className={s.infoItem}><span className={s.infoLabel}>Yaratilgan</span><span>{formatDateTime(selected.created_at)}</span></div>
                    </div>
                    {ACTIVE.includes(selected.status) && (
                      <button className={s.cancelBtn} onClick={() => handleCancel(selected.id)}>
                        Buyurtmani bekor qilish
                      </button>
                    )}
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
