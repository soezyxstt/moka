'use client';
import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ArrowLeft, Download, Search, Vote } from 'lucide-react';
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/custom/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { calculateVotePaymentAmount } from '@/lib/voting';

export type VotingPanelCandidate = {
  id: string;
  slug: string;
  number: number;
  name: string;
  code: string;
  imageUrl: string | null;
  qrImageUrl: string | null;
  votes: number | null;
  percentage: number | null;
  rank: number | null;
};

export type VotingPanelProps = {
  resultsVisible: boolean;
  totalVotes: number;
  results: { name: string; percentage: number }[];
  updatedAt?: Date | null;
  ended?: boolean;
};

const chartConfig = { percentage: { label: 'Persentase', color: 'var(--chart-1)' } } satisfies ChartConfig;
const number = new Intl.NumberFormat('id-ID');
const percentFormat = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function formatUpdateTimestamp(date: Date) {
  const day = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
  const month = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' }).format(date);
  const year = new Intl.DateTimeFormat('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(date).replace('.', ':');
  return `${day} ${month} ${year}, ${time} WIB`;
}

export function VotingPanel({
  resultsVisible,
  totalVotes,
  results,
  updatedAt,
  ended = false,
}: VotingPanelProps) {
  const resultsTitle = ended ? 'Hasil akhir' : 'Hasil sementara';
  return <div className="mt-6">
    <div>
      <h2 className="font-manrope text-xl font-semibold text-brand-900">{resultsTitle}</h2>
      {resultsVisible && updatedAt ? (
        <p className="mt-1 text-xs text-neutral-600">
          Terakhir diperbarui: {formatUpdateTimestamp(updatedAt)}
        </p>
      ) : null}
    </div>
    {resultsVisible && totalVotes > 0 ? <ChartContainer config={chartConfig} className="mt-6 aspect-auto w-full" style={{ height: Math.max(160, results.length * 40) }}>
      <BarChart accessibilityLayer data={results} layout="vertical" margin={{ left: 0, right: 56 }}>
        <XAxis type="number" dataKey="percentage" hide />
        <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.length > 20 ? `${value.slice(0, 19)}...` : value} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="percentage" fill="var(--color-percentage)" radius={4}>
          <LabelList dataKey="percentage" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value: ReactNode) => `${percentFormat.format(Number(value))}%`} />
        </Bar>
      </BarChart>
    </ChartContainer> : <p className="mt-4 text-left text-neutral-600">{resultsVisible ? 'Belum ada vote tercatat untuk kategori ini.' : `Hasil ${ended ? 'akhir' : 'sementara'} belum ditampilkan panitia.`}</p>}
  </div>;
}

