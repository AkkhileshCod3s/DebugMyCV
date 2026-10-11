const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function toneFor(score) {
  if (score >= 70) return { label: 'Strong match' };
  if (score >= 45) return { label: 'Moderate match' };
  return { label: 'Limited match' };
}

export function MatchScore({ score = 0, size = 160, explainText }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const tone = toneFor(clamped);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
        <circle className="track" cx="64" cy="64" r={RADIUS} fill="none" strokeWidth="11" />
        <circle
          className="value"
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          strokeWidth="11"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-center">
        <span className="score-number">{clamped}</span>
        <span className="score-label">out of 100</span>
      </div>
      <span className="sr-only" role="img" aria-label={`Match score ${clamped} out of 100 — ${tone.label}`}>
        {explainText || tone.label}
      </span>
    </div>
  );
}

export function scoreLabel(score) {
  return toneFor(score).label;
}
