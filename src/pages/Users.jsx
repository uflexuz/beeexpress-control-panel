import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RotateCw, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import api, { ApiError } from '../lib/api';
import { phoneFormat } from '../lib/helpers';
import s from './Users.module.css';

/** Rol -> o'zbekcha nom + badge klassi (index.css utility). */
const ROLE_META = {
  admin:   { label: 'Admin',          badge: 'badge-accent'  },
  owner:   { label: 'Restoran egasi', badge: 'badge-warning' },
  seller:  { label: 'Sotuvchi',       badge: 'badge-info'    },
  courier: { label: 'Kuryer',         badge: 'badge-success' },
  client:  { label: 'Mijoz',          badge: ''              },
};

const ROLE_TABS = [
  { key: 'all',     label: 'Hammasi' },
  { key: 'client',  label: 'Mijozlar' },
  { key: 'owner',   label: 'Egalar' },
  { key: 'seller',  label: 'Sotuvchilar' },
  { key: 'courier', label: 'Kuryerlar' },
  { key: 'admin',   label: 'Adminlar' },
];

/** Javobni ({data,meta} yoki oddiy massiv) defensiv o'qish. */
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');

export default function Users() {
  const [all, setAll] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.users({ limit: 100 });
      const list = extractList(res);
      setAll(list);
      setTotal(res?.meta?.total ?? list.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Foydalanuvchilarni yuklab bo\'lmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { all: all.length };
    for (const t of ROLE_TABS) if (t.key !== 'all') c[t.key] = 0;
    for (const u of all) {
      const r = String(u.role || '').toLowerCase();
      if (c[r] != null) c[r] += 1;
    }
    return c;
  }, [all]);

  const filtered = useMemo(() => {
    let list = all;
    if (role !== 'all') list = list.filter((u) => String(u.role || '').toLowerCase() === role);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.phone || '').includes(q) ||
        String(u.email || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [all, role, search]);

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className="page-title">Foydalanuvchilar</h1>
        {!loading && !error && (
          <div className={s.headerCount}>Jami: <strong>{total.toLocaleString('uz-UZ')}</strong></div>
        )}
      </div>

      <div className={s.toolbar}>
        <div className={s.chips}>
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              className={`chip ${role === t.key ? 'is-active' : ''}`}
              onClick={() => setRole(t.key)}
            >
              {t.label}
              {!loading && <span className="chip__count">{counts[t.key] ?? 0}</span>}
            </button>
          ))}
        </div>
        <label className={`search ${s.searchField}`}>
          <Search size={18} />
          <input
            placeholder="Ism, telefon yoki email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <div className={s.stateCard}>
          <div className="empty-state">
            <div className="empty-state__emoji"><AlertTriangle size={48} color="var(--color-error)" /></div>
            <div className="empty-state__title">Xatolik yuz berdi</div>
            <div className="empty-state__text">{error}</div>
            <button className="btn btn-primary" onClick={load}>
              <RotateCw size={16} /> Qayta urinish
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.stateCard}>
          <div className="empty-state">
            <div className="empty-state__emoji"><UsersIcon size={48} /></div>
            <div className="empty-state__title">Foydalanuvchilar topilmadi</div>
            <div className="empty-state__text">
              {search || role !== 'all'
                ? 'Filtr yoki qidiruvga mos foydalanuvchi yo\'q. Shartlarni o\'zgartiring.'
                : 'Hozircha foydalanuvchilar yo\'q.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Foydalanuvchi</th>
                <th>Telefon</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const meta = ROLE_META[String(u.role || '').toLowerCase()] || { label: u.role || '—', badge: '' };
                return (
                  <tr key={u.id ?? u.uuid}>
                    <td className="td-muted td-mono">#{u.id ?? '—'}</td>
                    <td>
                      <div className="cell">
                        <span className="avatar">{initial(u.name)}</span>
                        <div>
                          <div className="cell__title">{u.name || '—'}</div>
                          {u.email && <div className="cell__sub">{u.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="td-mono">{phoneFormat(u.phone)}</td>
                    <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Foydalanuvchi</th><th>Telefon</th><th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>
              <td><div className="skeleton skeleton-text" style={{ width: 32 }} /></td>
              <td>
                <div className="cell">
                  <span className="skeleton skeleton-circle" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: 6 }} />
                  </div>
                </div>
              </td>
              <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
              <td><div className="skeleton skeleton-text" style={{ width: 72 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
