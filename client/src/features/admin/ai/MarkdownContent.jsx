import React, { memo } from "react";
import { parseInline, CodeBlock } from "./markdownUtils";

/**
 * Parses multi-line Markdown text into structured React elements without dangerouslySetInnerHTML.
 * Supports fenced code, tables with horizontal scroll, headings (h1-h4), blockquotes, lists, and paragraphs.
 */
export const MarkdownContent = memo(function MarkdownContent({ text = "", className = "" }) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Fenced Code Block
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <CodeBlock
          key={`code_${i}`}
          code={codeLines.join("\n")}
          language={language}
        />
      );
      i++;
      continue;
    }

    // 2. Table: detect header line and separator line with pipes
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].includes("-")) {
      const tableLines = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().length > 0) {
        tableLines.push(lines[i]);
        i++;
      }

      const headers = tableLines[0]
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0);

      const rows = tableLines.slice(2).map((r) =>
        r
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0)
      );

      blocks.push(
        <div
          key={`table_${i}`}
          className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs"
        >
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 font-semibold">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 3. Headings (#, ##, ###, ####)
    if (line.startsWith("#")) {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const content = parseInline(match[2]);
        if (level === 1) {
          blocks.push(
            <h1 key={`h1_${i}`} className="text-sm sm:text-base font-extrabold text-slate-900 mt-3 mb-1.5 border-b border-slate-200 pb-1">
              {content}
            </h1>
          );
        } else if (level === 2) {
          blocks.push(
            <h2 key={`h2_${i}`} className="text-xs sm:text-sm font-bold text-slate-900 mt-2.5 mb-1">
              {content}
            </h2>
          );
        } else {
          blocks.push(
            <h3 key={`h3_${i}`} className="text-xs font-bold text-slate-900 mt-2 mb-0.5">
              {content}
            </h3>
          );
        }
        i++;
        continue;
      }
    }

    // 4. Blockquotes (> ...)
    if (line.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={`quote_${i}`}
          className="my-2 border-l-2 border-[#0078d4] pl-3 italic text-slate-600 text-xs"
        >
          {parseInline(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // 5. Unordered list (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul_${i}`} className="my-2 ml-4 list-disc space-y-1 text-xs text-slate-800">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered list (1. 2. etc.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`ol_${i}`} className="my-2 ml-4 list-decimal space-y-1 text-xs text-slate-800">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular paragraph / empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    const paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].includes("|")
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    blocks.push(
      <p key={`p_${i}`} className="my-1.5 text-xs leading-relaxed text-slate-800">
        {parseInline(paraLines.join(" "))}
      </p>
    );
  }

  return <div className={`space-y-1 text-xs ${className}`}>{blocks}</div>;
});
