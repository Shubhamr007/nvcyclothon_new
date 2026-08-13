import { useEffect, useState } from "react";

export function InteractiveCursor() {
  const [cursor, setCursor] = useState({
    x: -100,
    y: -100,
    active: false,
    bike: false,
    interactive: false,
  });
  useEffect(() => {
    const move = (event) =>
      setCursor({
        x: event.clientX,
        y: event.clientY,
        active: true,
        bike: Boolean(event.target.closest("[data-rider]")),
        interactive: Boolean(
          event.target.closest("a, button, input, select, textarea"),
        ),
      });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <span
      aria-hidden="true"
      className={`custom-cursor ${cursor.active ? "is-visible" : ""} ${cursor.bike ? "is-bike" : ""} ${cursor.interactive ? "is-interactive" : ""}`}
      style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
    >
      {cursor.bike ? "🚴" : ""}
    </span>
  );
}
