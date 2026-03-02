import { useState, useMemo } from 'react';
import { Search, Users as UsersIcon, Ban, CheckCircle, Phone, Mail, ShoppingBag } from 'lucide-react';
import { FAKE_USERS } from '../lib/fakeData';
import { formatSum, formatCompact, formatDate } from '../lib/helpers';
import s from './Users.module.css';

export default function Users() {
  const [users, setUsers] = useState(FAKE_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = users;
    if (statusFilter !== 'all') list = list.filter((u) => u.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }, [users, statusFilter, search]);

  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => u.status === 'active').length,
    blocked: users.filter((u) => u.status === 'blocked').length,
  }), [users]);

  const toggleBlock = (id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' } : u)));
  };

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Foydalanuvchilar</h1>
        <div className={s.headerStat}>Jami: <strong>{users.length.toLocaleString()}</strong></div>
      </div>

      <div className={s.toolbar}>
        <div className={s.tabs}>
          {[
            { key: 'all', label: 'Hammasi' },
            { key: 'active', label: 'Faol' },
            { key: 'blocked', label: 'Bloklangan' },
          ].map(({ key, label }) => (
            <button key={key} className={`${s.tab} ${statusFilter === key ? s.tabActive : ''}`} onClick={() => setStatusFilter(key)}>
              {label} <span className={s.tabBadge}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className={s.searchBar}>
          <Search size={18} />
          <input placeholder="Ism, telefon yoki email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>Buyurtmalar</th>
              <th>Jami xarajat</th>
              <th>Holat</th>
              <th>Ro'yxatdan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className={s.emptyRow}><UsersIcon size={32} /><p>Foydalanuvchilar topilmadi</p></td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className={s.userCell}>
                    <div className={s.avatar}>{u.name.charAt(0)}</div>
                    <span className={s.userName}>{u.name}</span>
                  </div>
                </td>
                <td className={s.mono}><Phone size={13} className={s.cellIcon} /> {u.phone}</td>
                <td><Mail size={13} className={s.cellIcon} /> {u.email}</td>
                <td className={s.mono}><ShoppingBag size={13} className={s.cellIcon} /> {u.orders_count}</td>
                <td className={s.mono}>{formatCompact(u.total_spent)}</td>
                <td>
                  <span
                    className={s.badge}
                    style={{
                      background: u.status === 'active' ? '#E6F9ED' : '#FFF0EE',
                      color: u.status === 'active' ? '#00B33C' : '#FA3E2C',
                    }}
                  >
                    {u.status === 'active' ? 'Faol' : 'Bloklangan'}
                  </span>
                </td>
                <td className={s.muted}>{formatDate(u.created_at)}</td>
                <td>
                  <button
                    className={u.status === 'active' ? s.blockBtn : s.unblockBtn}
                    onClick={() => toggleBlock(u.id)}
                    title={u.status === 'active' ? 'Bloklash' : 'Blokdan chiqarish'}
                  >
                    {u.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
