import { forwardRef, useId } from 'react';
import { AlertCircle, Info, Inbox } from 'lucide-react';

/* ── GlassCard ─────────────────────────────────────────────────────────────── */
export function GlassCard({ children, className = '', hover = false, strong = false, as: Tag = 'div', ...rest }) {
  const classes = ['glass', strong && 'glass-strong', hover && 'glass-hover', className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────────────── */
const Button = forwardRef(function Button(
  { variant = 'primary', size, block, loading, children, className = '', ...rest },
  ref,
) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} className={classes} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});

export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;

/* ── InputField ────────────────────────────────────────────────────────────── */
export function InputField({ label, error, hint, required, id, ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={inputId}>
          {label} {required && <span className="req" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className="input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? `${inputId}-hint` : undefined}
        required={required}
        {...rest}
      />
      {hint && !error && (
        <span className="hint" id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
}

/* ── TextAreaField ─────────────────────────────────────────────────────────── */
export function TextAreaField({ label, error, hint, required, id, ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={inputId}>
          {label} {required && <span className="req" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className="textarea"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        required={required}
        {...rest}
      />
      {hint && !error && (
        <span className="hint" id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
      {error && <FieldError id={`${inputId}-error`} message={error} />}
    </div>
  );
}

function FieldError({ id, message }) {
  return (
    <span className="field-error" id={id} role="alert">
      <AlertCircle size={15} aria-hidden="true" />
      {message}
    </span>
  );
}

/* ── StatusBadge ───────────────────────────────────────────────────────────── */
export function StatusBadge({ tone = 'default', children }) {
  const cls = tone === 'success' ? 'badge badge-success' : tone === 'warn' ? 'badge badge-warn' : tone === 'neutral' ? 'badge badge-neutral' : 'badge';
  return <span className={cls}>{children}</span>;
}

/* ── LoadingSpinner ────────────────────────────────────────────────────────── */
export function LoadingSpinner({ label = 'Loading…', large = false }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className={`spinner ${large ? 'spinner-lg' : ''}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/* ── SkeletonLoader ────────────────────────────────────────────────────────── */
export function SkeletonLoader({ lines = 3, height = 16 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="empty-state">
      <span className="icon-badge" aria-hidden="true">
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <h3>{title}</h3>
      {description && <p className="muted small">{description}</p>}
      {action}
    </div>
  );
}

/* ── ErrorMessage ──────────────────────────────────────────────────────────── */
export function ErrorMessage({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="alert alert-error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span style={{ flex: 1 }}>{children}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function InfoMessage({ children }) {
  if (!children) return null;
  return (
    <div className="alert alert-info" role="note">
      <Info size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
