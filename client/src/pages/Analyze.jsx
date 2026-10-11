import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GlassCard,
  PrimaryButton,
  InputField,
  TextAreaField,
  ErrorMessage,
  LoadingSpinner,
} from '../components/ui.jsx';
import { FileUploader } from '../components/FileUploader.jsx';
import { UsageQuotaIndicator } from '../components/UsageQuotaIndicator.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

const MAX_MB = 5;
const MAX_CHARS = 20000;

export default function Analyze() {
  const navigate = useNavigate();
  const toast = useToast();

  // resume source: 'upload' | 'paste'
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteLabel, setPasteLabel] = useState('');
  const [jobLabel, setJobLabel] = useState('');
  const [jobText, setJobText] = useState('');
  const [aiConsent, setAiConsent] = useState(false);

  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const usageRes = await api.get('/usage/daily');
      setUsage(usageRes.usage);
    } catch (err) {
      setError(err.message || 'Could not load your workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const uploadsExhausted = usage ? usage.uploads.remaining <= 0 : false;
  const analysesExhausted = usage ? usage.analyses.remaining <= 0 : false;

  const validate = () => {
    if (mode === 'upload' && !file) return 'Choose a PDF resume to upload.';
    if (mode === 'paste') {
      if (pasteText.trim().length < 50) return 'Paste at least 50 characters of resume text.';
      if (pasteText.length > MAX_CHARS) return `Resume text must be at most ${MAX_CHARS} characters.`;
    }
    if (!jobLabel.trim()) return 'Add a short label for the job.';
    if (jobText.trim().length < 30) return 'Job description must be at least 30 characters.';
    if (jobText.length > MAX_CHARS) return `Job description must be at most ${MAX_CHARS} characters.`;
    if (!aiConsent) return 'Consent to AI processing is required to run the analysis.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the resume from this request (upload quota is charged exactly as before)
      let resumeId = null;

      if (mode === 'upload') {
        const fd = new FormData();
        fd.append('resume', file);
        fd.append('aiConsent', 'true');
        const res = await api.upload('/resumes/upload', fd);
        resumeId = res.resume.id;
        if (res.usage) setUsage(res.usage);
      } else {
        const res = await api.post('/resumes/text', {
          text: pasteText,
          originalFilename: pasteLabel.trim() || undefined,
        });
        resumeId = res.resume.id;
        if (res.usage) setUsage(res.usage);
      }

      // 2. Create the job description from this request
      const jobRes = await api.post('/jobs', { label: jobLabel.trim(), descriptionText: jobText });
      const jobDescriptionId = jobRes.job.id;

      // 3. Analyse (charges AI quota server-side)
      const result = await api.post('/analyze', { resumeId, jobDescriptionId, aiConsent: true });
      toast.success('Analysis complete.');
      navigate(`/analyses/${result.analysis.id}`);
    } catch (err) {
      if (err?.status === 429) toast.error(err.message);
      setError(err.message || 'Analysis failed. Please try again.');
      try {
        const usageRes = await api.get('/usage/daily');
        setUsage(usageRes.usage);
      } catch {
        /* keep previous usage */
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onPickFile = (picked) => {
    setFileError('');
    if (!/\.pdf$/i.test(picked.name)) {
      setFileError('Only PDF files are accepted.');
      return;
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      setFileError(`File exceeds the ${MAX_MB} MB limit.`);
      return;
    }
    setFile(picked);
  };

  if (loading) {
    return (
      <div className="container page app-page">
        <LoadingSpinner label="Loading your workspace…" />
      </div>
    );
  }

  return (
    <div className="container page app-page animate-in">
      <div className="page-head">
        <div className="stack g6">
          <span className="page-eyebrow">01 / Analyze</span>
          <h1>
            Resume <span className="text-accent">analysis workspace</span>
          </h1>
          <p className="page-lede">Add your resume and the job description you want to compare.</p>
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <form className="stack" onSubmit={submit} noValidate>
        <div className="workspace">
          {/* ── Resume side ── */}
          <GlassCard className="stack" as="section" aria-labelledby="resume-heading">
            <h2 id="resume-heading" className="section-title-block">
              <span className="card-eyebrow">01 / Resume</span>
              <span className="card-heading">Resume</span>
            </h2>

            <div className="tabs" role="tablist" aria-label="Resume source">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'upload'}
                className={mode === 'upload' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => setMode('upload')}
              >
                Upload PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'paste'}
                className={mode === 'paste' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => setMode('paste')}
              >
                Paste text
              </button>
            </div>

            {mode === 'upload' && (
              <>
                <FileUploader file={file} onSelect={onPickFile} onClear={() => setFile(null)} disabled={submitting} error={fileError} maxMb={MAX_MB} />
                <p className="hint">
                  PDF only · max {MAX_MB} MB · text is extracted on the server.
                </p>
              </>
            )}

            {mode === 'paste' && (
              <>
                <InputField
                  label="Label (optional)"
                  placeholder="e.g. Resume — Frontend"
                  value={pasteLabel}
                  onChange={(e) => setPasteLabel(e.target.value)}
                  maxLength={255}
                  disabled={submitting}
                />
                <TextAreaField
                  label="Resume text"
                  placeholder="Paste your resume content here…"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  maxLength={MAX_CHARS}
                  required
                  disabled={submitting}
                  hint={`${pasteText.length} / ${MAX_CHARS} characters`}
                />
              </>
            )}

            {usage && (
              <UsageQuotaIndicator
                title="Resume uploads today"
                used={usage.uploads.used}
                max={usage.uploads.max}
                remaining={usage.uploads.remaining}
                kind="uploads"
              />
            )}
            {uploadsExhausted && usage && (
              <div className="alert alert-error" role="alert">
                You&apos;ve used all {usage.uploads.max} resume uploads for today. Please try again after midnight
                (Asia/Kolkata).
              </div>
            )}
          </GlassCard>

          {/* ── Job side — always visible form ── */}
          <GlassCard className="stack" as="section" aria-labelledby="job-heading">
            <h2 id="job-heading" className="section-title-block">
              <span className="card-eyebrow">02 / Job description</span>
              <span className="card-heading">Job description</span>
            </h2>

            <InputField
              label="Job title / label"
              placeholder="e.g. Senior Frontend Engineer — Acme"
              value={jobLabel}
              onChange={(e) => setJobLabel(e.target.value)}
              maxLength={160}
              required
              disabled={submitting}
            />
            <TextAreaField
              label="Job description"
              placeholder="Paste the responsibilities, requirements and skills from the posting…"
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              maxLength={MAX_CHARS}
              required
              disabled={submitting}
              hint={`${jobText.length} / ${MAX_CHARS} characters`}
            />

            {usage && (
              <UsageQuotaIndicator
                title="AI analyses today"
                used={usage.analyses.used}
                max={usage.analyses.max}
                remaining={usage.analyses.remaining}
                kind="analyses"
              />
            )}
            {analysesExhausted && usage && (
              <div className="alert alert-error" role="alert">
                You&apos;ve used all {usage.analyses.max} AI analyses for today. Please try again after midnight
                (Asia/Kolkata).
              </div>
            )}
          </GlassCard>
        </div>

        <p className="page-section-label">03 / Analyze</p>
        <GlassCard className="stack">
          <p className="muted small">
            Scores are AI-generated estimates based only on your resume and this job description — they are not
            hiring decisions. {analysesExhausted && 'Your daily analysis limit has been reached.'}
          </p>
          <div className="consent-row">
            <input
              id="ai-consent"
              type="checkbox"
              required
              checked={aiConsent}
              onChange={(e) => setAiConsent(e.target.checked)}
            />
            <label htmlFor="ai-consent">
              I consent to my resume and job description being sent to a third-party AI service (Groq) to generate
              this analysis. They are deleted automatically 24 hours after analysis.
            </label>
          </div>
          <PrimaryButton
            type="submit"
            loading={submitting}
            disabled={
              !aiConsent ||
              analysesExhausted ||
              (mode === 'upload' || mode === 'paste' ? usage ? usage.uploads.remaining === 0 : false : false)
            }
          >
            {submitting ? 'Analysing…' : 'Analyse match'}
          </PrimaryButton>
        </GlassCard>
      </form>
    </div>
  );
}
