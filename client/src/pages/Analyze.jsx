import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, ClipboardList, Sparkles, ChevronDown, Plus } from 'lucide-react';
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

  // resume source: 'upload' | 'paste' | 'existing'
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteLabel, setPasteLabel] = useState('');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const [jobs, setJobs] = useState([]);
  const [jobMode, setJobMode] = useState('existing'); // 'existing' | 'new'
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobLabel, setJobLabel] = useState('');
  const [jobText, setJobText] = useState('');

  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resumeRes, jobRes, usageRes] = await Promise.all([
        api.get('/resumes'),
        api.get('/jobs'),
        api.get('/usage/daily'),
      ]);
      setResumes(resumeRes.resumes);
      setJobs(jobRes.jobs);
      setUsage(usageRes.usage);
      if (resumeRes.resumes.length && !resumeRes.resumes.some((r) => r.id === Number(selectedResumeId))) {
        setSelectedResumeId(String(resumeRes.resumes[0].id));
      }
      if (jobRes.jobs.length && !jobRes.jobs.some((j) => j.id === Number(selectedJobId))) {
        setSelectedJobId(String(jobRes.jobs[0].id));
        setJobMode('existing');
      } else if (!jobRes.jobs.length) {
        setJobMode('new');
      }
    } catch (err) {
      setError(err.message || 'Could not load your workspace.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const uploadsExhausted = usage ? usage.uploads.remaining <= 0 && mode !== 'existing' : false;
  const analysesExhausted = usage ? usage.analyses.remaining <= 0 : false;

  const validate = () => {
    if (mode === 'upload' && !file) return 'Choose a PDF resume to upload.';
    if (mode === 'paste') {
      if (pasteText.trim().length < 50) return 'Paste at least 50 characters of resume text.';
      if (pasteText.length > MAX_CHARS) return `Resume text must be at most ${MAX_CHARS} characters.`;
    }
    if (mode === 'existing' && !selectedResumeId) return 'Select one of your saved resumes.';
    if (jobMode === 'existing' && !selectedJobId) return 'Select a job description.';
    if (jobMode === 'new') {
      if (!jobLabel.trim()) return 'Add a short label for the job.';
      if (jobText.trim().length < 30) return 'Job description must be at least 30 characters.';
      if (jobText.length > MAX_CHARS) return `Job description must be at most ${MAX_CHARS} characters.`;
    }
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
      // 1. Ensure a resume exists (counts against upload quota only when newly accepted)
      let resumeId = mode === 'existing' ? Number(selectedResumeId) : null;

      if (mode === 'upload') {
        const fd = new FormData();
        fd.append('resume', file);
        const res = await api.upload('/resumes/upload', fd);
        resumeId = res.resume.id;
        if (res.usage) setUsage(res.usage);
        setResumes((r) => [{ ...res.resume, uploadedAt: new Date().toISOString() }, ...r]);
      } else if (mode === 'paste') {
        const res = await api.post('/resumes/text', {
          text: pasteText,
          originalFilename: pasteLabel.trim() || undefined,
        });
        resumeId = res.resume.id;
        if (res.usage) setUsage(res.usage);
        setResumes((r) => [{ ...res.resume, uploadedAt: new Date().toISOString() }, ...r]);
      }

      // 2. Ensure a job description exists
      let jobDescriptionId = jobMode === 'existing' ? Number(selectedJobId) : null;
      if (jobMode === 'new') {
        const res = await api.post('/jobs', { label: jobLabel.trim(), descriptionText: jobText });
        jobDescriptionId = res.job.id;
        setJobs((j) => [{ id: res.job.id, label: res.job.label, createdAt: res.job.createdAt }, ...j]);
        setSelectedJobId(String(res.job.id));
      }

      // 3. Analyse (charges AI quota server-side)
      const result = await api.post('/analyze', { resumeId, jobDescriptionId });
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
      <div className="container page">
        <LoadingSpinner label="Loading your workspace…" />
      </div>
    );
  }

  return (
    <div className="container page animate-in">
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <h1>
            Resume <span className="violet">analysis workspace</span>
          </h1>
          <p className="muted">Pick the resume and job description you want to compare.</p>
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <form className="stack" onSubmit={submit} noValidate>
        <div className="workspace">
          {/* ── Resume side ── */}
          <GlassCard className="stack" as="section" aria-labelledby="resume-heading">
            <h2 id="resume-heading" className="card-title">
              <span className="icon-badge" aria-hidden="true">
                <FileUp size={19} strokeWidth={1.75} />
              </span>
              1 · Your resume
            </h2>

            <div className="tabs" role="tablist" aria-label="Resume source">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'upload'}
                className={`tab ${mode === 'upload' ? 'active' : ''}`}
                onClick={() => setMode('upload')}
              >
                Upload PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'paste'}
                className={`tab ${mode === 'paste' ? 'active' : ''}`}
                onClick={() => setMode('paste')}
              >
                Paste text
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'existing'}
                className={`tab ${mode === 'existing' ? 'active' : ''}`}
                onClick={() => setMode('existing')}
                disabled={resumes.length === 0}
              >
                Saved ({resumes.length})
              </button>
            </div>

            {mode === 'upload' && (
              <>
                <FileUploader file={file} onSelect={onPickFile} onClear={() => setFile(null)} disabled={submitting} error={fileError} maxMb={MAX_MB} />
                <p className="hint">
                  PDF only · max {MAX_MB} MB · text is extracted on the server. Re-analysing a saved resume never
                  counts as a new upload.
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

            {mode === 'existing' && (
              <div className="field">
                <label className="label" htmlFor="resume-select">
                  Saved resume <span className="req" aria-hidden="true">*</span>
                </label>
                <div className="input-wrap">
                  <select
                    id="resume-select"
                    className="select"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    disabled={submitting}
                    style={{ paddingRight: 44 }}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.originalFilename} · {new Date(r.uploadedAt).toLocaleDateString('en-IN')}
                      </option>
                    ))}
                  </select>
                  <span className="input-action" aria-hidden="true">
                    <ChevronDown size={17} />
                  </span>
                </div>
                <span className="hint">Re-analysing a saved resume does not use your upload quota.</span>
              </div>
            )}

            {usage && mode !== 'existing' && (
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
                You&apos;ve used all {usage.uploads.max} resume uploads for today. You can still re-analyse a saved
                resume — it does not count as a new upload.
              </div>
            )}
          </GlassCard>

          {/* ── Job side ── */}
          <GlassCard className="stack" as="section" aria-labelledby="job-heading">
            <h2 id="job-heading" className="card-title">
              <span className="icon-badge sky" aria-hidden="true">
                <ClipboardList size={19} strokeWidth={1.75} />
              </span>
              2 · Job description
            </h2>

            <div className="tabs" role="tablist" aria-label="Job description source">
              <button
                type="button"
                role="tab"
                aria-selected={jobMode === 'existing'}
                className={`tab ${jobMode === 'existing' ? 'active' : ''}`}
                onClick={() => setJobMode('existing')}
                disabled={jobs.length === 0}
              >
                Saved ({jobs.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={jobMode === 'new'}
                className={`tab ${jobMode === 'new' ? 'active' : ''}`}
                onClick={() => setJobMode('new')}
              >
                <Plus size={14} aria-hidden="true" style={{ display: 'inline' }} /> New
              </button>
            </div>

            {jobMode === 'existing' ? (
              <div className="field">
                <label className="label" htmlFor="job-select">
                  Saved job description <span className="req" aria-hidden="true">*</span>
                </label>
                <div className="input-wrap">
                  <select
                    id="job-select"
                    className="select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    disabled={submitting}
                    style={{ paddingRight: 44 }}
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                  <span className="input-action" aria-hidden="true">
                    <ChevronDown size={17} />
                  </span>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}

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

        <GlassCard className="row-between" style={{ marginTop: 4 }}>
          <p className="muted small" style={{ maxWidth: 480 }}>
            Scores are AI-generated estimates based only on your resume and this job description — they are not
            hiring decisions. {analysesExhausted && 'Your daily analysis limit has been reached.'}
          </p>
          <PrimaryButton
            type="submit"
            loading={submitting}
            disabled={
              analysesExhausted ||
              ((mode === 'upload' || mode === 'paste') && usage ? usage.uploads.remaining === 0 : false)
            }
          >
            <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" className="glow" />
            {submitting ? 'Analysing…' : 'Analyse match'}
          </PrimaryButton>
        </GlassCard>
      </form>
    </div>
  );
}
