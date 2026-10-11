import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { SecondaryButton, LoadingSpinner, ErrorMessage } from '../components/ui.jsx';
import { api } from '../services/api.js';

const fmtDate = (iso) =>
  new Date(`${iso}${/Z$|[+-]\d{2}:\d{2}$/.test(iso) ? '' : 'Z'}`).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

function SectionHead({ label, icon: Icon }) {
  return (
    <div className="section-head">
      {label && (
        <span className="section-eyebrow">
          {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" />}
          {label}
        </span>
      )}
    </div>
  );
}

export default function AnalysisResult() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  const handleDownload = () => {
    document.title = 'DebugMyCV-report';
    window.print();
  };

  if (loading) {
    return (
      <div className="container page">
        <LoadingSpinner label="Loading report…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page stack">
        <ErrorMessage onRetry={load}>{error}</ErrorMessage>
        <div className="margin-note">
          <p className="margin-note-title">Error</p>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary no-print" onClick={load} aria-label="Retry loading this report">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const r = analysis.result || {};
  const score = analysis.matchScore ?? (r.score ?? 0);

  return (
    <div className="container results">
      <div className="page-head">
        <div className="stack g6">
          <span className="page-eyebrow">01 / Report</span>
          <h1 className="page-title">{`${isDark ? 'Results' : 'Analysis results'}`}</h1>
          <p className="hint">Reports are deleted automatically 24 hours after analysis.</p>
        </div>
        <nav className="header-right no-print" aria-label="Results">
          <Link to="/analyze" className="header-link">
            Upload new resume
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            Download report (PDF)
          </button>
        </nav>
      </div>

      <div className="results-top">
        <div className="results-top-left">
          <p className="results-meta">
            Report · {analysis.resumeName || 'deleted resume'}
          </p>
        </div>
        <div className="results-top-right">
          <div className="score-block">
            <p className="score-label">Overall score</p>
            <p className="score-value" aria-label={`Overall score ${score} out of 100`}>
              {score}
              <span className="score-out-of">/ 100</span>
            </p>
          </div>
          <div className="scale">
            <div className="scale-baseline">
              <div
                className="scale-pointer"
                style={{ left: `${(score / 100) * 100}%` }}
              />
            </div>
            <p className="scale-pointer-label">{score}%</p>
            <p className="scale-label">0</p>
            <p className="scale-label">50</p>
            <p className="scale-label">100</p>
          </div>
        </div>
      </div>

      <div className="sub-scores">
        {r.impact !== undefined && (
          <div className="sub-score">
            <p className="sub-score-label">Impact</p>
            <p className="sub-score-value">{r.impact}</p>
            <div className="sub-score-track">
              <div className="sub-score-fill" style={{ width: `${Math.min(100, Math.max(0, Number(r.impact) || 0))}%` }} />
            </div>
          </div>
        )}
        {r.clarity !== undefined && (
          <div className="sub-score">
            <p className="sub-score-label">Clarity</p>
            <p className="sub-score-value">{r.clarity}</p>
            <div className="sub-score-track">
              <div className="sub-score-fill" style={{ width: `${Math.min(100, Math.max(0, Number(r.clarity) || 0))}%` }} />
            </div>
          </div>
        )}
        {r.structure !== undefined && (
          <div className="sub-score">
            <p className="sub-score-label">Structure</p>
            <p className="sub-score-value">{r.structure}</p>
            <div className="sub-score-track">
              <div className="sub-score-fill" style={{ width: `${Math.min(100, Math.max(0, Number(r.structure) || 0))}%` }} />
            </div>
          </div>
        )}
        {r.keywords !== undefined && (
          <div className="sub-score">
            <p className="sub-score-label">Keywords</p>
            <p className="sub-score-value">{r.keywords}</p>
            <div className="sub-score-track">
              <div className="sub-score-fill" style={{ width: `${Math.min(100, Math.max(0, Number(r.keywords) || 0))}%` }} />
            </div>
          </div>
        )}
      </div>

      <section className="resume-notes">
        <SectionHead label="01 / Summary" icon={Link} />
        <div className="resume-page-cell">
          <p className="resume-page-label">Resume</p>
          <p className="resume-body">{r.summary || r.resumeSummary || 'No summary was generated for this resume.'}</p>
        </div>
      </section>

      <section className="notes-section">
        <SectionHead label="02 / Margin notes" icon={Link} />
        <div className="resume-notes-wrap">
          <div className="resume-page-cell">
            <p className="resume-page-label">Resume</p>
            {r.findings && r.findings.length > 0 ? (
              r.findings.map((f, i) => {
                const kind = f.problem ? 'problem' : f.strength ? 'strength' : f.caution ? 'caution' : 'neutral';
                return (
                  <div key={`f${i}`} className="resume-body">
                    <span
                      className={`annotated annotated-${kind}`}
                      data-note={f.text || f.note || ''}
                    >
                      <sup>{i + 1}</sup> {f.text || f.note || ''}
                    </span>
                    {f.note && (
                      <div className="note-cell">
                        <div className="note-row">
                          <span className="leader" aria-hidden="true" />
                          <div>
                            <p className={`note-label note-label-${kind}`}>
                              {i + 1} · {f.title || 'Note'}
                            </p>
                            <p className="note-text">{f.note}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="resume-body">No margin notes were generated for this resume.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rewrites">
        <SectionHead label="3 / Tracked rewrites" icon={Sparkles} />
        {r.rewritePairs && r.rewritePairs.length > 0 ? (
          <div className="rewrite-rows">
            {r.rewritePairs.map((pair, i) => (
              <div key={`p${i}`} className="rewrite-row">
                <p className="rewrite-note">Note {i + 1}</p>
                <p className="rewrite-original">{pair.original || 'No original line supplied.'}</p>
                <p className="rewrite-improved">{pair.improved || 'No improved line supplied.'}</p>
                <div className="rewrite-actions">
                  <SecondaryButton type="button" className="no-print">Copy rewrite</SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No tracked rewrites were generated for this resume.</p>
        )}
        <div className="rewrite-actions no-print">
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            Download report (PDF)
          </button>
        </div>
      </section>

    </div>
  );
}
