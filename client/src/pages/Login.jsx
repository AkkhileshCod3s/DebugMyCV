import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
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
    <div className="container auth-wrap">
      <GlassCard className="auth-card animate-in" strong>
        <div className="auth-head">
          <span className="icon-badge" aria-hidden="true" style={{ margin: '0 auto' }}>
            <Sparkles size={22} strokeWidth={1.75} />
          </span>
          <h1 style={{ fontSize: '1.7rem' }}>Welcome back</h1>
          <p className="muted small">Sign in to continue to your dashboard.</p>
        </div>

        <ErrorMessage>{apiError}</ErrorMessage>

        <form className="stack" onSubmit={onSubmit} noValidate>
          <InputField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />

          <div className="field">
            <label className="label" htmlFor="login-password">
              Password <span className="req" aria-hidden="true">*</span>
            </label>
            <div className="input-wrap">
              <input
                id="login-password"
                className="input"
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
                className="input-action"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="field-error" id="login-password-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <PrimaryButton type="submit" loading={submitting} block>
            <LogIn size={17} strokeWidth={1.75} aria-hidden="true" />
            {submitting ? 'Signing in…' : 'Sign in'}
          </PrimaryButton>
        </form>

        <p className="muted small center">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </GlassCard>
    </div>
  );
}
