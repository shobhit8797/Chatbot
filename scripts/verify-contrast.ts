/**
 * WCAG 2.0 AA contrast verification.
 * Sweeps all three precedence rules across boundary and midpoint values.
 * Exits 1 if any combination falls below 4.5:1.
 *
 * Usage: npm run verify:contrast
 */

import { resolveBubble } from "../lib/palette";

function sRGBToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * sRGBToLinear(r) +
    0.7152 * sRGBToLinear(g) +
    0.0722 * sRGBToLinear(b)
  );
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

type Case = {
  desc: string;
  input: string;
  city?: string;
  temperatureC?: number;
  panicLevel?: number;
};

const cases: Case[] = [];

// Rule 1 — temperature gradient: boundary + midpoint for every swatch
const temps = [-10, -1, 0, 1, 3, 5, 6, 8, 10, 11, 13, 15, 16, 18, 20, 21, 23, 25, 26, 28, 30, 31, 33, 35, 36, 40, 50];
for (const t of temps) {
  cases.push({
    desc: `Rule 1 — ${t}°C in Cairo`,
    input: `It is ${t}°C in Cairo`,
    city: "Cairo",
    temperatureC: t,
  });
}

// Rule 2 — decimal sepia: two-digit fractions from 00 to 99
for (let i = 0; i <= 99; i += 3) {
  const d = String(i).padStart(2, "0");
  cases.push({
    desc: `Rule 2 — "0.${d}"`,
    input: `0.${d}`,
  });
}
// Specific documented samples
for (const s of ["3.14159", "0.97", "0.00", "0.14", "0.99", "-3.14"]) {
  cases.push({ desc: `Rule 2 — "${s}"`, input: s });
}

// Rule 3 — tone gradient: 0 to 1 in steps of 0.025
for (let i = 0; i <= 40; i++) {
  const p = i / 40;
  cases.push({
    desc: `Rule 3 — panic=${p.toFixed(3)}`,
    input: "some message",
    panicLevel: p,
  });
}

let failures = 0;
let worstRatio = Infinity;
let worstDesc = "";

for (const c of cases) {
  const bubble = resolveBubble(c.input, c.city, c.temperatureC, c.panicLevel);
  const ratio = contrastRatio(bubble.background, bubble.foreground);

  if (ratio < worstRatio) {
    worstRatio = ratio;
    worstDesc = c.desc;
  }

  if (ratio < 4.5) {
    console.error(
      `FAIL  ${c.desc}\n      bg=${bubble.background}  fg=${bubble.foreground}  ratio=${ratio.toFixed(2)}  (${bubble.label})`
    );
    failures++;
  }
}

const total = cases.length;
console.log(`\nTotal cases : ${total}`);
console.log(`Failures    : ${failures}`);
console.log(
  `Worst ratio : ${worstRatio.toFixed(2)}:1  (${worstDesc})`
);

if (failures > 0) {
  process.exit(1);
} else {
  console.log("\n✓ All cases pass WCAG 2.0 AA (≥ 4.5:1)");
}
