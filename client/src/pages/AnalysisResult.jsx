import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lightbulb,
  KeyRound,
  MessageSquareQuote,
  Target,
  Download,
} from 'lucide-react';
import {
  GlassCard,
  LoadingSpinner,
  ErrorMessage,
  GhostButton,
  PrimaryButton,
  StatusBadge,
} from '../components/ui.jsx';
import { MatchScore, scoreLabel } from '../components/MatchScore.jsx';
import { SkillTagList } from '../components/SkillTag.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

const fmtDate = (iso) =>
  new Date(`${iso}${/Z$|[+-]\d{2}:\d{2}$/.test(iso) ? '' : 'Z'}`).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

function Section({ icon: Icon, tone = '', title, children }) {
  return (
    <GlassCard className="stack" as="section">
      <h2 className="card-title">
        <span className={`icon-badge ${tone}`} aria-hidden="true">
          <Icon size={19} strokeWidth={1.75} />
        </span>
        {title}
      </h2>
      {children}
    </GlassCard>
  );
}

function Bullets({ items, tone = 'ok', empty = 'Nothing identified.' }) {
  if (!items?.length) return <p className="muted small">{empty}</p>;
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'bad' ? XCircle : Lightbulb;
  const cls = tone === 'bad' ? 'field-error' : tone === 'idea' ? 'violet' : 'violet';
  return (
    <ul className="bullet-list">
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 24)}`}>
          <Icon size={17} className={tone === 'bad' ? '' : cls} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/analyses/${id}`);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message || 'Could not load this analysis.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadJson = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerlens-analysis-${analysis.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Result downloaded.');
  };

  if (loading) return <div className="container page"><LoadingSpinner label="Loading analysis…" /></div>;

  if (error) {
    return (
      <div className="container page stack">
        <ErrorMessage onRetry={load}>{error}</ErrorMessage>
        <div className="row">
          <GhostButton type="button" onClick={() => navigate('/history')}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to history
          </GhostButton>
        </div>
      </div>
    );
  }

  const r = analysis.result || {};
  const requirements = r.requirements || [];

  return (
    <div className="container page animate-in stack" style={{ gap: 24 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div className="stack" style={{ gap: 6 }}>
          <GhostButton type="button" onClick={() => navigate('/history')} style={{ alignSelf: 'flex-start' }}>
            <ArrowLeft size={16} aria-hidden="true" /> History
          </GhostButton>
          <h1>
            Match <span className="violet">analysis</span>
          </h1>
          <div className="meta-row">
            <span>Resume: {analysis.resumeName}</span>
            <span>Job: {analysis.jobLabel}</span>
            <span>{fmtDate(analysis.createdAt)}</span>
            <span>Model: {analysis.modelName}</span>
          </div>
        </div>
        <div className="row">
          <GhostButton type="button" onClick={downloadJson}>
            <Download size={16} aria-hidden="true" /> Export JSON
          </GhostButton>
          <Link to="/analyze" className="btn btn-primary">
            <ScanSearch size={17} strokeWidth={1.75} aria-hidden="true" /> New analysis
          </Link>
        </div>
      </div>

      {/* Score hero */}
      <GlassCard strong className="result-hero">
        <MatchScore score={analysis.matchScore} size={180} />
        <div className="result-copy">
          <div className="row" style={{ gap: 10 }}>
            <h2 style={{ margin: 0 }}>{scoreLabel(analysis.matchScore)}</h2>
            <StatusBadge tone={analysis.matchScore >= 70 ? 'success' : analysis.matchScore >= 45 ? 'neutral' : 'warn'}>
              Estimate only
            </StatusBadge>
          </div>
          <p className="muted">{r.scoreExplanation || 'No explanation was returned for this score.'}</p>
          <p className="hint">
            This score is computed on the server from matched, related and missing skills plus demonstrated job
            requirements. It is an estimate — not a hiring decision or guarantee.
          </p>
        </div>
      </GlassCard>

      {r.resumeSummary && (
        <GlassCard className="stack" style={{ gap: 6 }}>
          <h2 className="card-title">Candidate snapshot</h2>
          <p className="muted">{r.resumeSummary}</p>
        </GlassCard>
      )}

      <div className="grid-2">
        <Section icon={CheckCircle2} tone="mint" title="Matched skills">
          <SkillTagList items={r.matchedSkills} kind="matched" emptyLabel="No clearly matched skills found." />
        </Section>

        <Section icon={XCircle} tone="pink" title="Missing skills">
          <SkillTagList items={r.missingSkills} kind="missing" emptyLabel="Nothing missing — good coverage." />
        </Section>

        <Section icon={Sparkles} tone="" title="Related / transferable skills">
          <SkillTagList items={r.relatedSkills} kind="related" emptyLabel="No related skills identified." />
        </Section>

        <Section icon={KeyRound} tone="cream" title="Suggested keywords">
          <SkillTagList
            items={r.suggestedKeywords}
            kind="keyword"
            emptyLabel="No extra keywords suggested."
          />
          <p className="hint">Only add keywords that are genuinely true for your experience.</p>
        </Section>
      </div>

      <div className="grid-2">
        <Section icon={CheckCircle2} tone="mint" title="Resume strengths">
          <Bullets items={r.strengths} empty="No specific strengths were identified." />
        </Section>

        <Section icon={Lightbulb} tone="sky" title="Improvement suggestions">
          <Bullets items={r.improvements} tone="idea" empty="No improvements were suggested." />
        </Section>
      </div>

      <Section icon={Target} tone="pink" title="Job requirements not demonstrated">
        {requirements.length > 0 ? (
          <ul className="bullet-list">
            {requirements.map((req, i) => (
              <li key={`${i}-${req.requirement.slice(0, 24)}`}>
                {req.demonstrated ? (
                  <CheckCircle2 size={17} className="violet" aria-hidden="true" />
                ) : (
                  <XCircle size={17} aria-hidden="true" style={{ color: '#e05260' }} />
                )}
                <span>
                  {req.requirement}{' '}
                  <StatusBadge tone={req.demonstrated ? 'success' : 'warn'}>
                    {req.demonstrated ? 'Demonstrated' : 'Not demonstrated'}
                  </StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        ) : r.requirementsNotMet?.length ? (
          <Bullets items={r.requirementsNotMet} tone="bad" />
        ) : (
          <p className="muted small">The model did not break the job description into requirements.</p>
        )}
        {r.requirementsNotMet?.length > 0 && requirements.length > 0 && (
          <details>
            <summary className="label" style={{ cursor: 'pointer', marginTop: 4 }}>
              Narrative summary of unmet requirements
            </summary>
            <div style={{ marginTop: 8 }}>
              <Bullets items={r.requirementsNotMet} tone="bad" />
            </div>
          </details>
        )}
      </Section>

      <Section icon={MessageSquareQuote} tone="" title="Interview preparation questions">
        <Bullets items={r.interviewQuestions} tone="idea" empty="No questions were generated." />
      </Section>

      <div className="row" style={{ justifyContent: 'center' }}>
        <Link to="/analyze" className="btn btn-primary">
          <ScanSearch size={17} strokeWidth={1.75} aria-hidden="true" /> Analyse another pair
        </Link>
        <Link to="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
        <Link to="/history" className="btn btn-ghost">
          All history
        </Link>
      </div>
    </div>
  );
}
