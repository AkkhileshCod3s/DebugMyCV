export function UsageQuotaIndicator({ title, used = 0, max = 0, remaining, kind = 'uploads' }) {
  const rem = remaining ?? Math.max(max - used, 0);
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const tone = rem === 0 ? 'full' : rem <= Math.ceil(max * 0.25) ? 'warn' : '';
  const unit = kind === 'analyses' ? (max === 1 ? 'analysis' : 'analyses') : max === 1 ? 'upload' : 'uploads';

  return (
    <div className="quota-inline">
      <div className="row-between">
        <span className="label">{title}</span>
        <span className="usage-badge">
          {rem} of {max} remaining
        </span>
      </div>
      <div
        className={`meter ${tone}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={used}
        aria-label={`${title}: ${used} of ${max} ${unit} used today`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="hint">
        {used} of {max} {unit} used today · resets at midnight (Asia/Kolkata)
      </span>
    </div>
  );
}
