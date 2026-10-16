import assert from "node:assert/strict";
import test from "node:test";

import { calculateVotePaymentAmount, calculateVotesFromAmount, formatLocalDate } from "../../lib/voting";

test("jumlah vote diturunkan dari nominal pemasukan dan harga kampanye", () => {
  assert.equal(calculateVotesFromAmount(10_000, 2_000), 5);
  assert.equal(calculateVotesFromAmount(9_999, 2_000), 4);
});

test("nominal pembayaran QRIS menambahkan nomor peserta sebagai kode unik", () => {
  assert.equal(calculateVotePaymentAmount(20, 2_000, 2), 40_002);
  assert.equal(calculateVotePaymentAmount(1, 2_000, 15), 2_015);
  assert.throws(() => calculateVotePaymentAmount(0, 2_000, 2));
});

test("nominal pembayaran QRIS untuk kategori dewasa mengakomodasi offset total rumaja", () => {
  // Misalnya 40 peserta rumaja (total JR + MR = 40), peserta dewasa nomor 1 mendapatkan offset + 40
  assert.equal(calculateVotePaymentAmount(20, 2_000, 1, 40), 40_041);
  assert.equal(calculateVotePaymentAmount(1, 2_000, 15, 40), 2_055);
  assert.throws(() => calculateVotePaymentAmount(20, 2_000, 1, -1));
  assert.throws(() => calculateVotePaymentAmount(20, 2_000, 1, 1.5));
});

test("nominal atau harga kampanye yang tidak valid ditolak", () => {
  assert.throws(() => calculateVotesFromAmount(-1, 2_000));
  assert.throws(() => calculateVotesFromAmount(2_000, 0));
  assert.throws(() => calculateVotesFromAmount(Number.MAX_SAFE_INTEGER + 1, 2_000));
});

test("tanggal lokal kampanye mengikuti zona Asia/Jakarta", () => {
  assert.equal(formatLocalDate(new Date("2026-01-01T00:30:00+07:00"), "Asia/Jakarta"), "2026-01-01");
  assert.equal(formatLocalDate(new Date("2025-12-31T17:30:00Z"), "Asia/Jakarta"), "2026-01-01");
});
