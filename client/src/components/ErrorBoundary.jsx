import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { GlassCard, PrimaryButton } from './ui.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container page">
        <GlassCard className="page-narrow animate-in" style={{ margin: '0 auto' }}>
          <div className="empty-state">
            <span className="icon-badge pink" aria-hidden="true">
              <AlertCircle size={26} strokeWidth={1.75} />
            </span>
            <h2>Something went wrong</h2>
            <p className="muted small">
              An unexpected error interrupted this screen. Your data is safe — try reloading the page.
            </p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <PrimaryButton type="button" onClick={() => window.location.reload()}>
                Reload page
              </PrimaryButton>
              <Link to="/dashboard" className="btn btn-ghost">
                Go to dashboard
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }
}
