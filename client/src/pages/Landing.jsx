import { useEffect, useState, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LandingNav from '../components/LandingNav.jsx';
import { CONSENT_VERSION } from '../config/legal.js';
import { Target, FileText, PenLine, MessageSquare, Clock, ShieldCheck, ArrowRight, User, Lock, Mail, Eye, EyeOff, Upload } from 'lucide-react';

const AFTER_AUTH_PATH = '/dashboard';

const SECTION_HEADINGS = {
  report: { eyebrow: '02 / The report', title: 'Everything you need to tailor your application' },
  how: { eyebrow: '03 / How it works', title: 'How it works' },
};

const FEATURES = [
  { icon: Target, title: 'Match score out of 100', text: 'A transparent, deterministic score computed on the server from matched, related and missing skills.', note: 'One number, fully explained. No opaque average.' },
  { icon: FileText, title: 'Skills gap at a glance', text: 'See matched skills, missing skills and transferable ones, plus the job requirements your resume does not yet show.', note: 'Every gap is tied to the job description you pasted.' },
  { icon: PenLine, title: 'Concrete resume edits', text: 'Get truthful, specific improvement suggestions and suggested keywords — never invented experience.', note: 'Edits stay faithful to your actual history and roles.' },
  { icon: MessageSquare, title: 'Interview preparation', text: 'Receive interview questions generated for the exact role and resume you analysed.', note: 'Questions only cover what your resume claims.' },
  { icon: Clock, title: 'History & daily usage', text: 'Reopen past analyses anytime and keep track of your remaining daily uploads and AI analyses.', note: 'Your counters reset at midnight in your local timezone.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Resumes, job descriptions and results belong to your account and are never shared with other users.', note: 'Nothing is sold, shared or used to train models.' },
];

const STEPS = [
  { num: '01', title: 'Create an account', text: 'Sign up securely — passwords are hashed and sessions are server-managed.' },
  { num: '02', title: 'Add your resume', text: 'Upload a PDF or paste your resume text, then add the job description.' },
  { num: '03', title: 'Analyse & improve', text: 'Get the match score, missing skills, improvements and interview questions.' },
];

export default function Landing() {
  const { user } = useAuth();
  const location = useLocation();
  const uid = useId();
  const [tab, setTab] = useState(location.pathname === '/register' ? 'register' : 'login');

  useEffect(() => {
    if (location.hash !== '#auth-card') return;
    const card = document.getElementById('auth-card');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = card.querySelector('input');
    if (input) input.focus({ preventScroll: true });
  }, [location.hash]);

  return (
    <div className="container">
      <LandingNav />

      <section className="hero">
        <div className="hero-left">
          <span className="hero-eyebrow">01 / Upload</span>
          <h1 className="hero-title">
            Find out what your resume
            <em> actually says.</em>
          </h1>
          <p className="hero-sub">Upload a resume. You get a score, notes in the margin tied to the exact lines, and rewrites you can copy.</p>
          <div className="hero-actions">
            <a href="#how-it-works" className="btn btn-secondary">
              <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
              How it works
            </a>
            <Link to="/sample" className="btn btn-secondary">
              <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
              View sample report
            </Link>
          </div>
        </div>
        <div className="hero-right">
          <div className="sheet-wrap" id="auth-card">
            <div className="sheet-frame">
              {user ? (
                <div className="sheet-form">
                  <div className="sheet-head">
                    <h2 className="sheet-title">Start with your resume.</h2>
                    <p className="sheet-sub">Upload a PDF or paste your resume text to get your match report.</p>
                  </div>
                  <Link to="/analyze" className="btn btn-primary">
                    Upload resume
                    <Upload size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="sheet-tabs" role="tablist" aria-label="Authentication">
                    <button
                      type="button"
                      role="tab"
                      id={`${uid}-tab-login`}
                      aria-controls={`${uid}-panel`}
                      aria-selected={tab === 'login'}
                      className={tab === 'login' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                      onClick={() => setTab('login')}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      role="tab"
                      id={`${uid}-tab-register`}
                      aria-controls={`${uid}-panel`}
                      aria-selected={tab === 'register'}
                      className={tab === 'register' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                      onClick={() => setTab('register')}
                    >
                      Create account
                    </button>
                  </div>
                  <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`}>
                    {tab === 'login' ? <LoginForm /> : <RegisterForm />}
                  </div>
                </>
              )}
            </div>
            <p className="legal-links">
              <Link to="/privacy">Privacy Policy</Link>
              {' · '}
              <Link to="/cookies">Cookie Policy</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="features-heading">
        <SectionHeading id="features-heading" eyebrow={SECTION_HEADINGS.report.eyebrow} title={SECTION_HEADINGS.report.title} />
        <div className="report-rows report-rows-2">
          {FEATURES.map(({ icon: Icon, title, text, note }, i) => (
            <div key={title} className="report-row">
              <span className="report-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="report-body">
                <span className="report-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
                </span>
                <h3 className="report-title">{title}</h3>
                <p className="report-text">{text}</p>
                {note && <p className="report-note">{note}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="how-it-works" aria-labelledby="how-heading">
        <SectionHeading id="how-heading" eyebrow={SECTION_HEADINGS.how.eyebrow} title={SECTION_HEADINGS.how.title} />
        <div className="report-rows report-rows-3">
          {STEPS.map((step) => (
            <div key={step.num} className="report-row">
              <span className="report-num">{step.num}</span>
              <div className="report-body">
                <h3 className="report-title">{step.title}</h3>
                <p className="report-text">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sample-close">
        <h2 className="sample-close-title">See what a report looks like.</h2>
        <Link to="/sample" className="btn btn-primary">
          View sample report
          <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function SectionHeading({ id, eyebrow, title, hint }) {
  return (
    <div className="section-head">
      {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
      <h2 id={id} className="section-title">{title}</h2>
      {hint && <p className="section-hint">{hint}</p>}
    </div>
  );
}

function LoginForm() {
  const uid = useId();
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const legalNote = (
    <p className="sheet-note">
      By signing in you accept the <Link to="/privacy">Privacy Policy</Link> and{' '}
      <Link to="/cookies">Cookie Policy</Link>.
    </p>
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      window.location.assign(AFTER_AUTH_PATH);
    } catch (err) {
      setApiError(err.message || 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="sheet-form" onSubmit={onSubmit} noValidate>
      <div className="sheet-head">
        <h2 className="sheet-title">Sign in</h2>
        <p className="sheet-sub">Welcome back — sign in to your account.</p>
      </div>

      <ErrorMessage>{apiError}</ErrorMessage>

      <div className="field">
        <label className="field-label" htmlFor={emailId}>
          <Mail size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
          Email
        </label>
        <input
          id={emailId}
          className="field-input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={set('email')}
        />
        {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor={passwordId}>
          <Lock size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
          Password
        </label>
        <div className="field-input-wrap">
          <input
            id={passwordId}
            className="field-input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            required
            value={form.password}
            onChange={set('password')}
          />
          <button
            type="button"
            className="field-input-action"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" />}
          </button>
        </div>
        {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
      </div>

      {legalNote}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        Sign in
        <ArrowRight size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
      </button>
    </form>
  );
}

function RegisterForm() {
  const uid = useId();
  const nameId = `${uid}-name`;
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!consent) next.consent = 'You must accept the Privacy Policy and Cookie Policy to register.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        consent: true,
        consentVersion: CONSENT_VERSION,
      });
      window.location.assign(AFTER_AUTH_PATH);
    } catch (err) {
      setApiError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="sheet-form" onSubmit={onSubmit} noValidate>
      <div className="sheet-head">
        <h2 className="sheet-title">Create account</h2>
        <p className="sheet-sub">Free to start — your account gives you saved resumes and history.</p>
      </div>

      <ErrorMessage>{apiError}</ErrorMessage>

      <div className="field">
        <label className="field-label" htmlFor={nameId}>
          <User size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
          Full name
        </label>
        <input
          id={nameId}
          className="field-input"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          value={form.name}
          onChange={set('name')}
        />
        {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor={emailId}>
          <Mail size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
          Email
        </label>
        <input
          id={emailId}
          className="field-input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={set('email')}
        />
        {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor={passwordId}>
          <Lock size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
          Password
        </label>
        <div className="field-input-wrap">
          <input
            id={passwordId}
            className="field-input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            value={form.password}
            onChange={set('password')}
          />
          <button
            type="button"
            className="field-input-action"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" />}
          </button>
        </div>
        <span className="hint">At least 8 characters.</span>
        {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
      </div>

      <div className="consent-row">
        <input
          id="register-consent"
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <label htmlFor="register-consent">
          I agree to the{' '}
          <Link to="/privacy" target="_blank" rel="noopener">Privacy Policy</Link> and{' '}
          <Link to="/cookies" target="_blank" rel="noopener">Cookie Policy</Link> and consent to my data being
          processed as described.
        </label>
      </div>
      {errors.consent && <span className="field-error" role="alert">{errors.consent}</span>}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !consent}>
        Create account
        <ArrowRight size={16} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
      </button>
    </form>
  );
}

function ErrorMessage({ children }) {
  if (!children) return null;
  return <div className="sheet-error" role="alert">{children}</div>;
}
