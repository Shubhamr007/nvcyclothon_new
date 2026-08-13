import { useEffect, useState } from "react";

export function Typewriter({ phrases, delay = 2200 }) {
  const [phrase, setPhrase] = useState(0);
  const [letters, setLetters] = useState(0);
  useEffect(() => {
    if (letters < phrases[phrase].length) {
      const timer = setTimeout(() => setLetters((value) => value + 1), 55);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setPhrase((value) => (value + 1) % phrases.length);
      setLetters(0);
    }, delay);
    return () => clearTimeout(timer);
  }, [letters, phrase, phrases, delay]);
  return (
    <span aria-live="polite">
      {phrases[phrase].slice(0, letters)}
      <span className="type-caret">|</span>
    </span>
  );
}
