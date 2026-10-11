import { Link } from 'react-router-dom';
import LandingNav from '../components/LandingNav.jsx';
import { LEGAL_LAST_UPDATED, OWNER_NAME, COMPANY_NAME, CONTACT_EMAIL } from '../config/legal.js';

const YEAR = new Date().getFullYear();

export default function Privacy() {
  return (
    <div className="container">
      <LandingNav />
      <div className="legal-page animate-in">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="legal-summary">
          <p>
            <strong>In short:</strong> {COMPANY_NAME} collects only what the service needs (your name, email,
            password hash, resumes, job descriptions and analysis reports), sends resume and job text to Groq only to
            generate your analysis, hosts on Vercel and Supabase, and automatically deletes resumes, job descriptions
            and reports 24 hours after analysis. No advertising, no selling data, no tracking cookies.
          </p>
        </div>

        <section className="legal-section">
          <span className="legal-label">01 / Who we are</span>
          <p>
            {COMPANY_NAME} is operated by {OWNER_NAME}. {OWNER_NAME} is the controller of the personal data
            described in this policy.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">02 / What we collect</span>
          <p>
            Your name, email address and a bcrypt hash of your password; the resume PDFs you upload and resume text
            you paste; the job descriptions you submit; the AI analysis report generated for you; your daily usage
            counts (uploads and analyses per day); and your IP address, used only for rate limiting and security.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">03 / Why, and our legal basis</span>
          <p>
            We process this data to provide the service you asked for (performance of a contract) and because you
            consented when you registered and when you run an analysis (consent). You can withdraw consent at any
            time by deleting your account or no longer using the service.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">04 / AI processing by Groq</span>
          <p>
            The text of your resume and job description is sent to a third-party AI processor (Groq) only to generate
            your analysis report. It is not used for advertising and is not shared for any other purpose.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">05 / Where data is stored</span>
          <p>
            {COMPANY_NAME} is hosted on Vercel and the database is hosted by Supabase (PostgreSQL). Uploaded PDFs
            are processed in memory and are not stored as files.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">06 / Retention</span>
          <p>
            Resumes, job descriptions and analysis reports are deleted automatically 24 hours after analysis. Account
            data stays until you delete your account — you can do this from your Profile page or by contacting us.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">07 / Your rights</span>
          <p>
            You have the right to access, correct and delete your data, to withdraw consent, and to complain to a
            supervisory regulator. These rights apply under the EU/UK GDPR and, for users in India, under the Digital
            Personal Data Protection Act, 2023.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">08 / Security</span>
          <p>
            Passwords are stored only as bcrypt hashes, traffic is encrypted with HTTPS, and access to data is
            restricted to your own account through server-side session controls.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">09 / Children</span>
          <p>
            {COMPANY_NAME} is not intended for people under 18, and we do not knowingly collect data from children.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">10 / Changes to this policy</span>
          <p>
            We may update this policy from time to time. The &quot;last updated&quot; date at the top of this page
            always shows when it last changed.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">11 / Contact</span>
          <p>
            {COMPANY_NAME} is operated by {OWNER_NAME}. To ask a question or make a request about your data, use the
            contact option in your {COMPANY_NAME} account.
            {CONTACT_EMAIL ? (
              <>
                {' '}
                Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </>
            ) : null}
          </p>
        </section>

        <p className="legal-links">
          <Link to="/privacy">Privacy Policy</Link>
          {' · '}
          <Link to="/cookies">Cookie Policy</Link>
        </p>
        <p className="legal-updated">© {YEAR} {OWNER_NAME} · {COMPANY_NAME}</p>
      </div>
    </div>
  );
}
