import loadingAnimation from "../assets/loading.webp";

export function LoadingIndicator({ label = "Loading", className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <img
        src={loadingAnimation}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 object-contain"
      />
      <span>{label}</span>
    </span>
  );
}
