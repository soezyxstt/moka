import assert from "node:assert/strict";
import test from "node:test";
import { parsePublicDocument, publicPdfUrl } from "../src/server/cms/public-document";

test("published legal document metadata is parsed without inventing a media reference", () => {
  assert.deepEqual(parsePublicDocument('{"documentMediaId":"pdf-1","documentTitle":"Surat keputusan"}'), {
    documentMediaId: "pdf-1", documentTitle: "Surat keputusan",
  });
  assert.equal(parsePublicDocument(undefined), null);
  assert.equal(parsePublicDocument("{"), null);
  assert.equal(parsePublicDocument('{"documentMediaId":42}'), null);
  assert.equal(parsePublicDocument('{"documentMediaId":""}'), null);
  assert.equal(parsePublicDocument('{"documentMediaId":"pdf-1"}')?.documentTitle, "Dokumen legalitas organisasi");
});

test("only ready PDF media with a safe remote URL is exposed", () => {
  const media = { url: "https://example.com/legal.pdf", mimeType: "application/pdf", lifecycle: "ready" };
  assert.equal(publicPdfUrl(media), media.url);
  assert.equal(publicPdfUrl(undefined), null);
  assert.equal(publicPdfUrl({ ...media, lifecycle: "deleted" }), null);
  assert.equal(publicPdfUrl({ ...media, mimeType: "image/png" }), null);
  for (const url of ["javascript:alert(1)", "file:///legal.pdf", "https://user:password@example.com/legal.pdf", "invalid"]) {
    assert.equal(publicPdfUrl({ ...media, url }), null);
  }
});
