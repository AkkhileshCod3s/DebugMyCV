export const CONSENT_KEY = 'debugmycv-consent';

/** Read the stored cookie-consent choice, or null when missing/unreadable. */
export function getConsent() {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.choice !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * True when the user chose `choice` ('all' or 'essential').
 * Any future optional script (e.g. analytics) must load only when
 * hasConsent('all') is true. The theme preference is essential/functional
 * and is never gated.
 */
export function hasConsent(choice) {
  const consent = getConsent();
  return Boolean(consent && consent.choice === choice);
}

/** Persist the consent choice; never throws. */
export function setConsent(choice, version) {
  try {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ choice, version, at: new Date().toISOString() }),
    );
  } catch {
    /* storage unavailable — banner will be shown again next load */
  }
}

/** Clear the stored choice so the banner is shown again; never throws. */
export function resetConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* storage unavailable */
  }
  try {
    window.dispatchEvent(new Event('debugmycv-consent-reset'));
  } catch {
    /* non-browser environment */
  }
}
