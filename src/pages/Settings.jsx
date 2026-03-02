import { useState } from 'react';
import {
  Save, Settings as SettingsIcon, Percent, Truck,
  DollarSign, Phone, Mail, MapPin, Bike,
} from 'lucide-react';
import { FAKE_PLATFORM_SETTINGS } from '../lib/fakeData';
import { formatSum } from '../lib/helpers';
import s from './Settings.module.css';

export default function Settings() {
  const [form, setForm] = useState(FAKE_PLATFORM_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setSaved(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Platforma sozlamalari</h1>
        <button className={`${s.saveBtn} ${saved ? s.saveBtnSaved : ''}`} onClick={handleSubmit} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saqlanmoqda...' : saved ? 'Saqlandi ✓' : 'Saqlash'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className={s.sections}>
        {/* Commission */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <Percent size={20} />
            <div><h2>Komissiya sozlamalari</h2><p>Restoranlarga komissiya stavkalari</p></div>
          </div>
          <div className={s.sectionBody}>
            <div className={s.grid}>
              <div className={s.field}>
                <label>Standart komissiya (%)</label>
                <input type="number" value={form.commission_rate} onChange={(e) => set('commission_rate', Number(e.target.value))} />
                <span className={s.hint}>Barcha yangi restoranlar uchun</span>
              </div>
              <div className={s.field}>
                <label>Minimal komissiya (%)</label>
                <input type="number" value={form.min_commission_rate} onChange={(e) => set('min_commission_rate', Number(e.target.value))} />
              </div>
              <div className={s.field}>
                <label>Maksimal komissiya (%)</label>
                <input type="number" value={form.max_commission_rate} onChange={(e) => set('max_commission_rate', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </section>

        {/* Delivery */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <Truck size={20} />
            <div><h2>Yetkazib berish</h2><p>Bazaviy narxlar va limitlar</p></div>
          </div>
          <div className={s.sectionBody}>
            <div className={s.grid}>
              <div className={s.field}>
                <label>Bazaviy yetkazish narxi (so'm)</label>
                <div className={s.inputIcon}><DollarSign size={16} /><input type="number" value={form.base_delivery_fee} onChange={(e) => set('base_delivery_fee', Number(e.target.value))} /></div>
                <span className={s.hint}>{formatSum(form.base_delivery_fee)}</span>
              </div>
              <div className={s.field}>
                <label>Bepul yetkazish chegarasi (so'm)</label>
                <div className={s.inputIcon}><DollarSign size={16} /><input type="number" value={form.free_delivery_threshold} onChange={(e) => set('free_delivery_threshold', Number(e.target.value))} /></div>
                <span className={s.hint}>{formatSum(form.free_delivery_threshold)} dan oshganda bepul</span>
              </div>
              <div className={s.field}>
                <label>Minimal buyurtma (so'm)</label>
                <div className={s.inputIcon}><DollarSign size={16} /><input type="number" value={form.min_order_amount} onChange={(e) => set('min_order_amount', Number(e.target.value))} /></div>
                <span className={s.hint}>{formatSum(form.min_order_amount)}</span>
              </div>
              <div className={s.field}>
                <label>Maksimal radius (km)</label>
                <div className={s.inputIcon}><MapPin size={16} /><input type="number" value={form.max_delivery_radius_km} onChange={(e) => set('max_delivery_radius_km', Number(e.target.value))} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* Courier pay */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <Bike size={20} />
            <div><h2>Kuryer to'lovlari</h2><p>Bazaviy to'lov va har km uchun to'lov</p></div>
          </div>
          <div className={s.sectionBody}>
            <div className={s.grid}>
              <div className={s.field}>
                <label>Bazaviy to'lov (so'm)</label>
                <div className={s.inputIcon}><DollarSign size={16} /><input type="number" value={form.courier_base_pay} onChange={(e) => set('courier_base_pay', Number(e.target.value))} /></div>
                <span className={s.hint}>{formatSum(form.courier_base_pay)} har buyurtma uchun</span>
              </div>
              <div className={s.field}>
                <label>Har km uchun (so'm)</label>
                <div className={s.inputIcon}><DollarSign size={16} /><input type="number" value={form.courier_per_km_pay} onChange={(e) => set('courier_per_km_pay', Number(e.target.value))} /></div>
                <span className={s.hint}>{formatSum(form.courier_per_km_pay)} / km</span>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <Phone size={20} />
            <div><h2>Qo'llab-quvvatlash</h2><p>Platforma aloqa ma'lumotlari</p></div>
          </div>
          <div className={s.sectionBody}>
            <div className={s.grid}>
              <div className={s.field}>
                <label>Platforma nomi</label>
                <input value={form.platform_name} onChange={(e) => set('platform_name', e.target.value)} />
              </div>
              <div className={s.field}>
                <label>Telefon</label>
                <div className={s.inputIcon}><Phone size={16} /><input value={form.support_phone} onChange={(e) => set('support_phone', e.target.value)} /></div>
              </div>
              <div className={s.field}>
                <label>Email</label>
                <div className={s.inputIcon}><Mail size={16} /><input value={form.support_email} onChange={(e) => set('support_email', e.target.value)} /></div>
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
