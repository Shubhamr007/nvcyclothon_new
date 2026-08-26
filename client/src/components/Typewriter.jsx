import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function Typewriter({ phrases, delay = 2200 }) {
  const [phrase, setPhrase] = useState(0);
  const [letters, setLetters] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (letters < phrases[phrase].length) {
      const timer = setTimeout(() => setLetters((value) => value + 1), 55);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setPhrase((value) => (value + 1) % phrases.length);
      setLetters(0);
    }, delay);
    return () => clearTimeout(timer);
  }, [letters, phrase, phrases, delay, reduceMotion]);
  return (
    <span>
      {reduceMotion ? phrases[0] : phrases[phrase].slice(0, letters)}
      {!reduceMotion && <span className="type-caret" aria-hidden="true">|</span>}
    </span>
  );
}
