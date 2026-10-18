import React, { useState, useEffect, useRef, memo } from "react";

/**
 * TypewriterText Component.
 * Animates text character-by-character with realistic pacing, punctuation pausing,
 * and a blinking caret. Automatically skips animation for historical messages.
 */
export const TypewriterText = memo(function TypewriterText({
  text = "",
  animate = false,
  onComplete,
  onTick,
  className = "",
}) {
  const [displayedText, setDisplayedText] = useState(animate ? "" : text);
  const [isTyping, setIsTyping] = useState(animate);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  useEffect(() => {
    if (!animate || !text) {
      setDisplayedText(text);
      setIsTyping(false);
      return undefined;
    }

    setDisplayedText("");
    setIsTyping(true);

    let currentIndex = 0;
    const fullText = text;
    const totalLength = fullText.length;

    // Adaptive step size so longer outputs don't take 30 seconds
    const stepSize = totalLength > 600 ? 4 : totalLength > 300 ? 2 : 1;
    let timerId = null;

    const tick = () => {
      currentIndex += stepSize;

      if (currentIndex >= totalLength) {
        setDisplayedText(fullText);
        setIsTyping(false);
        onTickRef.current?.();
        onCompleteRef.current?.();
        return;
      }

      setDisplayedText(fullText.slice(0, currentIndex));
      onTickRef.current?.();

      const lastChar = fullText[currentIndex - 1];
      // Slight pause on punctuation for organic cadence
      let delay = 12;
      if (lastChar === "\n") delay = 35;
      else if ([".", "!", "?"].includes(lastChar)) delay = 30;
      else if ([",", ":", ";"].includes(lastChar)) delay = 20;

      timerId = window.setTimeout(tick, delay);
    };

    timerId = window.setTimeout(tick, 15);

    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [text, animate]);

  // Click to skip typing
  const handleSkip = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
      onTickRef.current?.();
      onCompleteRef.current?.();
    }
  };

  return (
    <span
      onClick={handleSkip}
      className={`relative ${className} ${isTyping ? "cursor-pointer" : ""}`}
      title={isTyping ? "Click to reveal all text instantly" : undefined}
    >
      {displayedText}
      {isTyping && (
        <span
          className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#0078d4] rounded-xs animate-pulse align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
});
