"use client";

/**
 * File purpose:
 * Math keyboard panel for GCSE → university tutoring messages.
 *
 * The panel mirrors the Wolfram Alpha grouping the team has been using:
 * Basic Math, Calculus & Sums, Vectors & Matrices, Trigonometry, Symbols.
 * Buttons insert LaTeX into the message textarea. The helper is deliberately
 * context-aware: if the cursor is already inside a $...$ expression, it inserts
 * raw LaTeX instead of creating invalid nested math delimiters. Empty
 * argument slots use a hollow □ marker instead of a heavy black block, so
 * students can replace the placeholder without the input feeling broken.
 */

import { useEffect, useState } from "react";
import { cn } from "@/shared/utils/cn";
import { MathRenderer } from "@/domains/async-support/components/MathRenderer";

// ─── Types ────────────────────────────────────────────────────────────────────

type MathCategory = {
  label: string;
  symbols: MathSymbol[];
};

type MathSymbol = {
  /** Plain-text fallback / accessible label for the button. */
  display: string;
  /** LaTeX inserted into textarea. Use $...$ for normal insertion. */
  insert: string;
  /** Optional LaTeX used only for rendering the button face. */
  buttonLatex?: string;
  title?: string;
};

// ─── Placeholder char used as editable placeholder positions ───────────────────────────────────────
export const MATH_PLACEHOLDER = "□";

const P = MATH_PLACEHOLDER;

// ─── Symbol catalogue ─────────────────────────────────────────────────────────

