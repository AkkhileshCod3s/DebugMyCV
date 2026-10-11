import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent } from '../utils/consent.js';
import { CONSENT_VERSION } from '../config/legal.js';

export default function CookieBanner() {
  // If storage fails, getConsent() returns null and the banner shows every load.
  const [visible, setVisible] = useState(() => !getConsent());

  useEffect(() => {
    const onReset = () => setVisible(true);
    window.addEventListener('debugmycv-consent-reset', onReset);
    return () => window.removeEventListener('debugmycv-consent-reset', onReset);
  }, []);

  const choose = (choice) => {
    setConsent(choice, CONSENT_VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          We use one essential cookie to keep you signed in and remember your theme. No tracking or advertising
          cookies. Read our <Link to="/cookies">Cookie Policy</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <div className="cookie-banner-actions">
          <button type="button" className="btn btn-primary" onClick={() => choose('all')}>
            Accept
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => choose('essential')}>
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
