import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, LogOut, Save, Sparkles } from 'lucide-react';
import {
  GlassCard,
  InputField,
  ErrorMessage,
  PrimaryButton,
  GhostButton,
  SkeletonLoader,
} from '../components/ui.jsx';
import { UsageQuotaIndicator } from '../components/UsageQuotaIndicator.jsx';
import { ConfirmationDialog } from '../components/ConfirmationDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

const fmtDate = (iso) =>
  new Date(`${iso}${/Z$|[+-]\d{2}:\d{2}$/.test(iso) ? '' : 'Z'}`).toLocaleDateString('en-IN', {
    dateStyle: 'long',
    timeZone: 'Asia/Kolkata',
  });

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [confirmLogout, setConfirmLogout] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.get('/profile');
      setProfile(data.profile);
      setUsage(data.usage);
      setName(data.profile.name);
    } catch (err) {
      setError(err.message || 'Could not load your profile.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = async (e) => {
    e.preventDefault();
    if (savingName || name.trim().length < 2) return;
    setSavingName(true);
    try {
      const data = await api.patch('/profile', { name: name.trim() });
      setProfile(data.profile);
      setUser((u) => (u ? { ...u, name: data.profile.name } : u));
      toast.success('Name updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update your name.');
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    const next = {};
    if (!pw.current) next.current = 'Enter your current password.';
    if (pw.next.length < 8) next.next = 'New password must be at least 8 characters.';
    if (pw.confirm !== pw.next) next.confirm = 'Passwords do not match.';
    setPwErrors(next);
    if (Object.keys(next).length || savingPw) return;

    setSavingPw(true);
    try {
      await api.patch('/profile', { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed.');
    } catch (err) {
      setPwError(err.message || 'Could not change your password.');
    } finally {
      setSavingPw(false);
    }
  };

  const doLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/');
  };

  return (
    <div className="container page animate-in stack" style={{ gap: 24 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1>
            Profile &amp; <span className="violet">settings</span>
          </h1>
          <p className="muted">Manage your account details, security and daily usage.</p>
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <div className="profile-grid">
        {/* Account details */}
        <GlassCard className="stack" as="section" aria-labelledby="account-heading">
          <h2 id="account-heading" className="card-title">
            <span className="icon-badge" aria-hidden="true">
              <User size={19} strokeWidth={1.75} />
            </span>
            Account
          </h2>

          {!profile ? (
            <SkeletonLoader lines={4} />
          ) : (
            <>
              <dl style={{ margin: 0 }}>
                <div className="detail-row">
                  <dt>Email</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div className="detail-row">
                  <dt>Member since</dt>
                  <dd>{fmtDate(profile.createdAt)}</dd>
                </div>
                <div className="detail-row">
                  <dt>Session</dt>
                  <dd>Server-managed · HTTP-only cookie</dd>
                </div>
              </dl>

              <form className="stack" onSubmit={saveName}>
                <InputField
                  label="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                  disabled={savingName}
                />
                <PrimaryButton type="submit" loading={savingName} disabled={name.trim() === profile.name}>
                  <Save size={16} strokeWidth={1.75} aria-hidden="true" />
                  Save name
                </PrimaryButton>
              </form>
            </>
          )}
        </GlassCard>

        {/* Security */}
        <GlassCard className="stack" as="section" aria-labelledby="security-heading">
          <h2 id="security-heading" className="card-title">
            <span className="icon-badge mint" aria-hidden="true">
              <Lock size={19} strokeWidth={1.75} />
            </span>
            Change password
          </h2>

          <ErrorMessage>{pwError}</ErrorMessage>

          <form className="stack" onSubmit={savePassword} noValidate>
            <InputField
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              error={pwErrors.current}
              required
              disabled={savingPw}
            />
            <InputField
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              error={pwErrors.next}
              hint={!pwErrors.next ? 'At least 8 characters.' : undefined}
              required
              disabled={savingPw}
            />
            <InputField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              error={pwErrors.confirm}
              required
              disabled={savingPw}
            />
            <PrimaryButton type="submit" loading={savingPw}>
              <Lock size={16} strokeWidth={1.75} aria-hidden="true" />
              Update password
            </PrimaryButton>
          </form>
        </GlassCard>

        {/* Usage */}
        <GlassCard className="stack" as="section" aria-labelledby="usage-heading">
          <h2 id="usage-heading" className="card-title">
            <span className="icon-badge sky" aria-hidden="true">
              <Sparkles size={19} strokeWidth={1.75} className="glow" />
            </span>
            Daily usage
          </h2>
          {!usage ? (
            <SkeletonLoader lines={3} />
          ) : (
            <div className="stack" style={{ gap: 16 }}>
              <UsageQuotaIndicator
                title="Resume uploads"
                used={usage.uploads.used}
                max={usage.uploads.max}
                remaining={usage.uploads.remaining}
                kind="uploads"
              />
              <UsageQuotaIndicator
                title="AI analyses"
                used={usage.analyses.used}
                max={usage.analyses.max}
                remaining={usage.analyses.remaining}
                kind="analyses"
              />
              <p className="hint">Counters reset automatically at midnight in the {usage.timezone} timezone.</p>
            </div>
          )}
        </GlassCard>

        {/* Privacy & session */}
        <GlassCard className="stack" as="section" aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="card-title">
            <span className="icon-badge cream" aria-hidden="true">
              <ShieldCheck size={19} strokeWidth={1.75} />
            </span>
            Privacy &amp; session
          </h2>
          <ul className="bullet-list">
            <li>
              <ShieldCheck size={17} className="violet" aria-hidden="true" />
              <span>Your resumes, job descriptions and analyses are visible only to your account.</span>
            </li>
            <li>
              <ShieldCheck size={17} className="violet" aria-hidden="true" />
              <span>Passwords are hashed with bcrypt; the server never stores or logs plaintext passwords.</span>
            </li>
            <li>
              <ShieldCheck size={17} className="violet" aria-hidden="true" />
              <span>Uploaded files live in private storage and are deleted when you remove the resume.</span>
            </li>
            <li>
              <ShieldCheck size={17} className="violet" aria-hidden="true" />
              <span>The AI provider only receives resume and job text during analysis — never your credentials.</span>
            </li>
          </ul>
          <GhostButton type="button" onClick={() => setConfirmLogout(true)} style={{ alignSelf: 'flex-start' }}>
            <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            Sign out {user?.name ? `(${user.name.split(' ')[0]})` : ''}
          </GhostButton>
        </GlassCard>
      </div>

      <ConfirmationDialog
        open={confirmLogout}
        title="Sign out?"
        message="You'll need to sign in again to access your dashboard and history."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