const BASE_MATH_CATEGORIES: MathCategory[] = [
  {
    label: "Basic Math",
    symbols: [
      { display: "□⁄□", insert: `$\\frac{${P}}{${P}}$`, title: "Fraction" },
      { display: "□²", insert: `$${P}^{2}$`, title: "Squared" },
      { display: "□^□", insert: `$${P}^{${P}}$`, title: "Power" },
      { display: "√□", insert: `$\\sqrt{${P}}$`, title: "Square root" },
      { display: "³√□", insert: `$\\sqrt[3]{${P}}$`, title: "Cube root" },
      { display: "□√□", insert: `$\\sqrt[${P}]{${P}}$`, title: "nth root" },
      { display: "∞", insert: `$\\infty$`, title: "Infinity" },
      { display: "−∞", insert: `$-\\infty$`, title: "Negative infinity" },
      { display: "π", insert: `$\\pi$`, title: "Pi" },
      { display: "e", insert: `$e$`, title: "Euler's number" },
      { display: "e^□", insert: `$e^{${P}}$`, title: "Exponential" },
      { display: "ln(□)", insert: `$\\ln(${P})$`, title: "Natural logarithm" },
      { display: "logₐ(□)", insert: `$\\log_{${P}}(${P})$`, title: "Logarithm with base" },
      { display: "log₁₀(□)", insert: `$\\log_{10}(${P})$`, title: "Base 10 logarithm" },
      { display: "|□|", insert: `$|${P}|$`, title: "Absolute value" },
      { display: "□≤□", insert: `$${P} \\leq ${P}$`, title: "Less than or equal" },
      { display: "□≥□", insert: `$${P} \\geq ${P}$`, title: "Greater than or equal" },
      { display: "□≠□", insert: `$${P} \\neq ${P}$`, title: "Not equal" },
    ],
  },
  {
    label: "Calculus & Sums",
    symbols: [
      { display: "d⁄d□", insert: `$\\frac{d}{d${P}}$`, title: "Derivative operator" },
      { display: "d²⁄d□²", insert: `$\\frac{d^2}{d${P}^2}$`, title: "Second derivative operator" },
      { display: "∂⁄∂□", insert: `$\\frac{\\partial}{\\partial ${P}}$`, title: "Partial derivative operator" },
      { display: "∂²⁄∂□²", insert: `$\\frac{\\partial^2}{\\partial ${P}^2}$`, title: "Second partial derivative" },
      { display: "∂²⁄∂□∂□", insert: `$\\frac{\\partial^2}{\\partial ${P}\\partial ${P}}$`, title: "Mixed partial derivative" },
      { display: "∫□", insert: `$\\int ${P}$`, title: "Integral" },
      { display: "∫∫□□", insert: `$\\iint ${P}\\,d${P}\\,d${P}$`, title: "Double integral" },
      { display: "∫∫∫□□□", insert: `$\\iiint ${P}\\,d${P}\\,d${P}\\,d${P}$`, title: "Triple integral" },
      { display: "∫₍□₎", insert: `$\\int_{${P}} ${P}$`, title: "Integral with lower limit" },
      { display: "∫₍□₎⁽□⁾", insert: `$\\int_{${P}}^{${P}} ${P}$`, title: "Definite integral" },
      { display: "∫∫₍□₎⁽□⁾", insert: `$\\iint_{${P}}^{${P}} ${P}$`, title: "Double integral with limits" },
      { display: "Σ", insert: `$\\sum_{${P}}^{${P}} ${P}$`, title: "Summation" },
      { display: "Π", insert: `$\\prod_{${P}}^{${P}} ${P}$`, title: "Product" },
      { display: "lim", insert: `$\\lim_{${P} \\to ${P}} ${P}$`, title: "Limit" },
      { display: "lim⁺", insert: `$\\lim_{${P} \\to ${P}^{+}} ${P}$`, title: "Right-hand limit" },
      { display: "lim⁻", insert: `$\\lim_{${P} \\to ${P}^{-}} ${P}$`, title: "Left-hand limit" },
      { display: "lim∞", insert: `$\\lim_{${P} \\to \\infty} ${P}$`, title: "Limit to infinity" },
      { display: "θ(□)", insert: `$\\theta(${P})$`, title: "Theta function" },
      { display: "δ(□)", insert: `$\\delta(${P})$`, title: "Delta function" },
      { display: "Jac", insert: `$\\begin{pmatrix}\\frac{\\partial ${P}}{\\partial ${P}}&\\frac{\\partial ${P}}{\\partial ${P}}\\\\\\frac{\\partial ${P}}{\\partial ${P}}&\\frac{\\partial ${P}}{\\partial ${P}}\\end{pmatrix}$`, title: "Jacobian-style matrix" },
      { display: "Hess", insert: `$\\begin{pmatrix}\\frac{\\partial^2 ${P}}{\\partial ${P}^2}&\\frac{\\partial^2 ${P}}{\\partial ${P}\\partial ${P}}\\\\\\frac{\\partial^2 ${P}}{\\partial ${P}\\partial ${P}}&\\frac{\\partial^2 ${P}}{\\partial ${P}^2}\\end{pmatrix}$`, title: "Hessian-style matrix" },
      { display: "ℒ", insert: `$\\mathcal{L}_{${P}}\\{${P}\\}$`, title: "Laplace transform" },
      { display: "ℒ⁻¹", insert: `$\\mathcal{L}^{-1}_{${P}}\\{${P}\\}$`, title: "Inverse Laplace transform" },
      { display: "ℱ", insert: `$\\mathcal{F}_{${P}}\\{${P}\\}$`, title: "Fourier transform" },
      { display: "ℱ⁻¹", insert: `$\\mathcal{F}^{-1}_{${P}}\\{${P}\\}$`, title: "Inverse Fourier transform" },
    ],
  },
  {
    label: "Vectors & Matrices",
    symbols: [
      { display: "[□,□]", insert: `$[${P},${P}]$`, title: "2 item list" },
      { display: "[□,□,□]", insert: `$[${P},${P},${P}]$`, title: "3 item list" },
      { display: "[□,□,□,□]", insert: `$[${P},${P},${P},${P}]$`, title: "4 item list" },
      { display: "[□]", insert: `$\\begin{bmatrix}${P}\\end{bmatrix}$`, title: "Single column vector" },
      { display: "[□;□]", insert: `$\\begin{bmatrix}${P}\\\\${P}\\end{bmatrix}$`, title: "2D column vector" },
      { display: "[□;□;□]", insert: `$\\begin{bmatrix}${P}\\\\${P}\\\\${P}\\end{bmatrix}$`, title: "3D column vector" },
      { display: "(□□)", insert: `$\\begin{pmatrix}${P}&${P}\\end{pmatrix}$`, title: "Row vector" },
      { display: "(□□□)", insert: `$\\begin{pmatrix}${P}&${P}&${P}\\end{pmatrix}$`, title: "3 item row vector" },
      { display: "(2×2)", insert: `$\\begin{pmatrix}${P}&${P}\\\\${P}&${P}\\end{pmatrix}$`, title: "2×2 matrix" },
      { display: "(2×3)", insert: `$\\begin{pmatrix}${P}&${P}&${P}\\\\${P}&${P}&${P}\\end{pmatrix}$`, title: "2×3 matrix" },
      { display: "(3×3)", insert: `$\\begin{pmatrix}${P}&${P}&${P}\\\\${P}&${P}&${P}\\\\${P}&${P}&${P}\\end{pmatrix}$`, title: "3×3 matrix" },
      { display: "(4×4)", insert: `$\\begin{pmatrix}${P}&${P}&${P}&${P}\\\\${P}&${P}&${P}&${P}\\\\${P}&${P}&${P}&${P}\\\\${P}&${P}&${P}&${P}\\end{pmatrix}$`, title: "4×4 matrix" },
    ],
  },
  {
    label: "Trigonometry",
    symbols: [
      { display: "π", insert: `$\\pi$`, title: "Pi" },
      { display: "°", insert: `$^\\circ$`, title: "Degree" },
      { display: "rad", insert: `$\\operatorname{rad}$`, title: "Radians" },
      { display: "sin□", insert: `$\\sin ${P}$`, title: "Sine" },
      { display: "cos□", insert: `$\\cos ${P}$`, title: "Cosine" },
      { display: "tan□", insert: `$\\tan ${P}$`, title: "Tangent" },
      { display: "sec□", insert: `$\\sec ${P}$`, title: "Secant" },
      { display: "csc□", insert: `$\\csc ${P}$`, title: "Cosecant" },
      { display: "cot□", insert: `$\\cot ${P}$`, title: "Cotangent" },
      { display: "sin⁻¹□", insert: `$\\sin^{-1} ${P}$`, title: "Inverse sine" },
      { display: "cos⁻¹□", insert: `$\\cos^{-1} ${P}$`, title: "Inverse cosine" },
      { display: "tan⁻¹□", insert: `$\\tan^{-1} ${P}$`, title: "Inverse tangent" },
      { display: "sinh□", insert: `$\\sinh ${P}$`, title: "Hyperbolic sine" },
      { display: "cosh□", insert: `$\\cosh ${P}$`, title: "Hyperbolic cosine" },
      { display: "tanh□", insert: `$\\tanh ${P}$`, title: "Hyperbolic tangent" },
      { display: "sech□", insert: `$\\operatorname{sech} ${P}$`, title: "Hyperbolic secant" },
      { display: "csch□", insert: `$\\operatorname{csch} ${P}$`, title: "Hyperbolic cosecant" },
      { display: "coth□", insert: `$\\coth ${P}$`, title: "Hyperbolic cotangent" },
      { display: "sinh⁻¹□", insert: `$\\sinh^{-1} ${P}$`, title: "Inverse hyperbolic sine" },
      { display: "cosh⁻¹□", insert: `$\\cosh^{-1} ${P}$`, title: "Inverse hyperbolic cosine" },
      { display: "tanh⁻¹□", insert: `$\\tanh^{-1} ${P}$`, title: "Inverse hyperbolic tangent" },
      { display: "sech⁻¹□", insert: `$\\operatorname{sech}^{-1} ${P}$`, title: "Inverse hyperbolic secant" },
      { display: "csch⁻¹□", insert: `$\\operatorname{csch}^{-1} ${P}$`, title: "Inverse hyperbolic cosecant" },
      { display: "coth⁻¹□", insert: `$\\coth^{-1} ${P}$`, title: "Inverse hyperbolic cotangent" },
    ],
  },
  {
    label: "Symbols",
    symbols: [
      { display: "π", insert: `$\\pi$`, title: "Pi" },
      { display: "°", insert: `$^\\circ$`, title: "Degree" },
      { display: "∞", insert: `$\\infty$`, title: "Infinity" },
      { display: "∀", insert: `$\\forall$`, title: "For all" },
      { display: "∃", insert: `$\\exists$`, title: "Exists" },
      { display: "∪", insert: `$\\cup$`, title: "Union" },
      { display: "∩", insert: `$\\cap$`, title: "Intersection" },
      { display: "∇", insert: `$\\nabla$`, title: "Nabla" },
      { display: "Δ", insert: `$\\Delta$`, title: "Delta" },
      { display: "α", insert: `$\\alpha$`, title: "Alpha" },
      { display: "β", insert: `$\\beta$`, title: "Beta" },
      { display: "γ", insert: `$\\gamma$`, title: "Gamma" },
      { display: "δ", insert: `$\\delta$`, title: "Delta" },
      { display: "ε", insert: `$\\epsilon$`, title: "Epsilon" },
      { display: "ζ", insert: `$\\zeta$`, title: "Zeta" },
      { display: "η", insert: `$\\eta$`, title: "Eta" },
      { display: "θ", insert: `$\\theta$`, title: "Theta" },
      { display: "κ", insert: `$\\kappa$`, title: "Kappa" },
      { display: "λ", insert: `$\\lambda$`, title: "Lambda" },
      { display: "μ", insert: `$\\mu$`, title: "Mu" },
      { display: "ν", insert: `$\\nu$`, title: "Nu" },
      { display: "ξ", insert: `$\\xi$`, title: "Xi" },
      { display: "ρ", insert: `$\\rho$`, title: "Rho" },
      { display: "σ", insert: `$\\sigma$`, title: "Sigma" },
      { display: "τ", insert: `$\\tau$`, title: "Tau" },
      { display: "φ", insert: `$\\varphi$`, title: "Phi" },
      { display: "χ", insert: `$\\chi$`, title: "Chi" },
      { display: "ψ", insert: `$\\psi$`, title: "Psi" },
      { display: "ω", insert: `$\\omega$`, title: "Omega" },
      { display: "Γ", insert: `$\\Gamma$`, title: "Gamma capital" },
      { display: "Θ", insert: `$\\Theta$`, title: "Theta capital" },
      { display: "Λ", insert: `$\\Lambda$`, title: "Lambda capital" },
      { display: "Ξ", insert: `$\\Xi$`, title: "Xi capital" },
      { display: "Υ", insert: `$\\Upsilon$`, title: "Upsilon capital" },
      { display: "Φ", insert: `$\\Phi$`, title: "Phi capital" },
      { display: "Ψ", insert: `$\\Psi$`, title: "Psi capital" },
      { display: "Ω", insert: `$\\Omega$`, title: "Omega capital" },
      { display: "ϑ", insert: `$\\vartheta$`, title: "Variant theta" },
      { display: "ϕ", insert: `$\\phi$`, title: "Phi variant" },
      { display: "⇄", insert: `$\\leftrightarrow$`, title: "Left-right arrow" },
      { display: "→", insert: `$\\to$`, title: "Right arrow" },
      { display: "⊕", insert: `$\\oplus$`, title: "Direct sum / XOR" },
      { display: "⊙", insert: `$\\odot$`, title: "Circle dot" },
      { display: "≠", insert: `$\\neq$`, title: "Not equal" },
      { display: "≥", insert: `$\\geq$`, title: "Greater than or equal" },
      { display: "≤", insert: `$\\leq$`, title: "Less than or equal" },
    ],
  },
];

