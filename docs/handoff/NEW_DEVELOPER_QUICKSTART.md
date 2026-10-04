# New Developer Quickstart

Goal: backend + web + mobile running locally, tests green, without any
production credentials.

## 1. Prerequisites
- Python 3.11+, Node 20+, pnpm/npm, Docker (Postgres+Redis) or local installs
- Expo Go (physical device) or Android Studio/Xcode for mobile
- `git`, `railway` CLI only needed for prod ops

## 2. Get the source
Extract `STAYOS_SOURCE_HANDOFF_2026-10-04.zip` or clone the repo.

## 3. Backend
```bash
cp .env.example .env                  # fill local values (no prod creds needed)
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"               # or requirements*.txt
docker compose up -d postgres redis   # or your local Postgres+Redis
alembic upgrade head
pytest tests/ -x -q                   # backend suite (creates test schema)
uvicorn src.app.main:app --reload     # http://localhost:8000
```
Smoke: `curl localhost:8000/health` → `{"status":"ok",...}`.
Dev login: `POST /api/v1/auth/dev-token` works in `ENVIRONMENT=development`.

## 4. Web
```bash
cd apps/web
cp .env.local.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install && npm run dev            # http://localhost:3000
npm test                              # 222 tests
npx tsc --noEmit                      # types
```

## 5. Mobile
```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://<LAN-IP>:8000 npx expo start
```
Physical device must reach the LAN IP (localhost won't work on-device).

## 6. Verify
`pytest`, web tests, `tsc`, `npm run build` all green = ready to work.

## 7. Deploy context (read `31_DEPLOYMENT.md`)
Railway (api/worker/beat) + Vercel (web); migrations via `railway connect`
tunnel. The AWS `deploy-*.yml` workflows are stale — ignore them.
