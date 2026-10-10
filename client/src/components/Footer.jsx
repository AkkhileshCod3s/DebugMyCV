import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="stack" style={{ gap: 8, maxWidth: 340 }}>
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Sparkles size={18} strokeWidth={1.75} />
            </span>
            CareerLens AI
          </Link>
          <p className="muted small">
            Understand how well your resume matches a job description. AI-generated scores are estimates,
            not hiring decisions.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/register">Create account</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/analyze">Analyze resume</Link>
          <Link to="/history">History</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </div>
      <div className="container" style={{ marginTop: 20 }}>
        <p className="muted small">© {new Date().getFullYear()} CareerLens AI. Your resume stays private to your account.</p>
      </div>
    </footer>
  );
}
