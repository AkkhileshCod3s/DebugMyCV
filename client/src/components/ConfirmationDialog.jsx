import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DangerButton, GhostButton } from './ui.jsx';

export function ConfirmationDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onClick={() => !loading && onCancel?.()}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row">
          <span className="icon-badge" aria-hidden="true">
            <AlertTriangle size={20} strokeWidth={1.75} />
          </span>
          <h3 id="dialog-title">{title}</h3>
        </div>
        <p id="dialog-desc" className="muted small">
          {message}
        </p>
        <div className="dialog-actions">
          <GhostButton ref={cancelRef} type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </GhostButton>
          <DangerButton type="button" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </DangerButton>
        </div>
      </div>
    </div>
  );
}