const MATH_CATEGORIES: MathCategory[] = [
  ...BASE_MATH_CATEGORIES,
  {
    label: "All Math Inputs",
    symbols: BASE_MATH_CATEGORIES.flatMap((category) => category.symbols),
  },
];

// ─── Dollar-delimiter helpers ────────────────────────────────────────────────

function isUnescapedDollar(text: string, index: number): boolean {
  return text[index] === "$" && text[index - 1] !== "\\";
}

function countUnescapedDollars(text: string, endExclusive: number): number {
  let count = 0;
  for (let i = 0; i < endExclusive; i += 1) {
    if (isUnescapedDollar(text, i)) count += 1;
  }
  return count;
}

function isCaretInsideMath(text: string, caretIndex: number): boolean {
  return countUnescapedDollars(text, caretIndex) % 2 === 1;
}

function findOpeningDollarBeforeClosingDollar(text: string, closingDollarIndex: number): number {
  for (let i = closingDollarIndex - 1; i >= 0; i -= 1) {
    if (isUnescapedDollar(text, i)) return i;
  }
  return -1;
}

function isCaretJustAfterClosedMath(text: string, caretIndex: number): boolean {
  return caretIndex > 0 && isUnescapedDollar(text, caretIndex - 1)
    && findOpeningDollarBeforeClosingDollar(text, caretIndex - 1) !== -1;
}

