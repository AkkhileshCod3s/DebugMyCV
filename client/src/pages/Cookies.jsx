import { Link } from 'react-router-dom';
import LandingNav from '../components/LandingNav.jsx';
import { LEGAL_LAST_UPDATED, OWNER_NAME, COMPANY_NAME, CONTACT_EMAIL } from '../config/legal.js';
import { resetConsent } from '../utils/consent.js';

const YEAR = new Date().getFullYear();

export default function Cookies() {
  return (
    <div className="container">
      <LandingNav />
      <div className="legal-page animate-in">
        <h1>Cookie Policy</h1>
        <p className="legal-updated">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="legal-summary">
          <p>
            <strong>In short:</strong> this page explains the cookies and browser storage {COMPANY_NAME}, operated by{' '}
            {OWNER_NAME}, uses: one essential session cookie, one browser-storage value for your theme choice and one
            that records your cookie choice. No analytics, no advertising, no tracking cookies.
          </p>
        </div>

        <section className="legal-section">
          <span className="legal-label">01 / Cookies we set</span>
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Purpose</th>
                <th scope="col">Type</th>
                <th scope="col">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>careerlens.sid</td>
                <td>Keeps you signed in (login session)</td>
                <td>Essential</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>debugmycv-theme</td>
                <td>Remembers your light/dark theme choice</td>
                <td>Preference</td>
                <td>Until cleared</td>
              </tr>
              <tr>
                <td>debugmycv-consent</td>
                <td>Records your cookie choice</td>
                <td>Essential</td>
                <td>12 months</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="legal-section">
          <span className="legal-label">02 / What we do not use</span>
          <p>
            No analytics cookies, no advertising cookies and no tracking cookies. Nothing on {COMPANY_NAME} profiles
            you across other services.
          </p>
        </section>

        <section className="legal-section">
          <span className="legal-label">03 / Managing your choice</span>
          <p>
            You can change your mind at any time — clearing your choice shows the consent banner again on every page.
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => resetConsent()}>
            Cookie settings
          </button>
        </section>

        <section className="legal-section">
          <span className="legal-label">04 / Contact</span>
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