export function VoteDialog({
  open,
  pricePerVote,
  candidates,
  resultsVisible,
  candidateNumberOffset = 0,
}: {
  open: boolean;
  pricePerVote: number;
  candidates: VotingPanelCandidate[];
  resultsVisible: boolean;
  candidateNumberOffset?: number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? candidates.filter((candidate) => `${candidate.name} ${candidate.code}`.toLowerCase().includes(term)) : candidates;
  }, [candidates, query]);
  const onOpenChange = (next: boolean) => {
    setDialogOpen(next);
    if (!next) { setQuery(''); setSelectedId(null); }
  };

  return <>
    <Button size="lg" disabled={!open || !candidates.length} onClick={() => setDialogOpen(true)} className="w-full justify-center gap-2 disabled:opacity-60 md:w-auto"><Vote className="size-4" aria-hidden />Vote sekarang</Button>
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md" data-lenis-prevent>
        {selected ? (
          <CandidateDetail
            key={selected.id}
            candidate={selected}
            total={candidates.length}
            pricePerVote={pricePerVote}
            resultsVisible={resultsVisible}
            candidateNumberOffset={candidateNumberOffset}
            onBack={() => setSelectedId(null)}
          />
        ) : <>
          <DialogHeader className="text-left">
            <DialogTitle>Pilih peserta</DialogTitle>
            <DialogDescription>Cari nama atau nomor peserta.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari peserta" aria-label="Cari peserta" className="h-10 pl-9" />
          </div>
          <ul className="-mx-2 max-h-80 overflow-y-auto" data-lenis-prevent>
            {filtered.map((candidate) => <li key={candidate.id}>
              <button type="button" onClick={() => setSelectedId(candidate.id)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-brand-50 focus-visible:bg-brand-50 focus-visible:outline-none">
                <Avatar candidate={candidate} />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-brand-900">{candidate.name}</span><span className="block text-xs text-neutral-600">{candidate.code}</span></span>
              </button>
            </li>)}
            {!filtered.length ? <li className="px-2 py-6 text-center text-sm text-neutral-600">Peserta tidak ditemukan.</li> : null}
          </ul>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}

function CandidateDetail({
  candidate,
  total,
  pricePerVote,
  resultsVisible,
  candidateNumberOffset = 0,
  onBack,
}: {
  candidate: VotingPanelCandidate;
  total: number;
  pricePerVote: number;
  resultsVisible: boolean;
  candidateNumberOffset?: number;
  onBack: () => void;
}) {
  const [voteCountInput, setVoteCountInput] = useState('1');
  const [confirmedVotes, setConfirmedVotes] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const parsedVotes = Number.parseInt(voteCountInput.trim(), 10);
  const validVotes = Number.isSafeInteger(parsedVotes) && parsedVotes >= 1 && /^\d+$/.test(voteCountInput.trim()) ? parsedVotes : null;
  const paymentAmount = confirmedVotes !== null && pricePerVote > 0
    ? calculateVotePaymentAmount(confirmedVotes, pricePerVote, candidate.number, candidateNumberOffset)
    : null;

  const downloadQr = async () => {
    if (!candidate.qrImageUrl) return;
    setDownloading(true);
    try {
      const blob = await (await fetch(candidate.qrImageUrl)).blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `qr-${candidate.code.toLowerCase()}-${candidate.slug}.${blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'}`;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      window.open(candidate.qrImageUrl, '_blank', 'noopener');
    } finally {
      setDownloading(false);
    }
  };

  if (confirmedVotes !== null && paymentAmount !== null) {
    return <>
      <button type="button" onClick={() => setConfirmedVotes(null)} className="flex w-fit items-center gap-1.5 rounded-md text-sm text-neutral-600 hover:text-brand-900"><ArrowLeft className="size-4" aria-hidden />Kembali</button>
      <DialogHeader className="text-left">
        <DialogTitle className="text-xl leading-tight">{candidate.name}</DialogTitle>
        <DialogDescription>{candidate.code} · {number.format(confirmedVotes)} vote</DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-left">
        <p className="text-xs text-neutral-600">Nominal pembayaran QRIS</p>
        <p className="mt-1 font-manrope text-2xl font-semibold text-brand-900">Rp {number.format(paymentAmount)}</p>
        <p className="mt-1 text-xs text-neutral-600">
          {number.format(confirmedVotes)} vote x Rp {number.format(pricePerVote)} + kode unik {candidate.number + candidateNumberOffset}
        </p>
        <p className="mt-2 text-xs text-neutral-600">
          Masukkan nominal tepat hingga digit terakhir saat membayar dengan QRIS.
        </p>
      </div>
      {candidate.qrImageUrl ? <div className="flex flex-col items-center gap-4">
        <Image src={candidate.qrImageUrl} unoptimized alt={`QR voting ${candidate.name}`} width={224} height={224} className="aspect-square rounded-lg border border-neutral-200 bg-canvas object-contain p-2" />
        <Button size="lg" onClick={downloadQr} disabled={downloading} className="w-full justify-center gap-2"><Download className="size-4" aria-hidden />{downloading ? 'Mengunduh' : 'Unduh QR'}</Button>
      </div> : <p className="text-sm text-neutral-600">QR voting belum tersedia.</p>}
    </>;
  }

  return <>
    <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 rounded-md text-sm text-neutral-600 hover:text-brand-900"><ArrowLeft className="size-4" aria-hidden />Kembali</button>
    <div className="flex items-center gap-4">
      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-lg bg-brand-100">
        {candidate.imageUrl ? <Image src={candidate.imageUrl} alt={candidate.name} fill sizes="96px" className="object-cover object-top" /> : null}
      </div>
      <DialogHeader className="min-w-0 text-left">
        <DialogTitle className="text-xl leading-tight">{candidate.name}</DialogTitle>
        <DialogDescription>{candidate.code}</DialogDescription>
      </DialogHeader>
    </div>
    <dl className="grid grid-cols-2 divide-x divide-neutral-200 border-y border-neutral-200 py-3">
      <div className="pr-4"><dt className="text-xs text-neutral-600">Posisi</dt><dd className="mt-1 font-manrope text-lg font-semibold text-brand-900">{resultsVisible && candidate.rank ? `${candidate.rank} dari ${total}` : 'Belum tampil'}</dd></div>
      <div className="pl-4"><dt className="text-xs text-neutral-600">Persentase vote</dt><dd className="mt-1 font-manrope text-lg font-semibold text-brand-900">{resultsVisible && candidate.percentage !== null ? `${percentFormat.format(candidate.percentage)}%` : 'Belum tampil'}</dd></div>
    </dl>
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (validVotes !== null && pricePerVote > 0) setConfirmedVotes(validVotes);
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5 text-left">
        <label htmlFor="vote-count-input" className="block text-sm font-medium text-brand-900">Ingin vote berapa?</label>
        <Input
          id="vote-count-input"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={voteCountInput}
          onChange={(event) => setVoteCountInput(event.target.value)}
          placeholder="Masukkan jumlah vote"
          className="h-10"
        />
        {pricePerVote > 0 ? <p className="text-xs text-neutral-600">Harga per vote: Rp {number.format(pricePerVote)}</p> : null}
      </div>
      <Button type="submit" size="lg" disabled={validVotes === null || pricePerVote <= 0} className="w-full justify-center">
        Lanjut
      </Button>
    </form>
  </>;
}

function Avatar({ candidate }: { candidate: VotingPanelCandidate }) {
  return <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-brand-100">
    {candidate.imageUrl ? <Image src={candidate.imageUrl} alt="" fill sizes="40px" className="object-cover object-top" /> : <span className="grid size-full place-items-center text-xs font-semibold text-brand-800">{candidate.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span>}
  </span>;
}