function stripOuterMathDelimiters(text: string): string {
  return text.startsWith("$") && text.endsWith("$") ? text.slice(1, -1) : text;
}

/**
 * Insert a maths snippet at the textarea caret, keeping React state in sync.
 *
 * Behaviour:
 * - normal prose: inserts a full `$...$` expression
 * - inside `$...$`: inserts raw LaTeX without nested delimiters
 * - immediately after `$...$`: inserts before the closing `$` so the expression
 *   keeps growing instead of producing `$a$$b$`
 */
export function insertAtCaret(
  textarea: HTMLTextAreaElement,
  text: string,
  onValueChange: (val: string) => void
): void {
  textarea.focus();

  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const currentValue = textarea.value;
  const rawLatex = stripOuterMathDelimiters(text);
  const insideMath = isCaretInsideMath(currentValue, start);
  const afterClosedMath = start === end && isCaretJustAfterClosedMath(currentValue, start);

  const insertion = insideMath || afterClosedMath ? rawLatex : text;
  const insertionStart = afterClosedMath ? start - 1 : start;
  const insertionEnd = afterClosedMath ? start - 1 : end;

  const nextValue =
    currentValue.slice(0, insertionStart) +
    insertion +
    currentValue.slice(insertionEnd);

  onValueChange(nextValue);

  requestAnimationFrame(() => {
    const placeholderIndex = nextValue.indexOf(MATH_PLACEHOLDER, insertionStart);
    if (placeholderIndex !== -1) {
      textarea.setSelectionRange(placeholderIndex, placeholderIndex + MATH_PLACEHOLDER.length);
      return;
    }

    const nextCaretPosition = insertionStart + insertion.length;
    textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
  });
}

