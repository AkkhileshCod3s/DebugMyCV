import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trash2, Eye, Inbox, ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react';
import {
  GlassCard,
  ErrorMessage,
  EmptyState,
  SkeletonLoader,
  PrimaryButton,
  GhostButton,
  StatusBadge,
} from '../components/ui.jsx';
import { ConfirmationDialog } from '../components/ConfirmationDialog.jsx';
import { scoreLabel } from '../components/MatchScore.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

const fmtDate = (iso) =>
  new Date(`${iso}${/Z$|[+-]\d{2}:\d{2}$/.test(iso) ? '' : 'Z'}`).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

const PAGE_SIZE = 10;

const remainingTime = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  const total = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
};

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const query = searchParams.get('q') || '';

  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.get(`/analyses?page=${page}&limit=${PAGE_SIZE}`);
      setItems(data.analyses);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err.message || 'Could not load your history.');
      setItems([]);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const filtered = (items || []).filter((a) => {
    if (!query.trim()) return true;
    const hay = `${a.jobLabel} ${a.resumeName} ${a.matchScore}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.del(`/analyses/${pendingDelete.id}`);
      toast.success('Analysis deleted.');
      setPendingDelete(null);
      if (filtered.length === 1 && page > 1) setParam('page', String(page - 1));
      else load();
    } catch (err) {
      toast.error(err.message || 'Could not delete this analysis.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container page app-page animate-in stack g20">
      <div className="page-head mb0">
        <div className="stack g6">
          <span className="page-eyebrow">01 / History</span>
          <h1>
            Analysis <span className="text-accent">history</span>
          </h1>
          <p className="page-lede">{total} analysis{total === 1 ? '' : 'es'} saved to your account.</p>
          <p className="hint">Reports are deleted automatically 24 hours after analysis.</p>
        </div>
        <Link to="/analyze" className="btn btn-primary">
          New analysis
        </Link>
      </div>

      <div className="search-bar">
        <label className="sr-only" htmlFor="history-search">
          Search history
        </label>
        <div className="input-wrap">
          <input
            id="history-search"
            className="input"
            type="search"
            placeholder="Search by job label or resume…"
            defaultValue={query}
            onChange={(e) => setParam('q', e.target.value)}
          />
          <span className="input-action" aria-hidden="true">
            <Search size={17} />
          </span>
        </div>
      </div>

      <ErrorMessage onRetry={load}>{error}</ErrorMessage>

      {items === null ? (
        <GlassCard>
          <SkeletonLoader lines={5} height={20} />
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={query ? Search : HistoryIcon}
            title={query ? 'No matching analyses' : 'No analyses yet'}
            description={
              query
                ? 'Try a different search term.'
                : 'Run your first resume ↔ job comparison to build your history.'
            }
            action={
              query ? null : (
                <Link to="/analyze" className="btn btn-primary btn-sm">
                  Start an analysis
                </Link>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="stack g14">
          {filtered.map((a) => (
            <article key={a.id} className="history-item">
              <span className="score-chip" aria-label={`Score ${a.matchScore} out of 100`}>
                {a.matchScore}
              </span>
              <div className="history-body">
                <div className="row g10">
                  <strong>{a.jobLabel}</strong>
                  <StatusBadge tone={a.matchScore >= 70 ? 'success' : a.matchScore >= 45 ? 'neutral' : 'warn'}>
                    {scoreLabel(a.matchScore)}
                  </StatusBadge>
                </div>
                <span className="muted small">
                  {a.resumeName} · {fmtDate(a.createdAt)}
                  {remainingTime(a.expiresAt) ? ` · ${remainingTime(a.expiresAt)}` : ''}
                </span>
              </div>
              <div className="history-actions">
                <Link to={`/analyses/${a.id}`} className="btn btn-secondary btn-sm">
                  <Eye size={15} strokeWidth={1.75} aria-hidden="true" /> View
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPendingDelete(a)}
                  aria-label={`Delete analysis for ${a.jobLabel}`}
                >
                  <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!query && totalPages > 1 && (
        <div className="pagination">
          <GhostButton
            type="button"
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
          >
            <ChevronLeft size={16} aria-hidden="true" /> Previous
          </GhostButton>
          <span className="muted small" aria-live="polite">
            Page {page} of {totalPages}
          </span>
          <GhostButton
            type="button"
            disabled={page >= totalPages}
            onClick={() => setParam('page', String(page + 1))}
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </GhostButton>
        </div>
      )}

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete this analysis?"
        message={`The result for “${pendingDelete?.jobLabel}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete analysis"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
