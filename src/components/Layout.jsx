import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Store, ShoppingBag, Users, Bike,
  Wallet, Settings, LogOut, ChevronLeft, Bell, Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import s from './Layout.module.css';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/restaurants', icon: Store,           label: 'Restoranlar'          },
  { to: '/orders',      icon: ShoppingBag,     label: 'Buyurtmalar'          },
  { to: '/users',       icon: Users,           label: 'Foydalanuvchilar'     },
  { to: '/couriers',    icon: Bike,            label: 'Kuryerlar'            },
  { to: '/finance',     icon: Wallet,          label: 'Moliya'               },
  { to: '/settings',    icon: Settings,        label: 'Sozlamalar'           },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      const m = window.innerWidth < 768;
      setMobile(m);
      if (m) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (mobile) setCollapsed(true);
  }, [location, mobile]);

  return (
    <div className={s.layout}>
      {/* Sidebar */}
      <aside className={`${s.sidebar} ${collapsed ? s.sidebarCollapsed : ''}`}>
        {/* Brand */}
        <div className={s.brand}>
          <div className={s.brandIcon}><Shield size={22} /></div>
          {!collapsed && <span className={s.brandText}>Bee Express<small>Control Panel</small></span>}
        </div>

        {/* Collapse toggle */}
        <button
          className={`${s.collapseBtn} ${collapsed ? s.collapseBtnRotated : ''}`}
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Yoyish' : "Yig'ish"}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Nav */}
        <nav className={s.nav}>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${s.navItem} ${isActive ? s.navItemActive : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className={s.sidebarBottom}>
          <div className={s.userCard}>
            <div className={s.avatar}>{user?.name?.charAt(0) || 'A'}</div>
            {!collapsed && (
              <div className={s.userInfo}>
                <div className={s.userName}>{user?.name}</div>
                <div className={s.userRole}>Super Admin</div>
              </div>
            )}
          </div>
          <button className={s.logoutBtn} onClick={logout} title="Chiqish">
            <LogOut size={18} />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>

      </aside>

      {/* Main */}
      <div className={s.main}>
        <header className={s.header}>
          <div className={s.headerLeft}>
            {NAV.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/')?.label
              || NAV.find((n) => n.end && location.pathname === n.to)?.label
              || 'Dashboard'}
          </div>
          <div className={s.headerRight}>
            <button className={s.notifBtn}>
              <Bell size={20} />
              <span className={s.notifDot} />
            </button>
          </div>
        </header>
        <main className={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
