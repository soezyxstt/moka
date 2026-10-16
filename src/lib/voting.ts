export function calculateVotesFromAmount(amount: number, pricePerVote: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Nominal pemasukan harus berupa bilangan bulat nonnegatif");
  }
  if (!Number.isSafeInteger(pricePerVote) || pricePerVote <= 0) {
    throw new Error("Harga per vote harus lebih dari nol");
  }
  return Math.floor(amount / pricePerVote);
}

export function calculateVotePaymentAmount(
  voteCount: number,
  pricePerVote: number,
  participantNumber: number,
) {
  if (!Number.isSafeInteger(voteCount) || voteCount <= 0) {
    throw new Error("Jumlah vote harus berupa bilangan bulat positif");
  }
  if (!Number.isSafeInteger(pricePerVote) || pricePerVote <= 0) {
    throw new Error("Harga per vote harus lebih dari nol");
  }
  if (!Number.isSafeInteger(participantNumber) || participantNumber < 0) {
    throw new Error("Nomor peserta tidak valid");
  }
  return pricePerVote * voteCount + participantNumber;
}

export function formatLocalDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
