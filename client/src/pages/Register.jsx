import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import { GlassCard, PrimaryButton, InputField, ErrorMessage } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      toast.success('Account created — welcome to CareerLens AI!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Could not create your account. Please try again.');
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
          <h1 style={{ fontSize: '1.7rem' }}>Create your account</h1>
          <p className="muted small">Free to start. Your resumes stay private to your account.</p>
        </div>

        <ErrorMessage>{apiError}</ErrorMessage>

        <form className="stack" onSubmit={onSubmit} noValidate>
          <InputField
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />
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
            <label className="label" htmlFor="reg-password">
              Password <span className="req" aria-hidden="true">*</span>
            </label>
            <div className="input-wrap">
              <input
                id="reg-password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                value={form.password}
                onChange={set('password')}
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={errors.password ? 'reg-password-error' : 'reg-password-hint'}
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
            {!errors.password && (
              <span className="hint" id="reg-password-hint">
                At least 8 characters.
              </span>
            )}
            {errors.password && (
              <span className="field-error" id="reg-password-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <InputField
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            name="confirm"
            autoComplete="new-password"
            placeholder="Repeat your password"
            required
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
          />

          <PrimaryButton type="submit" loading={submitting} block>
            <UserPlus size={17} strokeWidth={1.75} aria-hidden="true" />
            {submitting ? 'Creating account…' : 'Create account'}
          </PrimaryButton>
        </form>

        <p className="muted small center">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </GlassCard>
    </div>
  );
}
