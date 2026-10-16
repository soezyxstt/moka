import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { getImgProps } from "next/dist/shared/lib/get-img-props";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import defaultLoader from "next/dist/shared/lib/image-loader";

for (const path of ["src/components/admin/admin-shell.tsx", "src/app/admin/media/uploader.tsx"]) test(`${path} loads extensionless SVG directly and optimizes raster images`, () => {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const logos: ts.JsxSelfClosingElement[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "Image" && node.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "src" && ["{branding.logo.url}", "{asset.url}", "{selectedAsset.url}"].includes(attribute.initializer?.getText(source) ?? ""))) logos.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(logos.length, 3, "all three image surfaces remain covered");
  const url = "https://yzk8cdswcm.ufs.sh/f/extensionless-brand-key";
  for (const logo of logos) {
    const attribute = logo.attributes.properties.find((item): item is ts.JsxAttribute => ts.isJsxAttribute(item) && item.name.getText(source) === "unoptimized");
    const expression = attribute?.initializer && ts.isJsxExpression(attribute.initializer) ? attribute.initializer.expression?.getText(source) : "false";
    for (const mimeType of ["image/svg+xml", "image/png"]) {
      const unoptimized = new Function("branding", "asset", "selectedAsset", `return (${expression ?? "false"})`)({ logo: { mimeType } }, { mimeType }, { mimeType }) as boolean;
      const { props } = getImgProps({ src: url, alt: "MOKA Garut", width: 150, height: 57, unoptimized }, {
        imgConf: { ...imageConfigDefault, remotePatterns: [{ protocol: "https", hostname: "yzk8cdswcm.ufs.sh" }] }, defaultLoader,
      });
      if (mimeType === "image/svg+xml") {
        assert.equal(props.src, url, "SVG must load directly from UploadThing");
        assert.equal(props.srcSet, undefined);
      } else assert.ok(props.src.startsWith("/_next/image?"), "raster optimization remains enabled");
    }
  }
});
