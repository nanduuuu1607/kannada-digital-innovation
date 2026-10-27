# KannadaMitra

KannadaMitra helps newcomers, students, employees, and travellers learn practical Kannada and communicate more confidently in everyday Karnataka life.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/kannada-mitra run typecheck` — typecheck the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run export:zip` — create a source ZIP for hackathon submission
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Optional secret: `GEMINI_API_KEY` — enables live tutor responses; sample mode works without it

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/kannada-mitra/` — React/Vite app, routes, and UI
- `artifacts/api-server/src/routes/tutor.ts` — server-side Gemini tutor and sample mode
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `README.md` — run, configure, publish, and ZIP export instructions

## Architecture decisions

- Learning progress and favorites are local to the browser; no account or cloud-sync service is required for the demo.
- Gemini is called only from the API server. When `GEMINI_API_KEY` is absent, the endpoint labels its response as sample content.

## Product

- Practical Kannada lessons, phrasebook, pronunciation, quizzes, conversation practice, progress tracking, and an optional Gemini tutor.

## User preferences

- Use a navy blue, white, and saffron visual palette.

## Gotchas

- Keep `GEMINI_API_KEY` in Replit Secrets; never add it to frontend code or `VITE_` variables.
- When changing the API contract, rerun `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
