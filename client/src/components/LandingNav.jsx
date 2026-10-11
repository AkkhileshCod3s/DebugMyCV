import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function LandingNav({ showBack = false, variant = 'landing' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const isApp = variant === 'app';

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // Logout request failed — the local user is already cleared by AuthContext.
    }
    toast.success('Signed out.');
    navigate('/', { replace: true });
  };

  const navClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <header className={`header site-nav ${isApp ? 'site-nav-app' : ''}`}>
      <div className="header-left">
        <Link
          to={isApp ? '/dashboard' : '/'}
          className="header-title logo-link"
          aria-label="DebugMyCV home"
        >
          <Logo size={28} />
        </Link>
      </div>
      {isApp && (
        <nav className="nav-app" aria-label="Primary">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/analyze" className={navClass}>
            Analyze
          </NavLink>
          <NavLink to="/history" className={navClass}>
            History
          </NavLink>
          <NavLink to="/profile" className={navClass}>
            Profile
          </NavLink>
        </nav>
      )}
      <div className="header-right">
        {showBack && (
          <Link to="/" className="header-link nav-back">
            <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            Back to home
          </Link>
        )}
        <ThemeToggle />
        {isApp ? (
          <button type="button" className="btn btn-secondary nav-signout" onClick={handleSignOut}>
            Sign out
          </button>
        ) : user ? (
          <Link to="/analyze" className="btn btn-secondary">
            Open analyzer
          </Link>
        ) : (
          <Link to="/register#auth-card" className="btn btn-primary">
            Get started
          </Link>
        )}
      </div>
    </header>
  );
}