export function moveToNextMathPlaceholder(textarea: HTMLTextAreaElement): void {
  textarea.focus();
  const start = textarea.selectionEnd ?? 0;
  const next = textarea.value.indexOf(MATH_PLACEHOLDER, start);
  const fallback = textarea.value.indexOf(MATH_PLACEHOLDER);
  const target = next !== -1 ? next : fallback;

  if (target !== -1) {
    textarea.setSelectionRange(target, target + MATH_PLACEHOLDER.length);
  }
}

// ─── Symbol button ────────────────────────────────────────────────────────────

function latexForButton(symbol: MathSymbol): string {
  if (symbol.buttonLatex) return symbol.buttonLatex;
  return stripOuterMathDelimiters(symbol.insert);
}

function SymbolButton({
  symbol,
  onInsert,
}: {
  symbol: MathSymbol;
  onInsert: (s: MathSymbol) => void;
}) {
  return (
    <button
      type="button"
      title={symbol.title ?? symbol.display}
      onClick={() => onInsert(symbol)}
      className={cn(
        "flex h-12 min-w-[3.75rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-2",
        "text-sm font-medium text-slate-800 transition",
        "hover:border-slate-950 hover:bg-slate-50 hover:text-slate-950",
        "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1",
        "active:scale-95"
      )}
    >
      <span className="pointer-events-none flex min-w-0 items-center justify-center text-center leading-none">
        <MathRenderer value={`$${latexForButton(symbol)}$`} />
      </span>
      <span className="sr-only">{symbol.title ?? symbol.display}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type MathKeyboardProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function MathKeyboard({
  textareaRef,
  onValueChange,
  isOpen,
  onClose,
}: MathKeyboardProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  function handleInsert(symbol: MathSymbol) {
    const ta = textareaRef.current;
    if (!ta) return;
    insertAtCaret(ta, symbol.insert, onValueChange);
  }

  if (!isOpen) return null;

  const category = MATH_CATEGORIES[activeCategory];

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Math input
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close math keyboard"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
        {MATH_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveCategory(idx)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
              idx === activeCategory
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 overflow-y-auto p-3" style={{ maxHeight: "226px" }}>
        {category.symbols.map((sym, idx) => (
          <SymbolButton
            key={`${activeCategory}-${idx}-${sym.title ?? sym.display}`}
            symbol={sym}
            onInsert={handleInsert}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2">
        <p className="text-xs text-slate-400">
          Empty maths slots use □. Type over the selected slot, press Tab, or use Next slot.
        </p>
        <button
          type="button"
          onClick={() => {
            const ta = textareaRef.current;
            if (ta) moveToNextMathPlaceholder(ta);
          }}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-950 hover:bg-slate-50 hover:text-slate-950"
        >
          Next slot
        </button>
      </div>
    </div>
  );
}
