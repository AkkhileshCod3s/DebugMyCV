import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { GlassCard } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="container not-found">
      <GlassCard className="page-narrow animate-in" style={{ width: 'min(560px, 100%)' }}>
        <div className="empty-state">
          <span className="icon-badge cream" aria-hidden="true">
            <Compass size={26} strokeWidth={1.75} />
          </span>
          <h1 style={{ fontSize: '2rem' }}>Page not found</h1>
          <p className="muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/" className="btn btn-primary">
              Back to home
            </Link>
            <Link to="/dashboard" className="btn btn-ghost">
              Dashboard
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
