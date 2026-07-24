import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import s from './Login.module.css';

/** Faqat raqamlarni qoldiradi, 998 prefiksini olib tashlaydi, 9 raqamgacha kesadi. */
function normalizeLocal(value) {
  let d = String(value).replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  return d.slice(0, 9);
}

/** Lokal raqamni ko'rinish uchun formatlaydi: `90 123 45 67`. */
function formatLocal(digits) {
  const d = digits.slice(0, 9);
  const parts = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(' ');
}

export default function Login() {
  const { user, login } = useAuth();
  const [phone, setPhone] = useState(''); // faqat 9 ta lokal raqam
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 9) {
      setError('Telefon raqamini to\'liq kiriting.');
      return;
    }
    if (!password) {
      setError('Parolni kiriting.');
      return;
    }

    setLoading(true);
    try {
      await login(`+998${phone}`, password);
      // Muvaffaqiyatda `user` o'zgaradi -> yuqoridagi <Navigate> ishga tushadi.
    } catch (err) {
      setError(err?.message || 'Kirishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <div className={s.brandMark}>🐝</div>
          <h1 className={s.title}>Bee Express Admin</h1>
          <p className={s.subtitle}>Boshqaruv paneliga kirish</p>
        </div>

        <form onSubmit={handleSubmit} className={s.form} noValidate>
          <label className={s.field}>
            <span className={s.label}>Telefon raqami</span>
            <div className={s.phoneWrap}>
              <span className={s.phonePrefix}>+998</span>
              <input
                className={s.phoneInput}
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                value={formatLocal(phone)}
                onChange={(e) => setPhone(normalizeLocal(e.target.value))}
                placeholder="90 123 45 67"
                autoFocus
              />
            </div>
          </label>

          <label className={s.field}>
            <span className={s.label}>Parol</span>
            <div className={s.passwordWrap}>
              <input
                className={s.passwordInput}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className={s.eyeBtn}
                onClick={() => setShow((v) => !v)}
                title={show ? 'Yashirish' : "Ko'rsatish"}
                aria-label={show ? 'Parolni yashirish' : "Parolni ko'rsatish"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className={s.error}>{error}</div>}

          <button
            type="submit"
            className={`btn btn-primary btn-lg btn-block ${s.submit}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={s.spin} /> Kirilmoqda...
              </>
            ) : (
              'Kirish'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
