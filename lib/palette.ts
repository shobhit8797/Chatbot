export const INK = "#0e0e0c";
export const PARCHMENT = "#fdfbf6";

type Swatch = {
  bg: string;
  fg: string;
  label: string;
};

type BoundedSwatch = { upTo: number } & Swatch;

// Rule 1 — Temperature gradient
const TEMPERATURE_SWATCHES: BoundedSwatch[] = [
  { upTo: 0,        bg: "#0c247a", fg: PARCHMENT, label: "deep blue" },
  { upTo: 5,        bg: "#1d3b9c", fg: PARCHMENT, label: "royal blue" },
  { upTo: 10,       bg: "#4a4ea3", fg: PARCHMENT, label: "periwinkle" },
  { upTo: 15,       bg: "#c49cde", fg: INK,       label: "light purple" },
  { upTo: 20,       bg: "#e0b6cf", fg: INK,       label: "mauve" },
  { upTo: 25,       bg: "#d28aa0", fg: INK,       label: "rose" },
  { upTo: 30,       bg: "#a83a4e", fg: PARCHMENT, label: "rich crimson" },
  { upTo: 35,       bg: "#c41f1f", fg: PARCHMENT, label: "red" },
  { upTo: Infinity, bg: "#e02020", fg: PARCHMENT, label: "bright red" },
];

// Rule 2 — Decimal sepia spectrum (upTo is the two-digit decimal fraction, 0–1)
const SEPIA_SWATCHES: BoundedSwatch[] = [
  { upTo: 0.14, bg: "#faf6ec", fg: INK,       label: "parchment" },
  { upTo: 0.28, bg: "#ecd9b3", fg: INK,       label: "cream" },
  { upTo: 0.42, bg: "#d4ae6f", fg: INK,       label: "tan" },
  { upTo: 0.56, bg: "#a87d3e", fg: INK,       label: "sepia" },
  { upTo: 0.70, bg: "#7a5424", fg: PARCHMENT, label: "umber" },
  { upTo: 0.84, bg: "#4d3416", fg: PARCHMENT, label: "mocha" },
  { upTo: 1.00, bg: "#26180c", fg: PARCHMENT, label: "dark brown" },
];

// Rule 3 — Tone gradient (0 = serene, 1 = panic)
const TONE_SWATCHES: BoundedSwatch[] = [
  { upTo: 0.14, bg: "#faf0aa", fg: INK,       label: "pale yellow" },
  { upTo: 0.28, bg: "#f7d97a", fg: INK,       label: "warm yellow" },
  { upTo: 0.42, bg: "#f4a86b", fg: INK,       label: "peach" },
  { upTo: 0.56, bg: "#e26780", fg: INK,       label: "rose-pink" },
  { upTo: 0.70, bg: "#c43a96", fg: PARCHMENT, label: "magenta" },
  { upTo: 0.84, bg: "#7e2cb8", fg: PARCHMENT, label: "violet" },
  { upTo: 1.00, bg: "#5a1f9a", fg: PARCHMENT, label: "deep violet" },
];

function lookup(table: BoundedSwatch[], value: number): BoundedSwatch {
  return table.find((s) => value <= s.upTo) ?? table[table.length - 1];
}

export type BubbleResult = {
  background: string;
  foreground: string;
  rule: "temperature" | "decimal" | "tone";
  label: string;
  explanation: string;
};

/**
 * Deterministic bubble resolver — given the raw user input and the LLM's
 * extracted diagnostic fields, applies the three precedence rules in order
 * and returns the swatch that should paint the reply bubble.
 */
export function resolveBubble(
  input: string,
  city: string | undefined,
  temperatureC: number | undefined,
  panicLevel: number | undefined
): BubbleResult {
  // Rule 1 — city + temperature takes priority
  if (city && temperatureC !== undefined && temperatureC !== null) {
    const s = lookup(TEMPERATURE_SWATCHES, temperatureC);
    return {
      background: s.bg,
      foreground: s.fg,
      rule: "temperature",
      label: `Temperature — ${s.label}`,
      explanation: `"${city}" at ${temperatureC}°C → ${s.label} swatch.`,
    };
  }

  // Rule 2 — entire trimmed message is a decimal number
  const trimmed = input.trim();
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    const afterDot = trimmed.split(".")[1] ?? "0";
    // First two decimal digits, zero-padded right (e.g. ".5" → "50")
    const twoDigits = (afterDot + "0").slice(0, 2);
    const fraction = parseFloat("0." + twoDigits);
    const s = lookup(SEPIA_SWATCHES, fraction);
    return {
      background: s.bg,
      foreground: s.fg,
      rule: "decimal",
      label: `Decimal Sepia — ${s.label}`,
      explanation: `Decimal fraction .${twoDigits} → ${s.label} swatch.`,
    };
  }

  // Rule 3 — fall-through tone gradient
  const level = Math.min(1, Math.max(0, panicLevel ?? 0));
  const s = lookup(TONE_SWATCHES, level);
  return {
    background: s.bg,
    foreground: s.fg,
    rule: "tone",
    label: `Tone — ${s.label}`,
    explanation: `Emotional intensity ${level.toFixed(2)} → ${s.label} swatch.`,
  };
}
