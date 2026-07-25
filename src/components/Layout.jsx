import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Store, Users, Bike,
  Wallet, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BrandMark from './BrandMark';
import s from './Layout.module.css';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Boshqaruv',        end: true },
  { to: '/orders',      icon: ShoppingBag,     label: 'Buyurtmalar'                 },
  { to: '/restaurants', icon: Store,           label: 'Restoranlar'                 },
  { to: '/users',       icon: Users,           label: 'Foydalanuvchilar'            },
  { to: '/couriers',    icon: Bike,            label: 'Kuryerlar'                   },
  { to: '/finance',     icon: Wallet,          label: 'Moliya'                      },
  { to: '/settings',    icon: Settings,        label: 'Sozlamalar'                  },
];

/** Joriy yo'l bo'yicha sahifa nomini topadi. */
function pageTitle(pathname) {
  const match = NAV.find((n) =>
    n.end ? pathname === n.to : pathname === n.to || pathname.startsWith(`${n.to}/`),
  );
  return match ? match.label : 'Boshqaruv';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false); // mobil sidebar

  // Sahifa almashsa mobil sidebar yopiladi.
  useEffect(() => {
    setOpen(false);
  }, [location]);

  const title = pageTitle(location.pathname);
  const adminName = user?.name || 'Administrator';

  return (
    <div className={s.layout}>
      {/* Mobil overlay */}
      {open && <div className={s.overlay} onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ''}`}>
        <div className={s.brand}>
          <BrandMark size={40} className={s.brandMark} />
          <span className={s.brandText}>
            Bee Express
            <small>Admin panel</small>
          </span>
        </div>

        <nav className={s.nav}>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${s.navItem} ${isActive ? s.navItemActive : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className={s.main}>
        <header className={s.header}>
          <div className={s.headerLeft}>
            <button
              className={s.menuBtn}
              onClick={() => setOpen((v) => !v)}
              aria-label="Menyu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className={s.pageTitle}>{title}</h1>
          </div>

          <div className={s.headerRight}>
            <div className={s.adminBox}>
              <div className={s.adminAvatar}>{adminName.charAt(0).toUpperCase()}</div>
              <div className={s.adminMeta}>
                <span className={s.adminName}>{adminName}</span>
                <span className={s.adminRole}>Administrator</span>
              </div>
            </div>
            <button className={s.logoutBtn} onClick={logout} title="Chiqish">
              <LogOut size={18} />
              <span className={s.logoutLabel}>Chiqish</span>
            </button>
          </div>
        </header>

        <main className={s.content}>
          <div className={s.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
