import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { auditColorSource, colorViolations } from "./color-policy";

test("all application source colors come from the central token system", () => {
  assert.deepEqual(auditColorSource(resolve("src")), []);
});

test("color guard rejects literal, default palette, SVG, shadow and legacy colors", () => {
  for (const source of ["text-red-700", "hover:bg-white/20", "stroke='#fff'", "color: 'blue'", "fill=\"red\"", "rgba(0,0,0,.5)", "oklch(.7 .1 30)", "color(display-p3 1 0 0)", "bg-[rebeccapurple]", "background: coral;", "shadow-[0_2px_4px_black]", "var(--color-dgb-400)", "bg-fb-200"]) {
    assert.ok(colorViolations(source).length, source);
  }
  for (const source of ["text-body bg-background border-warning-200", "fill='currentColor'", "bg-canvas/20 text-on-media", "color-mix(in srgb, var(--ink) 45%, transparent)", "var(--portrait-mask-mobile)", "href='#section'"]) {
    assert.deepEqual(colorViolations(source), [], source);
  }
});

test("central theme defines complete ramps and resolves its own color references", () => {
  const css = readFileSync(resolve("src/app/globals.css"), "utf8");
  const declarations = new Set(Array.from(css.matchAll(/(--[\w-]+)\s*:/g), (match) => match[1]));
  for (const family of ["brand", "highlight", "neutral", "success", "warning", "danger", "info"]) {
    for (const shade of [50,100,200,300,400,500,600,700,800,900,950]) {
      assert.ok(declarations.has(`--color-${family}-${shade}`));
      assert.ok(declarations.has(`--${family}-${shade}`));
    }
  }
  const external = new Set(["--font-inter-next", "--font-manrope-next"]);
  for (const match of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(declarations.has(match[1]) || external.has(match[1]), match[1]);
  assert.match(css, /--brand:\s*var\(--palette-dark\)/);
  assert.match(css, /--highlight:\s*var\(--palette-light\)/);
  assert.match(css, /--color-\*:\s*initial/);
  for (const line of css.split(/\r?\n/)) {
    if (!/^\s*--[\w-]+\s*:/.test(line)) assert.deepEqual(colorViolations(line), [], line);
  }
});

test("annual inputs have the required order and readable solid foregrounds", () => {
  const css = readFileSync(resolve("src/app/globals.css"), "utf8");
  const read = (name: string, scope = css) => {
    const value = scope.match(new RegExp(`--${name}:\\s*(#[\\da-f]{6})\\s*;`, "i"))?.[1];
    assert.ok(value, `${name} must be a six-digit hex color`);
    return [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  };
  const luminance = (rgb: number[]) => rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a: number[], b: number[]) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  const palettes = Array.from(css.matchAll(/:root(?:\[data-edition-year="\d{4}"\])?\s*\{([^}]+)\}/g));
  assert.ok(palettes.length >= 2, "default and edition palettes must be covered");
  for (const [selector, scope] of palettes) {
    const dark = read("palette-dark", scope);
    const light = read("palette-light", scope);
    assert.ok(luminance(dark) < luminance(light), `${selector}: the first annual color must be darker`);
    assert.ok(contrast(dark, read("canvas")) >= 4.5, "dark color must support white labels");
    assert.ok(contrast(light, read("ink")) >= 4.5, "light color must support dark labels");
  }
  for (const name of ["success", "warning", "danger", "info"]) {
    assert.ok(contrast(read(`${name}-base`), read("canvas")) >= 4.5, `${name} must support white labels`);
  }
});

test("edition palette is selected from the public or authorized preview edition", () => {
  const layout = readFileSync(resolve("src/app/layout.tsx"), "utf8");
  assert.match(layout, /data-edition-year=\{navigation\.edition\.year\}/);
  const css = readFileSync(resolve("src/app/globals.css"), "utf8");
  const edition = css.match(/:root\[data-edition-year="2026"\]\s*\{([^}]+)\}/)?.[1];
  assert.ok(edition);
  assert.equal(Array.from(edition.matchAll(/--palette-[\w-]+\s*:/g)).length, 2);
});
