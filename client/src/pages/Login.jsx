import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { GlassCard, PrimaryButton, InputField, ErrorMessage } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      await login(form);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sheet-wrap">
      <GlassCard className="sheet-card animate-in" strong>
        <div className="sheet-head">
          <span className="sheet-icon" aria-hidden="true">
            <LogIn size={22} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
          </span>
          <h1 className="sheet-title">Sign in</h1>
          <p className="sheet-sub">Welcome back — sign in to continue to your dashboard.</p>
        </div>

        <ErrorMessage>{apiError}</ErrorMessage>

        <form className="sheet-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <span className="field-label">
              <Mail size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
              Email
            </span>
            <InputField
              label=""
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />
          </div>

          <div className="field">
            <span className="field-label">
              <Lock size={15} strokeWidth={1.5} color="currentColor" aria-hidden="true" />
              Password
            </span>
            <div className="field-input-wrap">
              <input
                id="login-password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
                value={form.password}
                onChange={set('password')}
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="field-input-action"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} color="currentColor" aria-hidden="true" /> : <Eye size={18} strokeWidth={1.5} color="currentColor" aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <span className="field-error" id="login-password-error" role="alert">{errors.password}</span>}
          </div>

          <PrimaryButton type="submit" loading={submitting} block>
            <LogIn size={17} strokeWidth={1.75} aria-hidden="true" />
            {submitting ? 'Signing in…' : 'Sign in'}
          </PrimaryButton>
        </form>

        <p className="muted small center">
          No account yet? <Link to="/register" onClick={() => document.getElementById('sheet-tabs')?.scrollIntoView({ behavior: 'smooth' })}>Create one</Link>
        </p>
      </GlassCard>
    </div>
  );
}
