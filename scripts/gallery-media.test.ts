import assert from "node:assert/strict";
import test from "node:test";
import { getGalleryMedia } from "../src/app/galeri/gallery-media";
import type { PublicGalleryAlbum } from "../src/server/cms/public-readers";

test("photo wall preserves anchors, unique covers, photos, videos, and accessible descriptions", () => {
  const album: PublicGalleryAlbum = {
    id: "album", slug: "audisi", title: "Audisi", description: null,
    ownerType: "event", coverUrl: "https://example.com/cover.jpg", coverAlt: "Foto bersama",
    items: [
      { id: "photo", imageUrl: "https://example.com/photo.jpg", imageAlt: "Peserta audisi", youtubeId: null, caption: "Caption" },
      { id: "video", imageUrl: null, imageAlt: null, youtubeId: "abcdefghijk", caption: "Video audisi" },
    ],
  };
  const media = getGalleryMedia([album]);
  assert.equal(media.length, 3);
  assert.equal(media[0].albumSlug, "audisi");
  assert.equal(media[0].alt, "Foto bersama");
  assert.equal(media[1].alt, "Peserta audisi");
  assert.equal(media[2].youtubeId, "abcdefghijk");
  assert.equal(media[2].alt, "Video audisi");
  const duplicateCover = getGalleryMedia([{ ...album, coverUrl: album.items[0].imageUrl }]);
  assert.equal(duplicateCover.length, 2);
  assert.equal(duplicateCover[0].albumSlug, "audisi");
  assert.deepEqual(getGalleryMedia([]), []);
});
