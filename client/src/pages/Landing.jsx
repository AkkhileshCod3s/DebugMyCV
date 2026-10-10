import { Link } from 'react-router-dom';
import {
  ScanSearch,
  Sparkles,
  ShieldCheck,
  FileText,
  ClipboardList,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
} from 'lucide-react';
import { GlassCard } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon: BarChart3,
    tone: '',
    title: 'Match score out of 100',
    text: 'A transparent, deterministic score computed on the server from matched, related and missing skills.',
  },
  {
    icon: ClipboardList,
    tone: 'sky',
    title: 'Skills gap at a glance',
    text: 'See matched skills, missing skills and transferable ones, plus the job requirements your resume does not yet show.',
  },
  {
    icon: FileText,
    tone: 'mint',
    title: 'Concrete resume edits',
    text: 'Get truthful, specific improvement suggestions and suggested keywords — never invented experience.',
  },
  {
    icon: Sparkles,
    tone: 'cream',
    title: 'Interview preparation',
    text: 'Receive interview questions generated for the exact role and resume you analysed.',
  },
  {
    icon: Clock,
    tone: 'pink',
    title: 'History & daily usage',
    text: 'Reopen past analyses anytime and keep track of your remaining daily uploads and AI analyses.',
  },
  {
    icon: Lock,
    tone: '',
    title: 'Private by design',
    text: 'Resumes, job descriptions and results belong to your account and are never shared with other users.',
  },
];

const STEPS = [
  { title: 'Create an account', text: 'Sign up securely — passwords are hashed and sessions are server-managed.' },
  { title: 'Add your resume', text: 'Upload a PDF or paste your resume text, then add the job description.' },
  { title: 'Analyse & improve', text: 'Get the match score, missing skills, improvements and interview questions.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="container">
      <section className="hero animate-in">
        <span className="hero-badge">
          <Sparkles size={15} strokeWidth={1.75} aria-hidden="true" />
          AI resume &amp; job matching
        </span>
        <h1>
          Know how well your resume <span className="violet">matches the job</span> before you apply
        </h1>
        <p className="lead">
          CareerLens AI compares your resume with a job description and shows the match score, matched and
          missing skills, resume strengths and specific improvements — plus interview questions for that
          exact role.
        </p>
        <div className="hero-actions">
          <Link to={user ? '/analyze' : '/register'} className="btn btn-primary">
            <ScanSearch size={18} strokeWidth={1.75} aria-hidden="true" />
            {user ? 'Start an analysis' : 'Create free account'}
            <ArrowRight size={17} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          {!user && (
            <Link to="/login" className="btn btn-secondary">
              Sign in
            </Link>
          )}
        </div>
        <p className="muted small">AI-generated scores are estimates — not hiring decisions or guarantees.</p>
      </section>

      <section className="section" aria-labelledby="features-heading">
        <div className="section-head">
          <h2 id="features-heading">Everything you need to tailor your application</h2>
          <p className="muted">Clear, honest feedback grounded only in the resume and job description you provide.</p>
        </div>
        <div className="grid">
          {FEATURES.map(({ icon: Icon, tone, title, text }) => (
            <GlassCard key={title} className="feature-card glass-hover" as="article">
              <span className={`icon-badge ${tone}`} aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h3>{title}</h3>
              <p className="muted small">{text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="section-head">
          <h2 id="how-heading">How it works</h2>
          <p className="muted">Three steps, about a minute.</p>
        </div>
        <div className="steps">
          {STEPS.map((step, i) => (
            <GlassCard key={step.title} className="step glass-hover" as="article">
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p className="muted small">{step.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="privacy-heading">
        <GlassCard className="glass-strong privacy-note" as="article" style={{ maxWidth: 860, margin: '0 auto' }}>
          <span className="icon-badge mint" aria-hidden="true">
            <ShieldCheck size={24} strokeWidth={1.75} />
          </span>
          <div className="stack" style={{ gap: 8 }}>
            <h2 id="privacy-heading">Your resume stays yours</h2>
            <ul className="bullet-list">
              <li>
                <CheckCircle2 size={17} className="violet" aria-hidden="true" />
                <span>Access to every resume, job description and analysis is restricted to your account.</span>
              </li>
              <li>
                <CheckCircle2 size={17} className="violet" aria-hidden="true" />
                <span>Passwords are hashed with bcrypt; sessions are HTTP-only cookies managed by the server.</span>
              </li>
              <li>
                <CheckCircle2 size={17} className="violet" aria-hidden="true" />
                <span>The Groq API key is used only on the server and is never sent to your browser.</span>
              </li>
              <li>
                <CheckCircle2 size={17} className="violet" aria-hidden="true" />
                <span>Uploads are stored privately and can be deleted permanently from your history and profile.</span>
              </li>
            </ul>
            <div className="row" style={{ marginTop: 6 }}>
              <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary">
                {user ? 'Go to dashboard' : 'Get started free'}
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
