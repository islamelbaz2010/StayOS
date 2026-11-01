# MAKAZOH — Hostinger Deployment Runbook

Target: one Hostinger VPS running the full application stack via
`docker-compose.prod.yml`. Railway/Vercel remain the source environment
until the founder approves decommission.

Status: **prepared, not executed** — requires VPS purchase (founder action).

## 1. Prerequisites (founder actions)

| # | Action | Detail |
|---|--------|--------|
| 1 | Purchase Hostinger **KVM 4** (4 vCPU / 16 GB / 200 GB) | EU DC preferred (closest to `ams` bucket region during transition). KVM 2 works for a staging-only box. |
| 2 | Select Ubuntu **24.04 LTS** | Hostinger 1-click template. |
| 3 | Enable weekly VPS backup | Convenience snapshot — NOT the data backup (§9). |
| 4 | Add your SSH public key | Provide the server IP; do not send passwords. |
| 5 | GoDaddy: confirm no mailbox exists before DNS work | DMARC record alone is not proof. |

## 2. VPS bootstrap (runs once)

```bash
# as root
apt-get update && apt-get -y upgrade
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && cp /root/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh
# harden sshd
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh
# firewall
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
# docker
apt-get install -y docker.io docker-compose-plugin
usermod -aG docker deploy
# layout
mkdir -p /srv/makazoh/{backups,env} && chown -R deploy:deploy /srv/makazoh
```

## 3. Environment files (on host, never committed)

Create `/srv/makazoh/env/.env.prod` and `.env.qa` from `.env.example`.
Critical values:

```
ENVIRONMENT=production            # dev-token is development-only — never enabled here
DATABASE_URL=postgresql+asyncpg://app_prod:<pw>@postgres:5432/makazoh_prod
REDIS_URL=redis://:<pw>@redis:6379/0
S3_ENDPOINT_URL=http://minio:9000
S3_REGION=auto                    # MinIO/Tigris signing scope — required
S3_ADDRESSING_STYLE=path          # required for MinIO single-host endpoints
S3_LISTINGS_BUCKET=stayos-listings
S3_KYC_BUCKET=stayos-kyc
S3_PAYMENT_PROOF_BUCKET=stayos-payment-proofs
CORS_ORIGINS=https://app.makazoh.com
WEB_BASE_URL=https://app.makazoh.com
# JWT_PRIVATE_KEY / JWT_PUBLIC_KEY: RSA PEM, real newlines, generated per-env
```

QA file is identical except `DATABASE_URL`→`makazoh_qa`/`app_qa`,
sandbox payment keys, and `ENVIRONMENT=production` still applies (QA is
publicly reachable → dev-token must stay off).

## 4. Databases

`infra/postgres/init-dbs.sh` creates `makazoh_prod` + `makazoh_qa` with
separate roles (`app_prod` / `app_qa`) and enables PostGIS on first boot.

## 5. MinIO

Console bound to `127.0.0.1:9001` inside the container — **never publish
9001**. Presigned uploads use `path` addressing through the API's signed
URLs (browser hits `api.makazoh.com`-routed URLs or the MinIO endpoint
you choose to expose on the proxy). Create the three private buckets
once via `mc` inside the network:

```bash
docker compose -f docker-compose.prod.yml exec minio \
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
for b in stayos-listings stayos-kyc stayos-payment-proofs; do
  docker compose -f docker-compose.prod.yml exec minio mc mb local/$b
done
```

## 6. Deploy

```bash
cd /srv/makazoh && git clone --depth 1 https://github.com/islamelbaz2010/StayOS.git app
cd app
export ENV_SLOT=prod
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps          # all healthy
docker compose -f docker-compose.prod.yml logs api    # startup clean
curl -fsS http://localhost:8000/api/v1/healthz        # readiness
```

Migrations run automatically via the one-shot `migrate` service
(`alembic upgrade head`) before api/worker/beat start.

## 7. TLS + routing (Caddyfile — already authored)

`infra/proxy/Caddyfile`:
`makazoh.com`/`www` → `coming-soon:8080` · `app.*` → `web:3000` ·
`api.*` → `api:8000`. Caddy auto-issues TLS once DNS resolves.

## 8. Firebase / QA authentication

- Dev-token is `ENVIRONMENT=development` only — **absent on the VPS**.
- QA logins use the five seeded accounts (guest/host/admin/staff/field_staff)
  through the real Firebase phone-auth path → requires Firebase project
  keys (`FIREBASE_*` server vars + `NEXT_PUBLIC_FIREBASE_*` web build args).
- Founder must add `app.makazoh.com` to Firebase authorized domains and
  can register Firebase **test phone numbers** for the QA accounts to
  avoid SMS costs.

## 9. Backups

- `backup` service runs `scripts/backup_scheduler.py` nightly:
  `pg_dump` (plain) + `redis-cli --rdb` wire snapshot → `/backups` volume.
- Restore drills: `pg_restore`/`psql` into a scratch DB; `.rdb` into an
  isolated Redis (both verified locally).
- **Offsite (recommended):** rclone/rsync `/backups` + MinIO objects to
  an independent destination (e.g., Cloudflare R2 ~$0.015/GB). A VPS
  snapshot alone is not a backup — requires founder approval before any
  paid service.

## 10. DNS cutover (GoDaddy — approval-gated)

| Record | New value | TTL |
|---|---|---|
| `@` A | VPS IP | 300 |
| `www` CNAME | `makazoh.com` | 300 |
| `app` A | VPS IP | 300 |
| `api` A | VPS IP | 300 |

Do NOT touch MX/SPF/DKIM/DMARC until mailbox status is confirmed.

## 11. Rollback

1. `docker compose -f docker-compose.prod.yml up -d --force-recreate`
   with previous image tag.
2. DB: `alembic downgrade` only if the migration was breaking; otherwise
   restore latest `/backups` dump into a fresh DB and repoint `DATABASE_URL`.
3. DNS: revert the four records (they're independent — no NS change).

## 12. Smoke checklist (post-deploy)

- [ ] `https://makazoh.com` → Coming Soon (TLS green)
- [ ] `https://app.makazoh.com` → web loads, login renders
- [ ] `https://api.makazoh.com/api/v1/healthz` → 200
- [ ] listing photo presign→PUT→GET works (path-style on MinIO)
- [ ] `docker compose ps` — one `beat`, private ports only on 80/443
- [ ] nightly backup ran (`/backups` non-empty next morning)
