# Volt — DESCO Prepaid Electricity Analytics Dashboard

MERN + TypeScript dashboard for tracking a DESCO prepaid electricity meter: log balance readings, and get hourly/daily/weekly/monthly usage, day-vs-night split, trend, and a projected monthly bill based on DESCO's slab tariff.

## Stack

- `client/` — React + TypeScript + Vite + Tailwind CSS + React Query + Recharts
- `server/` — Express + TypeScript + Mongoose (MongoDB)
- `shared/` — TypeScript types shared by both

## Running locally

Requires a local MongoDB running on `mongodb://127.0.0.1:27017` (adjust `server/.env` if different).

```bash
npm install
npm run build:shared

# in one terminal
npm run dev:server

# in another terminal
npm run dev:client
```

Open http://localhost:5173. The API runs on http://localhost:4000 (proxied by Vite under `/api`).

## Tests

```bash
npm run test:server
```

Unit tests cover the calculation engine (recharge detection, slab conversion, lifeline reclassification, interval splitting, projection) against the real sample dataset in `server/tests/calculationEngine/fixtures/sampleReadings.ts`.

## Notes

- Tariff slabs are seeded with DESCO rates as of the data available when this was built — verify against DESCO's official tariff page and adjust in **Settings** if they're out of date.
- The app assumes Bangladesh's fixed UTC+6 offset (no DST) for all day/night/hourly/monthly boundaries, regardless of the server's own timezone.
- After changing a tariff rate in Settings, use "Recalculate all" to reprice historical data against the new rates.
