import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { GlassCard } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="container not-found">
      <GlassCard className="page-narrow nw560 animate-in">
        <div className="empty-state">
          <span className="icon-badge" aria-hidden="true">
            <Compass size={26} strokeWidth={1.75} />
          </span>
          <h1 className="h1-sm">Page not found</h1>
          <p className="muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <div className="row row-center">
            <Link to="/" className="btn btn-primary">
              Back to home
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              Dashboard
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
