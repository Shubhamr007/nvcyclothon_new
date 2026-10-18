import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Validates a URL against malicious schemes (javascript:, data:, vbscript:).
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith("https://") ||
    clean.startsWith("http://") ||
    clean.startsWith("mailto:") ||
    clean.startsWith("/")
  );
}

/**
 * Fenced code block with copy action and syntax styling.
 */
export function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[11px] font-mono text-slate-400">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1 rounded hover:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 transition"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Parses inline formatting: bold, italic, inline code, and links.
 * Returns an array of React elements and strings without dangerouslySetInnerHTML.
 */
export function parseInline(text) {
  if (!text) return [];

  const tokens = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+(?!\*)|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline_${match.index}_${token.slice(0, 6)}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(
        <code
          key={key}
          className="rounded-sm bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 break-words"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      tokens.push(
        <strong key={key} className="font-bold text-slate-950 dark:text-white">
          {parseInline(token.slice(2, -2))}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(
        <em key={key} className="italic text-slate-800 dark:text-slate-200">
          {parseInline(token.slice(1, -1))}
        </em>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch && isSafeUrl(linkMatch[2])) {
        tokens.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 break-all transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        tokens.push(linkMatch ? linkMatch[1] : token);
      }
    } else {
      tokens.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}
