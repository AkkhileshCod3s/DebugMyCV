import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const SectionHeading = ({ eyebrow, title, hint }) => (
  <div className="section-heading">
    <span className="section-eyebrow">{eyebrow}</span>
    <h2 className="section-title">{title}</h2>
    {hint && <p className="section-hint">{hint}</p>}
  </div>
);

const FEATURES = [
  {
    title: 'Match score out of 100',
    text: 'A transparent, deterministic score computed on the server from matched, related and missing skills.',
    note: 'One number, fully explained. No opaque average.',
  },
  {
    title: 'Skills gap at a glance',
    text: 'See matched skills, missing skills and transferable ones, plus the job requirements your resume does not yet show.',
    note: 'Every gap is tied to the job description you pasted.',
  },
  {
    title: 'Concrete resume edits',
    text: 'Get truthful, specific improvement suggestions and suggested keywords — never invented experience.',
    note: 'Edits stay faithful to your actual history and roles.',
  },
  {
    title: 'Interview preparation',
    text: 'Receive interview questions generated for the exact role and resume you analysed.',
    note: 'Questions only cover what your resume claims.',
  },
  {
    title: 'History & daily usage',
    text: 'Reopen past analyses anytime and keep track of your remaining daily uploads and AI analyses.',
    note: 'Your counters reset at midnight in your local timezone.',
  },
  {
    title: 'Private by design',
    text: 'Resumes, job descriptions and results belong to your account and are never shared with other users.',
    note: 'Nothing is sold, shared or used to train models.',
  },
];

const STEPS = [
  { title: 'Create an account', text: 'Sign up securely — passwords are hashed and sessions are server-managed.' },
  { title: 'Add your resume', text: 'Upload a PDF or paste your resume text, then add the job description.' },
  { title: 'Analyse & improve', text: 'Get the match score, missing skills, improvements and interview questions.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggle, nightProof, toggleNightProof } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="container">
      <header className="header">
        <div className="header-left">
          <h1 className="header-title">DebugMyCV</h1>
        </div>
        <nav className="header-right" aria-label="Landing">
          <Link to="/analyze" className="header-link">
            How it works
          </Link>
          <Link to="/analyze" className="header-link">
            Sample report
          </Link>
          <button
            type="button"
            className="header-link"
            onClick={toggleNightProof}
            aria-pressed={nightProof}
            aria-label={nightProof ? 'Switch to automatic theme' : 'Switch to night proof'}
          >
            Night proof
          </button>
        </nav>
      </header>

      <section className="hero animate-in">
        <div className="hero-left">
          <span className="hero-eyebrow">01 / Upload</span>
          <h1 className="hero-title">
            Find out what your resume
            <em> actually says.</em>
          </h1>
          <p className="hero-sub">
            Upload a resume. You get a score, notes in the margin tied to the exact lines, and rewrites you can copy.
          </p>
        </div>
        <div className="hero-right">
          <div className="dropzone">
            <span className="crop-mark crop-mark-tl" aria-hidden="true"></span>
            <span className="crop-mark crop-mark-tr" aria-hidden="true"></span>
            <span className="crop-mark crop-mark-bl" aria-hidden="true"></span>
            <span className="crop-mark crop-mark-br" aria-hidden="true"></span>
            <div className="dropzone-shim" />
            <div className="dropzone-will-change">
              <span className="dropzone-label">Sheet 1 of 1</span>
              <h1 className="dropzone-title">Drop your resume on this page.</h1>
              <p className="lead">Upload a PDF or DOCX, see what the analysis actually flagged, and copy rewrites.</p>
              <div className="hero-actions">
                <Link to="/analyze" className="btn btn-primary">
                  Upload resume
                </Link>
                <span className="hero-limit">
                  PDF or DOCX · 4 <strong>MB</strong> maximum
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="features-heading">
        <SectionHeading
          eyebrow="02 / The report"
          title="Everything you need to tailor your application"
          hint="Clear, honest feedback grounded only in the resume and job description you provide."
        />
        <div className="report-rows">
          {FEATURES.map(({ title, text, note }, i) => (
            <div key={title} className="report-row">
              <span className="report-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="report-body">
                <h3 className="report-title">{title}</h3>
                <p className="report-text">{text}</p>
                {note && <p className="report-note">{note}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <SectionHeading eyebrow="02 / The report" title="How it works" hint="Three steps, about a minute." />
        <div className="report-rows">
          {STEPS.map((step, i) => (
            <div key={step.title} className="report-row">
              <span className="report-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="report-body">
                <h3 className="report-title">{step.title}</h3>
                <p className="report-text">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="privacy-heading">
        <SectionHeading eyebrow="02 / The report" title="Your resume stays yours" hint="Access to every resume, job description and analysis is restricted to your account." />
        <div className="report-rows">
          <div className="report-row">
            <span className="report-num">01</span>
            <div className="report-body">
              <h3 className="report-title">Passwords are hashed with bcrypt; sessions are HTTP-only cookies managed by the server.</h3>
            </div>
          </div>
          <div className="report-row">
            <span className="report-num">02</span>
            <div className="report-body">
              <h3 className="report-title">The Groq API key is used only on the server and is never sent to your browser.</h3>
            </div>
          </div>
          <div className="report-row">
            <span className="report-num">03</span>
            <div className="report-body">
              <h3 className="report-title">Uploads are deleted right after analysis and never stored as files.</h3>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>DebugMyCV · Resume analysis</p>
      </footer>
    </div>
  );
}
