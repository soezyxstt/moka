import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import test from "node:test";
import ts from "typescript";
import { brandMetadata } from "../src/server/cms/brand-assets";

test("ikon edisi baru tidak memakai ikon tahun sebelumnya saat CMS kosong", () => {
  const empty = brandMetadata({});
  assert.deepEqual(empty.icons, { icon: [], apple: [] });
  const favicon = { url: "https://example.com/new.svg", mimeType: "image/svg+xml", alt: "Ikon baru" };
  assert.deepEqual(brandMetadata({ "brand.favicon": favicon }).icons, { icon: [{ url: favicon.url, type: favicon.mimeType }], apple: [] });
});

test("graf impor halaman publik tidak membaca fixture 2025 atau konten tahun tetap", () => {
  const app = resolve("src/app");
  const roots: string[] = [];
  function walk(directory: string) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      if (item.isDirectory() && !["admin", "api"].includes(item.name)) walk(join(directory, item.name));
      if (item.isFile() && /^(page|layout|not-found|error|global-error|loading|manifest|sitemap)\.tsx?$/.test(item.name)) roots.push(join(directory, item.name));
    }
  }
  walk(app);
  roots.push(resolve("src/components/admin/admin-shell.tsx"), resolve("src/components/custom/finalist-card.tsx"));
  const visited = new Set<string>();
  const violations: string[] = [];
  function visit(filename: string) {
    if (visited.has(filename)) return;
    visited.add(filename);
    const label = relative(process.cwd(), filename).replaceAll("\\", "/");
    if (/src\/lib\/(data|finalist|news|organogram)\.ts$/.test(label)) violations.push(`${label}: fixture historis masuk runtime`);
    const source = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
    function inspect(node: ts.Node) {
      if (ts.isStringLiteralLike(node) && /\b20(?:25|26)\b/.test(node.text)) violations.push(`${label}: tahun tetap ${node.text}`);
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
        const bindings = node.importClause?.namedBindings;
        const onlyTypes = !node.importClause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.every((element) => element.isTypeOnly);
        const specifier = node.moduleSpecifier.text;
        if (!onlyTypes && (specifier.startsWith("@/") || specifier.startsWith("."))) {
          const base = specifier.startsWith("@/") ? resolve("src", specifier.slice(2)) : resolve(dirname(filename), specifier);
          const target = [base + ".ts", base + ".tsx", base + ".js", join(base, "index.ts"), join(base, "index.tsx")].find(existsSync);
          if (target) visit(target);
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
  roots.forEach(visit);
  assert.ok(visited.size > 30, "Graf runtime harus benar-benar ditelusuri");
  assert.deepEqual(violations, []);
});
