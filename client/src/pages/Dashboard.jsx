import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ScanSearch,
  FileUp,
  ClipboardList,
  History,
  User,
  BarChart3,
  Sparkles,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { GlassCard, EmptyState, ErrorMessage, SkeletonLoader, StatusBadge } from '../components/ui.jsx';
import { MatchScore, scoreLabel } from '../components/MatchScore.jsx';
import { UsageQuotaIndicator } from '../components/UsageQuotaIndicator.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const fmtDate = (iso) =>
  new Date(`${iso}${/Z$|[+-]\d{2}:\d{2}$/.test(iso) ? '' : 'Z'}`).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [usage, setUsage] = useState(null);
  const [analyses, setAnalyses] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [usageRes, analysesRes] = await Promise.all([
        api.get('/usage/daily'),
        api.get('/analyses?limit=5'),
      ]);
      setUsage(usageRes.usage);
      setAnalyses(analysesRes.analyses);
    } catch (err) {
      setError(err.message || 'Could not load your dashboard.');
      setUsage((u) => u ?? null);
      setAnalyses((a) => a ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const latest = analyses?.[0] || null;

  return (
    <div className="container page animate-in">
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <h1>
            Hi {firstName}, <span className="violet">let&apos;s find your match</span>
          </h1>
          <p className="muted">Upload a resume, add a job description and get a clear compatibility picture.</p>
        </div>
        <Link to="/analyze" className="btn btn-primary">
          <ScanSearch size={18} strokeWidth={1.75} aria-hidden="true" />
          New analysis
        </Link>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <section aria-labelledby="quick-heading" className="stack" style={{ marginBottom: 24 }}>
        <h2 id="quick-heading" className="sr-only">
          Quick actions
        </h2>
        <div className="quick-actions">
          <GlassCard hover className="action-card" as="button" onClick={() => navigate('/analyze')}>
            <span className="icon-badge" aria-hidden="true">
              <FileUp size={21} strokeWidth={1.75} />
            </span>
            <span className="action-body">
              <span className="action-title">Add a resume</span>
              <span className="action-sub">Upload a PDF or paste text</span>
            </span>
          </GlassCard>
          <GlassCard hover className="action-card" as="button" onClick={() => navigate('/analyze')}>
            <span className="icon-badge sky" aria-hidden="true">
              <ClipboardList size={21} strokeWidth={1.75} />
            </span>
            <span className="action-body">
              <span className="action-title">Add a job description</span>
              <span className="action-sub">Paste the role you&apos;re targeting</span>
            </span>
          </GlassCard>
          <GlassCard hover className="action-card" as="button" onClick={() => navigate('/history')}>
            <span className="icon-badge mint" aria-hidden="true">
              <History size={21} strokeWidth={1.75} />
            </span>
            <span className="action-body">
              <span className="action-title">Past analyses</span>
              <span className="action-sub">Reopen previous results</span>
            </span>
          </GlassCard>
          <GlassCard hover className="action-card" as="button" onClick={() => navigate('/profile')}>
            <span className="icon-badge cream" aria-hidden="true">
              <User size={21} strokeWidth={1.75} />
            </span>
            <span className="action-body">
              <span className="action-title">Profile &amp; settings</span>
              <span className="action-sub">Name, password, privacy</span>
            </span>
          </GlassCard>
        </div>
      </section>

      <div className="grid" style={{ marginBottom: 24 }}>
        <GlassCard className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Latest match score</span>
            <span className="icon-badge" aria-hidden="true">
              <BarChart3 size={20} strokeWidth={1.75} />
            </span>
          </div>
          {analyses === null ? (
            <SkeletonLoader lines={2} />
          ) : latest ? (
            <div className="row" style={{ gap: 16 }}>
              <MatchScore score={latest.matchScore} size={110} />
              <div className="stack" style={{ gap: 6 }}>
                <strong>{scoreLabel(latest.matchScore)}</strong>
                <span className="muted small">{latest.jobLabel}</span>
                <Link to={`/analyses/${latest.id}`} className="small">
                  View analysis <ArrowRight size={13} aria-hidden="true" style={{ display: 'inline' }} />
                </Link>
              </div>
            </div>
          ) : (
            <p className="muted small">No analyses yet — your first score will appear here.</p>
          )}
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Today&apos;s usage (Asia/Kolkata)</span>
            <span className="icon-badge sky" aria-hidden="true">
              <Sparkles size={20} strokeWidth={1.75} className="glow" />
            </span>
          </div>
          {usage === null ? (
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
            </div>
          )}
        </GlassCard>
      </div>

      <section aria-labelledby="recent-heading" className="stack">
        <div className="row-between">
          <h2 id="recent-heading">Recent analyses</h2>
          <Link to="/history" className="btn btn-ghost btn-sm">
            View all
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <GlassCard>
          {analyses === null ? (
            <SkeletonLoader lines={4} />
          ) : analyses.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No analyses yet"
              description="Upload a resume and paste a job description to see your first match score."
              action={
                <Link to="/analyze" className="btn btn-primary btn-sm">
                  Start your first analysis
                </Link>
              }
            />
          ) : (
            <div className="recent-list">
              {analyses.map((a) => (
                <Link key={a.id} to={`/analyses/${a.id}`} className="recent-item" style={{ color: 'inherit' }}>
                  <span className="score-chip">{a.matchScore}</span>
                  <span className="recent-body">
                    <span className="recent-title">{a.jobLabel}</span>
                    <span className="muted small">
                      {a.resumeName} · {fmtDate(a.createdAt)}
                    </span>
                  </span>
                  <StatusBadge tone={a.matchScore >= 70 ? 'success' : a.matchScore >= 45 ? 'neutral' : 'warn'}>
                    {scoreLabel(a.matchScore)}
                  </StatusBadge>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
