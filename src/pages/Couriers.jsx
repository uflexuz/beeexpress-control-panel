import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RotateCw, Info, AlertTriangle, Bike } from 'lucide-react';
import api, { ApiError } from '../lib/api';
import { phoneFormat } from '../lib/helpers';
import s from './Couriers.module.css';

/**
 * Kuryerlar ro'yxati.
 *
 * Manba: GET /admin/users?role=courier → {id,uuid,name,phone,email,role,vendor_id}.
 * ⚠️ Real API kuryer uchun is_online / rating / vehicle_type / balance
 * MAYDONLARINI QAYTARMAYDI. Shu sababli "Holat / Reyting / Transport" ustunlari
 * va online/offline filtr olib tashlangan — mavjud bo'lmagan ma'lumot o'rniga
 * "—" ko'rsatib turmaslik uchun. Backend bu maydonlarni qaytara boshlaganda
 * ustunlar qayta qo'shiladi (qarang: backendGaps).
 */

/** Javobni ({data,meta} yoki oddiy massiv) defensiv o'qish. */
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kuryerlarni yuklab bo\'lmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return couriers;
    return couriers.filter((c) =>
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.phone || '').includes(q) ||
      String(c.email || '').toLowerCase().includes(q),
    );
  }, [couriers, search]);

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className="page-title">Kuryerlar</h1>
        {!loading && !error && (
          <div className={s.headerStats}>
            <span className="badge">Jami: {total.toLocaleString('uz-UZ')}</span>
          </div>
        )}
      </div>

      <div className={s.toolbar}>
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
            <div className="empty-state__emoji"><Bike size={48} /></div>
            <div className="empty-state__title">Kuryerlar topilmadi</div>
            <div className="empty-state__text">
              {search
                ? 'Qidiruvga mos kuryer yo\'q. Shartlarni o\'zgartiring.'
                : 'Hozircha kuryerlar yo\'q.'}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Kuryer</th>
                  <th>Telefon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13 }}>
            <Info size={14} />
            Online holat, reyting va transport ma'lumotlarini server hozircha qaytarmaydi.
          </p>
        </>
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
            <th>ID</th><th>Kuryer</th><th>Telefon</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
