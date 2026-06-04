"use client";

/**
 * File purpose:
 * Renders message text that may contain inline LaTeX wrapped in $...$.
 *
 * The normaliser is intentionally forgiving because students build maths by
 * mixing typing and keyboard buttons. It merges adjacent math blocks and pulls
 * nearby math-like text into one expression, so examples such as:
 *   $\frac{1}{5}$$x^{2}$ - $\frac{7}{2}$x + 5 = 0
 * render consistently as one math expression.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/shared/utils/cn";

declare global {
  interface Window {
    katex?: {
      renderToString: (
        tex: string,
        options?: { throwOnError?: boolean; displayMode?: boolean }
      ) => string;
    };
  }
}

// ─── Segment parser ───────────────────────────────────────────────────────────

type Segment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string };

function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  const mathPattern = /(?<!\\)\$([^$]+?)(?<!\\)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: raw.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "math", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    segments.push({ kind: "text", value: raw.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: raw }];
}

// ─── Normalisation ────────────────────────────────────────────────────────────

const ALLOWED_MULTI_LETTER_MATH_WORDS = new Set([
  "sin", "cos", "tan", "sec", "csc", "cot",
  "sinh", "cosh", "tanh", "sech", "csch", "coth",
  "arcsin", "arccos", "arctan", "ln", "log", "lim", "det", "mod",
  "dx", "dy", "dz", "dt", "du", "dv", "rad",
]);

function hasSentenceStop(text: string): boolean {
  if (/[?!]/.test(text)) return true;
  // Keep decimal points, but treat a sentence full stop as a boundary.
  return /(^|[^0-9])\.(?![0-9])/.test(text);
}

function isMathLikeText(text: string): boolean {
  if (!text.trim()) return true;
  if (hasSentenceStop(text)) return false;

  // Avoid pulling natural language such as " please" into the math block.
  const words = text.match(/[A-Za-z]+/g) ?? [];
  for (const word of words) {
    if (word.length === 1) continue;
    if (!ALLOWED_MULTI_LETTER_MATH_WORDS.has(word)) return false;
  }

  return /^[\s0-9A-Za-z+\-*/=<>≤≥≠≈,;:^_{}()[\]|\\·×÷~]+$/.test(text);
}

function splitMathLikePrefix(text: string): { mathPrefix: string; rest: string } {
  if (!text) return { mathPrefix: "", rest: "" };
  if (isMathLikeText(text)) return { mathPrefix: text, rest: "" };

  // Stop before natural-language words or sentence punctuation. This prevents
  // partial words such as "$x + 1 p$lease" while still allowing math-like
  // prefixes such as " + 1 " to be absorbed into the expression.
  const boundaryCandidates: number[] = [];

  const stopPunctuation = /[?!]|(^|[^0-9])\.(?![0-9])/.exec(text);
  if (stopPunctuation) {
    boundaryCandidates.push(stopPunctuation.index);
  }

  const wordPattern = /[A-Za-z]+/g;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordPattern.exec(text)) !== null) {
    const word = wordMatch[0];
    if (word.length > 1 && !ALLOWED_MULTI_LETTER_MATH_WORDS.has(word)) {
      boundaryCandidates.push(wordMatch.index);
      break;
    }
  }

  const boundary = boundaryCandidates.length > 0
    ? Math.min(...boundaryCandidates)
    : text.length;

  let candidate = text.slice(0, boundary);

  while (candidate && !isMathLikeText(candidate)) {
    candidate = candidate.slice(0, -1);
  }

  if (!candidate.trim()) {
    return { mathPrefix: "", rest: text };
  }

  return { mathPrefix: candidate, rest: text.slice(candidate.length) };
}

/**
 * Public normaliser used before rendering and before saving messages.
 * It keeps prose as prose, but merges fragmented math runs into cleaner LaTeX.
 */
export function normalizeMathMessage(raw: string): string {
  const segments = parseSegments(raw);
  const output: string[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    if (segment.kind === "text") {
      output.push(segment.value);
      continue;
    }

    let latex = segment.value;

    while (i + 1 < segments.length) {
      const next = segments[i + 1];

      if (next.kind === "math") {
        latex += next.value;
        i += 1;
        continue;
      }

      const { mathPrefix, rest } = splitMathLikePrefix(next.value);

      if (!mathPrefix) break;

      latex += mathPrefix;
      i += 1;

      if (rest) {
        output.push(`$${latex}$`);
        output.push(rest);
        latex = "";
        break;
      }

      if (i + 1 < segments.length && segments[i + 1].kind === "math") {
        continue;
      }

      break;
    }

    if (latex) {
      output.push(`$${latex}$`);
    }
  }

  return output.join("");
}

// ─── Single math span ─────────────────────────────────────────────────────────

function MathSpan({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.katex) {
      try {
        el.innerHTML = window.katex.renderToString(latex.replaceAll("□", "\\square"), {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        el.textContent = `$${latex}$`;
      }
    } else {
      el.textContent = `$${latex}$`;
    }
  }, [latex]);

  return <span ref={ref} className="katex-inline" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

type MathRendererProps = {
  value: string;
  className?: string;
};

export function MathRenderer({ value, className }: MathRendererProps) {
  const segments = parseSegments(normalizeMathMessage(value));

  return (
    <span className={cn("whitespace-pre-wrap break-words [overflow-wrap:anywhere]", className)}>
      {segments.map((seg, i) =>
        seg.kind === "math" ? (
          <MathSpan key={i} latex={seg.value} />
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </span>
  );
}

export function stripMathDelimiters(value: string): string {
  return normalizeMathMessage(value).replace(/(?<!\\)\$([^$]+?)(?<!\\)\$/g, "$1");
}
