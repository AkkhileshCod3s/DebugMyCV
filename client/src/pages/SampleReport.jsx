import { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingNav from '../components/LandingNav.jsx';
import { ArrowRight } from 'lucide-react';

const SUB_SCORES = [
  { label: 'Impact', value: 68 },
  { label: 'Clarity', value: 81 },
  { label: 'Structure', value: 77 },
  { label: 'Keywords', value: 62 },
];

const NOTES = [
  {
    n: 1,
    kind: 'problem',
    label: '1 · Generic phrasing',
    text: 'Buzzwords without evidence — the rewrite names a measurable outcome instead.',
  },
  {
    n: 2,
    kind: 'problem',
    label: '2 · Duty, not outcome',
    text: 'Lists responsibility rather than result — the rewrite shows how the dashboards are used.',
  },
  {
    n: 3,
    kind: 'strength',
    label: '3 · Strong line',
    text: 'A concrete percentage and method; this is the line a recruiter remembers.',
  },
  {
    n: 4,
    kind: 'strength',
    label: '4 · Good coverage',
    text: 'Tests for the main flows show ownership of quality, not just feature work.',
  },
  {
    n: 5,
    kind: 'caution',
    label: '5 · Thin keywords',
    text: 'No accessibility testing, performance tooling or server-side rendering is listed.',
  },
];

const REWRITES = [
  {
    original: 'Passionate about solving problems and delivering results in fast-paced environments.',
    improved:
      'Frontend engineer who cut checkout drop-off by 18% and built the reporting dashboards the product team plans sprints from.',
  },
  {
    original: 'Responsible for building weekly dashboards for the product team.',
    improved: 'Built five weekly dashboards the product team uses to set sprint priorities.',
  },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — keep the button label unchanged */
    }
  };

  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={onCopy}>
      {copied ? 'Copied' : 'Copy rewrite'}
    </button>
  );
}

export default function SampleReport() {
  return (
    <div className="container page sample-wrap">
      <LandingNav showBack />

      <div className="page-head">
        <h1 className="sample-title">Sample report</h1>
        <p className="sample-kicker">Sample report · Example data</p>
        <p className="sample-meta">Resume · Aarav_Mehta_Resume.pdf</p>
      </div>

      <section className="sample-score-row" aria-label="Overall score">
        <div className="score-block">
          <p className="sample-label">Overall score</p>
          <p className="sample-score" aria-label="Overall score 74 out of 100">
            <span>74</span>
            <span className="sample-out-of">/ 100</span>
          </p>
        </div>
        <div className="sample-scale" aria-hidden="true">
          <div className="sample-baseline">
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} className="sample-tick" style={{ left: `${i * 10}%` }} />
            ))}
            <div className="sample-pointer" style={{ left: '74%' }} />
          </div>
          <div className="sample-scale-labels">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </section>

      <div className="sample-sub-scores">
        {SUB_SCORES.map((s) => (
          <div key={s.label} className="sample-sub-score">
            <div className="sample-sub-row">
              <span className="sample-sub-label">{s.label}</span>
              <span className="sample-sub-value">{s.value}</span>
            </div>
            <div className="sample-sub-track">
              <div className="sample-sub-fill" style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <section className="sample-section">
        <p className="sample-section-label">01 / Resume</p>
        <div className="sample-resume-grid">
          <article className="sample-sheet">
            <h2 className="sheet-name">Aarav Mehta</h2>
            <p className="sheet-role">Frontend Engineer</p>
            <p className="sheet-contact">aarav.mehta@example.com · +00 00000 00000 · Pune, India · github.com/example</p>

            <p className="sheet-section-label">Summary</p>
            <p className="sheet-body">
              <span className="annotated problem">
                Frontend engineer with four years of experience building component-driven web apps in React. Passionate
                about solving problems and delivering results in fast-paced environments.
                <sup>1</sup>
              </span>
            </p>

            <p className="sheet-section-label">Experience</p>
            <div className="sheet-job">
              <p className="sheet-job-title">Frontend Engineer, Northwind Labs (fictional), 2022 – present</p>
              <ul className="sheet-bullets">
                <li>
                  <span className="annotated problem">
                    Responsible for building weekly dashboards for the product team.
                    <sup>2</sup>
                  </span>
                </li>
                <li>
                  <span className="annotated strength">
                    Reduced checkout drop-off by 18% by redesigning the funnel UI and running three A/B tests.
                    <sup>3</sup>
                  </span>
                </li>
                <li>
                  <span className="annotated strength">
                    Wrote unit and integration tests covering the main user flows.
                    <sup>4</sup>
                  </span>
                </li>
              </ul>
            </div>
            <div className="sheet-job">
              <p className="sheet-job-title">Junior Developer, Brightside Studio (fictional), 2020 – 2022</p>
              <ul className="sheet-bullets">
                <li>Built reusable form components used across six client projects.</li>
                <li>Fixed 120+ UI bugs and improved Lighthouse performance scores from 62 to 91.</li>
              </ul>
            </div>

            <p className="sheet-section-label">Projects</p>
            <p className="sheet-body">Weather Board: a React app that shows forecasts for saved cities; used by 300 monthly users.</p>

            <p className="sheet-section-label">Education</p>
            <p className="sheet-body">B.Tech, Computer Engineering, Example University, 2020</p>

            <p className="sheet-section-label">Skills</p>
            <p className="sheet-body">
              <span className="annotated caution">
                React, TypeScript, JavaScript, HTML, CSS, Jest, REST APIs, Git
                <sup>5</sup>
              </span>
            </p>
          </article>

          <aside className="sample-notes">
            {NOTES.map((note) => (
              <div key={note.n} className="sample-note">
                <span className={`sample-note-leader ${note.kind}`} aria-hidden="true" />
                <p className="sample-note-label">{note.label}</p>
                <p className="sample-note-text">{note.text}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="sample-section">
        <p className="sample-section-label">02 / Tracked rewrites</p>
        <div className="rewrite-rows">
          {REWRITES.map((pair, i) => (
            <div key={pair.original} className="rewrite-row">
              <p className="rewrite-note">Rewrite {i + 1}</p>
              <p className="rewrite-original">{pair.original}</p>
              <p className="rewrite-improved">{pair.improved}</p>
              <div className="rewrite-actions">
                <CopyButton text={pair.improved} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sample-close">
        <h2 className="sample-close-title">Ready for your own report?</h2>
        <Link to="/register#auth-card" className="btn btn-primary">
          Create your own report
          <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <p className="legal-links">
        <Link to="/privacy">Privacy Policy</Link>
        {' · '}
        <Link to="/cookies">Cookie Policy</Link>
      </p>
    </div>
  );
}
