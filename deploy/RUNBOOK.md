# MAKAZOH — Hostinger Deployment Runbook

Status: PREPARED, NOT DEPLOYED. No DNS change, no public deploy, no merge
without explicit founder approval.

## 1. Coming Soon — static upload (works TODAY on any hosting)

`deploy/coming-soon/` is a complete static bundle (index.html + assets/, ~1 MB).
Upload its **contents** to `public_html/` via hPanel File Manager or FTP/SSH.
Domain/subdomain mapping comes later at DNS time:

- `makazoh.com`, `www.makazoh.com` → this bundle
- `app.makazoh.com` → Next.js web (VPS)
- `api.makazoh.com` → FastAPI (VPS)

The page posts leads to `https://api.makazoh.com` when served from the real
domain — until DNS + VPS are live, form posts fail silently (error message
shown to user). Page itself is fully functional for display.

Rebuild the bundle anytime: `cp -r infra/coming-soon deploy/coming-soon`.

## 2. Full stack — Hostinger VPS

Minimum: KVM 2 (2 vCPU / 8 GB / 100 GB). Recommended: KVM 4 (4 vCPU / 16 GB /
200 GB) — headroom for Postgres + MinIO growth and image pulls. KVM 1 (4 GB)
does NOT fit the stack (~6 GB working set, see §4).

### First deploy sequence

```bash
# on the VPS (Ubuntu 24.04)
apt update && apt install -y docker.io docker-compose-v2
git clone https://github.com/islamelbaz2010/StayOS.git && cd StayOS
git checkout <release-commit>
cp deploy/env/env.production.template .env.prod   # fill secrets
# 1) bring up data tier first
docker compose -f docker-compose.prod.yml up -d postgres redis minio
# 2) controlled migration — one-shot, additive-only
docker compose -f docker-compose.prod.yml run --rm migrate
# 3) full stack
docker compose -f docker-compose.prod.yml up -d
# 4) verify
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:8000/health          # via api container net or caddy
curl -skI https://api.makazoh.com/health      # after DNS + TLS
```

NEVER run `scripts/seed_*.py` on production — they write synthetic data.

### Rollback

```bash
docker compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml up -d
# DB is append-only per migration; restore from backup only if needed
```

### Backup / restore

```bash
# backup (repo ships scripts/backup.py + a backup service in prod compose)
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER -Fc $DB_NAME > backup-$(date +%F).dump
# restore
cat backup-XXXX.dump | docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists
```

### TLS / domains

Caddyfile already routes makazoh.com/www → coming-soon:8080,
app.* → web:3000, api.* → api:8000, auto-issuing ACME certs once DNS A/AAAA
records point at the VPS. `DOMAIN_ROOT=makazoh.com` in `.env.prod`.

## 3. Local browser QA (reproducible)

```bash
cd apps/web && npm ci
npx playwright install chromium   # or rely on system Chrome
node scripts/coming-soon-qa.mjs   # stubs /api/v1/public/* — UI checks only
```

39 checks: 5 viewports × EN/AR, fonts, overflow, forms, events.
Screenshots → `.qa-screenshots/coming-soon-qa/`.

## 4. Resource budget (measured from docker-compose.prod.yml)

api 1.5 GB (limit) · web 768 MB · postgres ~1 GB · redis ~0.3 GB ·
worker ~1 GB · beat ~0.2 GB · minio ~0.5 GB · caddy×2 ~0.15 GB ·
OS+docker ~1 GB ≈ **~6 GB working set**.
