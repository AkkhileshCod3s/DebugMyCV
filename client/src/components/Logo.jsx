// Drop into client/src/components/Logo.jsx
// Uses currentColor for the ink and var(--accent) for the red, so it follows the light/dark theme.
// Make sure your CSS defines --accent (fallback below is the light-theme red).
export default function Logo({ size = 32, showText = true }) {
  return (
    <span className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="DebugMyCV"
        focusable="false"
      >
        <path d="M35 24V3H7v42h28V28" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M13 13h16M13 19h16M13 33h16M13 39h10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M13 26h28" fill="none" stroke="var(--accent, #C2331E)" strokeWidth="2" />
        <circle cx="43.5" cy="26" r="3" fill="var(--accent, #C2331E)" />
      </svg>
      {showText ? (
        <span className="logo-text" style={{ fontSize: size * 0.8 }}>
          DebugMy<span className="logo-accent">CV</span>
        </span>
      ) : null}
    </span>
  );
}
