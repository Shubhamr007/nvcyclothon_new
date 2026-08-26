export function LoadingIndicator({ label = "Loading", className = "" }) {
  return (
    <span
      className={`loading-track-wrapper ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="loading-track" aria-hidden="true">
        <span className="loading-track-line" />
        <span className="loading-track-bike">
          <svg
            viewBox="0 0 64 40"
            xmlns="http://www.w3.org/2000/svg"
            focusable="false"
          >
            <g className="loading-bike-wheel" style={{ transformOrigin: "14px 30px" }}>
              <circle cx="14" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="14" y1="22" x2="14" y2="38" stroke="currentColor" strokeWidth="1.2" />
              <line x1="6" y1="30" x2="22" y2="30" stroke="currentColor" strokeWidth="1.2" />
            </g>
            <g className="loading-bike-wheel" style={{ transformOrigin: "50px 30px" }}>
              <circle cx="50" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="50" y1="22" x2="50" y2="38" stroke="currentColor" strokeWidth="1.2" />
              <line x1="42" y1="30" x2="58" y2="30" stroke="currentColor" strokeWidth="1.2" />
            </g>
            <path
              d="M14 30 L28 12 L44 30 M28 12 L38 12 M50 30 L38 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 12 L30 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
