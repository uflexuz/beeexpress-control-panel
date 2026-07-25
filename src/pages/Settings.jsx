import { useState, useEffect, useCallback } from 'react';
import {
  User, Save, Info, Phone, Mail, Shield, Server, Hash, Globe, CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api, API_BASE_URL } from '../lib/api';
import { phoneFormat, formatDateTime } from '../lib/helpers';
import { useAuth } from '../contexts/AuthContext';
import s from './Settings.module.css';

/* ---------------------------------------------------------------------------
 * Sozlamalar:
 *   1) Admin profili — GET /user/profile (yuklash) / PUT /user/profile (saqlash).
 *      Tahrirlanadi: name, email. Faqat o'qish: telefon, rol, ID.
 *   2) Tizim haqida — statik/muhit ma'lumotlari kartasi.
 * ------------------------------------------------------------------------- */

const APP_VERSION = '1.0.0';
const ENV_LABELS = { development: 'Ishlab chiqish', production: 'Ishlab turgan' };

const ROLE_LABELS = {
  admin: 'Administrator',
  owner: 'Restoran egasi',
  seller: 'Sotuvchi',
  courier: 'Kuryer',
  client: 'Mijoz',
};

export default function Settings() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => user || null);
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.auth.me();
      if (p && (p.id || p.uuid)) {
        setProfile(p);
        setForm({ name: p.name || '', email: p.email || '' });
      }
    } catch (e) {
      setError((e && e.message) || 'Profilni yuklab bo\'lmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);

    if (!form.name.trim()) {
      setSaveError('Ism kiritilishi shart.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim() };
      const updated = await api.auth.updateProfile(payload);
      if (updated && (updated.id || updated.uuid)) {
        setProfile(updated);
        setForm({ name: updated.name || '', email: updated.email || '' });
      } else {
        setProfile((prev) => ({ ...(prev || {}), ...payload }));
      }
      setSaved(true);
    } catch (err) {
      setSaveError((err && err.message) || 'Saqlashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  // --- Yuklanish (kesh yo'q) ---
  if (loading && !profile) {
    return (
      <div className={s.page}>
        <h1 className="page-title">Sozlamalar</h1>
        <div className="card">
          <div className="skeleton skeleton-title" style={{ width: '30%', marginBottom: 20 }} />
          <div className={s.formGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 10 }} />
                <div className="skeleton skeleton-btn" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Xato (ma'lumot umuman yo'q) ---
  if (error && !profile) {
    return (
      <div className={s.page}>
        <h1 className="page-title">Sozlamalar</h1>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__emoji"><AlertTriangle size={48} color="var(--color-error)" /></div>
            <div className="empty-state__title">Profilni yuklab bo'lmadi</div>
            <div className="empty-state__text">{error}</div>
            <button className="btn btn-primary" onClick={load}>Qayta urinish</button>
          </div>
        </div>
      </div>
    );
  }

  const p = profile || {};
  const roleLabel = ROLE_LABELS[p.role] || p.role || '—';
  const envMode = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) || 'production';
  const envLabel = ENV_LABELS[envMode] || envMode;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className="page-title">Sozlamalar</h1>
      </div>

      <div className={s.grid}>
        {/* Admin profili */}
        <form className="card" onSubmit={handleSave}>
          <div className={s.cardHead}>
            <div className={s.cardIco}><User size={20} /></div>
            <div>
              <h2 className={s.cardTitle}>Admin profili</h2>
              <p className="muted">Shaxsiy ma'lumotlaringiz</p>
            </div>
          </div>

          {error && (
            <div className={`${s.alert} ${s.alertErr}`}>
              {error} — keshdagi ma'lumot ko'rsatilmoqda.
            </div>
          )}
          {saveError && <div className={`${s.alert} ${s.alertErr}`}>{saveError}</div>}
          {saved && (
            <div className={`${s.alert} ${s.alertOk}`}>
              <CheckCircle2 size={16} /> Profil saqlandi.
            </div>
          )}

          <div className={s.formGrid}>
            <label className="field">
              <span className={`field__label ${s.lbl}`}><User size={14} /> Ism *</span>
              <input
                className="input"
                placeholder="To'liq ism"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </label>

            <label className="field">
              <span className={`field__label ${s.lbl}`}><Mail size={14} /> Email</span>
              <input
                className="input"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </label>

            <div className="field">
              <span className={`field__label ${s.lbl}`}><Phone size={14} /> Telefon</span>
              <div className={s.readonly}>{phoneFormat(p.phone)}</div>
              <span className="field__hint">Telefon raqamini bu yerda o'zgartirib bo'lmaydi.</span>
            </div>

            <div className="field">
              <span className={`field__label ${s.lbl}`}><Shield size={14} /> Rol</span>
              <div className={s.readonly}>
                <span className="badge badge-accent">{roleLabel}</span>
              </div>
            </div>
          </div>

          <div className={s.formActions}>
            <button className="btn btn-primary btn-lg" type="submit" disabled={saving || !form.name.trim()}>
              <Save size={18} />
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>

        {/* Tizim haqida */}
        <div className="card">
          <div className={s.cardHead}>
            <div className={s.cardIco}><Info size={20} /></div>
            <div>
              <h2 className={s.cardTitle}>Tizim haqida</h2>
              <p className="muted">Platforma va sessiya ma'lumotlari</p>
            </div>
          </div>

          <dl className={s.infoList}>
            <div className={s.infoRow}>
              <dt className={s.infoLabel}><Globe size={15} /> Platforma</dt>
              <dd className={s.infoValue}>Bee Express — Boshqaruv paneli</dd>
            </div>
            <div className={s.infoRow}>
              <dt className={s.infoLabel}><Hash size={15} /> Versiya</dt>
              <dd className={s.infoValue}>{APP_VERSION}</dd>
            </div>
            <div className={s.infoRow}>
              <dt className={s.infoLabel}><Server size={15} /> Muhit</dt>
              <dd className={s.infoValue}>{envLabel}</dd>
            </div>
            <div className={s.infoRow}>
              <dt className={s.infoLabel}><Server size={15} /> API manzili</dt>
              <dd className={`${s.infoValue} ${s.infoMono}`}>{API_BASE_URL}</dd>
            </div>
            <div className={s.infoRow}>
              <dt className={s.infoLabel}><User size={15} /> Joriy admin</dt>
              <dd className={s.infoValue}>{p.name || '—'}</dd>
            </div>
            <div className={s.infoRow}>
              <dt className={s.infoLabel}><Hash size={15} /> Foydalanuvchi ID</dt>
              <dd className={`${s.infoValue} ${s.infoMono}`}>{p.id != null ? p.id : (p.uuid || '—')}</dd>
            </div>
            {p.created_at && (
              <div className={s.infoRow}>
                <dt className={s.infoLabel}><Info size={15} /> Ro'yxatdan o'tgan</dt>
                <dd className={s.infoValue}>{formatDateTime(p.created_at)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
