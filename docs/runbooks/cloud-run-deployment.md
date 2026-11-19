# Cloud Run Deployment Runbook (PAMOKA Garut)

This runbook covers deploying the PAMOKA Garut Next.js application to Google Cloud Run in project `pamoka-garut`, region `asia-southeast1` (Singapore).

## Why `asia-southeast1` (Singapore)

- Native (free) Cloud Run Domain Mapping is supported in `asia-southeast1`, avoiding the monthly cost of an External HTTP(S) Load Balancer.
- Low latency to Garut / West Java.
- Preserves all Better Auth session cookies on `/admin` (unlike Firebase Hosting rewrites, which strip cookies other than `__session`).

## Cost-Optimized Baseline Configuration

- Billing: Request-based (`--cpu-throttling`), \$0 when idle.
- Scaling: `--min-instances=0`, `--max-instances=10`, `--concurrency=80`.
- Compute: `--cpu=1`, `--memory=1Gi` (headroom for `sharp` image optimization), `--cpu-boost` for faster cold starts.
- Health check: `GET /api/health` (lightweight JSON response, no Turso query).

## Prerequisites

1. Authenticated `gcloud` CLI with access to project `pamoka-garut`.
2. Required APIs enabled in `pamoka-garut` (ask operator approval before enabling):
   - `run.googleapis.com`
   - `cloudbuild.googleapis.com`
   - `artifactregistry.googleapis.com`
   - `secretmanager.googleapis.com` (recommended for secrets)
3. Runtime environment variables prepared (never bake secrets into the Docker image; `Dockerfile` builds with `SKIP_ENV_VALIDATION=1`):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `BASE_URL` (e.g. `https://www.pamokagarut.com`)
   - `BETTER_AUTH_URL` (e.g. `https://www.pamokagarut.com`)
   - `BETTER_AUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `UPLOADTHING_TOKEN`

## Step 1: Deploy from Source

Run from the repository root. Replace `<SERVICE_NAME>` (for example `pamoka-garut-web`) and pass your runtime secrets via `--set-secrets` (Secret Manager) or `--set-env-vars`.

```bash
gcloud run deploy pamoka-garut-web \
  --project=pamoka-garut \
  --region=asia-southeast1 \
  --source=. \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --cpu-throttling \
  --cpu-boost \
  --set-env-vars="BASE_URL=https://www.pamokagarut.com,BETTER_AUTH_URL=https://www.pamokagarut.com" \
  --set-secrets="TURSO_DATABASE_URL=TURSO_DATABASE_URL:latest,TURSO_AUTH_TOKEN=TURSO_AUTH_TOKEN:latest,BETTER_AUTH_SECRET=BETTER_AUTH_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,UPLOADTHING_TOKEN=UPLOADTHING_TOKEN:latest" \
  --quiet
```

Notes:
- When testing on the temporary `*.run.app` URL before DNS cutover, set `BASE_URL` and `BETTER_AUTH_URL` to the `*.run.app` URL and add `https://<service-url>/api/auth/callback/google` to the Google OAuth client's authorized redirect URIs.
- Before DNS cutover to `www.pamokagarut.com`, update `BASE_URL` and `BETTER_AUTH_URL` back to `https://www.pamokagarut.com`.

## Step 2: Verify Service Before Cutover

1. Check `GET https://<service-url>/api/health` returns `200` with `{"ok":true}`.
2. Open the public homepage, `/voting`, `/berita`, and `/admin/login`.
3. Confirm images optimize cleanly via `/_next/image` (`sharp`) and sponsor logos load cleanly.
4. Confirm Google OAuth sign-in works on `/admin`.

## Step 3: Map Custom Domain (`www.pamokagarut.com`)

1. Open Google Cloud Console -> Cloud Run -> Custom Domains -> Add Mapping.
2. Select service `pamoka-garut-web` in `asia-southeast1` and enter `www.pamokagarut.com`.
3. Update the DNS `CNAME` record at your DNS provider to point `www` to `ghs.googlehosted.com.` (keep TTL low before cutover so rollback is fast).
4. Wait for Google-managed TLS certificate provisioning to reach Active status.
5. Verify `https://www.pamokagarut.com/api/health` and public/admin pages.

## Step 4: Keep Artifact Registry Storage Within Free Tier

Create a `cleanup-policy.json` file keeping only the 3 most recent container images:

```json
[
  {
    "name": "keep-latest-3",
    "action": { "type": "Keep" },
    "mostRecentVersions": { "keepCount": 3 }
  },
  {
    "name": "delete-older",
    "action": { "type": "Delete" },
    "condition": { "olderThan": "604800s" }
  }
]
```

Preview first with `--dry-run`, then apply to the `cloud-run-source-deploy` repository:

```bash
gcloud artifacts repositories set-cleanup-policies cloud-run-source-deploy \
  --project=pamoka-garut \
  --location=asia-southeast1 \
  --policy=cleanup-policy.json \
  --dry-run \
  --quiet
```

Once verified, run the same command without `--dry-run`.

## Pembukaan kembali voting setelah penggantian QRIS

1. Pertahankan status tertutup saat mengganti QRIS melalui Pustaka Media dan profil peserta pada tahap sumber kampanye.
2. Cocokkan setiap kode peserta pada daftar kampanye dengan file baru. Verifikasi gambar UploadThing yang tersimpan dan pindai isinya sebelum aktivasi.
3. Di **Voting**, pilih kampanye tertutup dan jalankan **Buka kembali** dengan nama kampanye dan alasan. Konfirmasikan jadwal masih berlaku serta audit `voting.campaign.reopen` tercatat.
4. Cek halaman publik `/voting`, jadwal, tombol **Vote sekarang**, dan QRIS tiap kategori. Bila QRIS salah atau gagal dimuat, tutup kampanye melalui konsol Voting sebelum melanjutkan pemeriksaan.

## Voting Peak Tuning (Optional)

Before a high-traffic voting window, optionally warm 1 instance to eliminate cold starts:

```bash
gcloud run services update pamoka-garut-web \
  --project=pamoka-garut \
  --region=asia-southeast1 \
  --min-instances=1 \
  --quiet
```

After the voting period ends, scale back to zero to minimize cost:

```bash
gcloud run services update pamoka-garut-web \
  --project=pamoka-garut \
  --region=asia-southeast1 \
  --min-instances=0 \
  --quiet
```

## Future Cost Optimization (Unoptimized Images)

When ready to remove server-side `next/image` processing:
1. Set `images: { unoptimized: true }` in `next.config.ts`.
2. Remove `sharp` from `package.json`.
3. Lower Cloud Run memory from `1Gi` to `512Mi` via `gcloud run services update`.

## Rollback to Vercel

If issues appear after DNS cutover, point the `www.pamokagarut.com` DNS `CNAME` record back to Vercel. Because both Vercel and Cloud Run share the same Turso database and UploadThing storage, rollback is immediate with no data loss.
