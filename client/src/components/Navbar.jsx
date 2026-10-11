import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, History, User, LogOut, ScanSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/');
  };

  const links = user
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/analyze', label: 'Analyze', icon: ScanSearch },
        { to: '/history', label: 'History', icon: History },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [];

  return (
    <header className="navbar">
      <div className="container">
        <div className="nav-inner">
          <Link to="/" className="brand logo-link" aria-label="DebugMyCV home">
            <Logo size={28} />
          </Link>

          <nav className="nav-links nav-desktop" aria-label="Primary">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            {pathname !== '/sample' && <ThemeToggle />}
            {user ? (
              <>
                <button type="button" className="btn btn-primary btn-sm nav-desktop" onClick={handleLogout}>
                  <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                  Sign out
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon nav-toggle"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                  aria-label={open ? 'Close menu' : 'Open menu'}
                >
                  {open ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="row" style={{ gap: 8 }}>
                <Link to="/login" className="btn btn-ghost btn-sm nav-desktop">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav
          id="mobile-menu"
          className={`mobile-menu ${open ? 'open' : ''}`}
          aria-label="Mobile"
          hidden={!open}
        >
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          {user ? (
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
              Sign out
            </button>            ) : (
              <NavLink to="/login" className="nav-link">
                <User size={18} strokeWidth={1.75} aria-hidden="true" />
                Sign in
              </NavLink>
            )}
        </nav>
      </div>
    </header>
  );
}
