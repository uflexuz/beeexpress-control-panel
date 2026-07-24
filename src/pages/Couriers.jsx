import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RotateCw } from 'lucide-react';
import api, { ApiError } from '../lib/api';
import { phoneFormat, VEHICLE_MAP } from '../lib/helpers';
import s from './Couriers.module.css';

const STATUS_TABS = [
  { key: 'all',     label: 'Hammasi' },
  { key: 'online',  label: 'Online' },
  { key: 'offline', label: 'Offline' },
];

/** Javobni ({data,meta} yoki oddiy massiv) defensiv o'qish. */
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

/* Kuryer maydonlari user obyektida to'g'ridan-to'g'ri yoki `courier`
   ichida kelishi mumkin — defensiv o'qiymiz. */
const onlineOf = (c) => {
  const v = c.is_online ?? c.courier?.is_online ?? c.online;
  return typeof v === 'boolean' ? v : null;
};
const ratingOf = (c) => c.rating ?? c.courier?.rating ?? null;
const vehicleOf = (c) => c.vehicle_type ?? c.courier?.vehicle_type ?? c.vehicle ?? null;

const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res = await api.admin.users({ role: 'courier', limit: 100 });
      // Server rol paramini e'tiborsiz qoldirsa — mijoz tomonida ham filtrlaymiz.
      // Rol maydoni umuman bo'lmasa (server allaqachon filtrlagan) qatorlarni saqlaymiz.
      const list = extractList(res).filter((u) => {
        const r = u.role == null ? null : String(u.role).toLowerCase();
        return r == null || r === 'courier';
      });
      setCouriers(list);
      setTotal(res?.meta?.total ?? list.length);
      if (silent) setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof ApiError ? e.message : 'Kuryerlarni yuklab bo\'lmadi.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Boshlang'ich yuklash + is_online ni jonli ushlab turish uchun polling (15s).
  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 15000);
    return () => clearInterval(id);
  }, [load]);

  const counts = useMemo(() => {
    let online = 0, offline = 0;
    for (const c of couriers) {
      const v = onlineOf(c);
      if (v === true) online += 1;
      else if (v === false) offline += 1;
    }
    return { all: couriers.length, online, offline };
  }, [couriers]);

  const filtered = useMemo(() => {
    let list = couriers;
    if (statusFilter === 'online') list = list.filter((c) => onlineOf(c) === true);
    else if (statusFilter === 'offline') list = list.filter((c) => onlineOf(c) === false);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.phone || '').includes(q),
      );
    }
    return list;
  }, [couriers, statusFilter, search]);

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className="page-title">Kuryerlar</h1>
        {!loading && !error && (
          <div className={s.headerStats}>
            <span className="badge badge-success">Online: {counts.online}</span>
            <span className="badge">Offline: {counts.offline}</span>
          </div>
        )}
      </div>

      <div className={s.toolbar}>
        <div className={s.chips}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              className={`chip ${statusFilter === t.key ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
              {!loading && <span className="chip__count">{counts[t.key] ?? 0}</span>}
            </button>
          ))}
        </div>
        <label className={`search ${s.searchField}`}>
          <Search size={18} />
          <input
            placeholder="Ism yoki telefon..."
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
            <div className="empty-state__emoji">⚠️</div>
            <div className="empty-state__title">Xatolik yuz berdi</div>
            <div className="empty-state__text">{error}</div>
            <button className="btn btn-primary" onClick={() => load()}>
              <RotateCw size={16} /> Qayta urinish
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.stateCard}>
          <div className="empty-state">
            <div className="empty-state__emoji">🛵</div>
            <div className="empty-state__title">Kuryerlar topilmadi</div>
            <div className="empty-state__text">
              {search || statusFilter !== 'all'
                ? 'Filtr yoki qidiruvga mos kuryer yo\'q. Shartlarni o\'zgartiring.'
                : 'Hozircha kuryerlar yo\'q.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kuryer</th>
                <th>Telefon</th>
                <th>Holat</th>
                <th>Reyting</th>
                <th>Transport</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const online = onlineOf(c);
                const rating = ratingOf(c);
                const vehicle = vehicleOf(c);
                return (
                  <tr key={c.id ?? c.uuid}>
                    <td className="td-muted td-mono">#{c.id ?? '—'}</td>
                    <td>
                      <div className="cell">
                        <span className="avatar avatar-round">{initial(c.name)}</span>
                        <div>
                          <div className="cell__title">{c.name || '—'}</div>
                          {c.email && <div className="cell__sub">{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="td-mono">{phoneFormat(c.phone)}</td>
                    <td>
                      {online === true ? (
                        <span className="status-pill status-pill--delivered">Online</span>
                      ) : online === false ? (
                        <span className="status-pill status-pill--neutral">Offline</span>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>
                    <td>
                      {rating != null && !isNaN(rating) ? (
                        <span className={s.rating}>⭐ {Number(rating).toFixed(1)}</span>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>
                    <td>
                      {vehicle ? (VEHICLE_MAP[vehicle] || vehicle) : <span className="td-muted">—</span>}
                    </td>
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
            <th>ID</th><th>Kuryer</th><th>Telefon</th><th>Holat</th><th>Reyting</th><th>Transport</th>
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
              <td><div className="skeleton skeleton-text" style={{ width: 68 }} /></td>
              <td><div className="skeleton skeleton-text" style={{ width: 48 }} /></td>
              <td><div className="skeleton skeleton-text" style={{ width: 96 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
