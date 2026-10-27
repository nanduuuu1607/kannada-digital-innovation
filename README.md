# KannadaMitra — Your AI Kannada Companion

KannadaMitra helps newcomers, students, employees, and travellers learn practical Kannada for everyday life in Karnataka. It was created for the Kannada Digital Innovation Hackathon 2026, based on the challenge “Kannada for Everyone.”

## What’s included

- A learning dashboard and beginner-to-advanced sample lessons
- Kannada script, English transliteration, and meanings
- Searchable, category-based phrasebook with favorites
- Multiple-choice quizzes with scores and explanations
- Guided real-life practice for travel, shopping, restaurants, and other situations
- Kannada pronunciation through browser speech synthesis when a Kannada voice is available
- Progress and favorites saved in the current browser using local storage
- A server-side Gemini tutor endpoint with an honest sample-response mode when Gemini is not configured
- An About page explaining the challenge, solution, technology, and social impact

Learning content and practice work without an AI key. Progress and favorites are stored in the browser and do not sync between devices.

## Run on Replit

1. Open the project in Replit and use **Run**. The project has separate web and API workflows:
   - `artifacts/kannada-mitra: web`
   - `artifacts/api-server: API Server`
2. The web app runs at the root preview. The API is available under `/api`.
3. To enable live Gemini tutoring, add `GEMINI_API_KEY` in **Tools → Secrets**. The key is read only by the API server and is never sent to the browser. Restart the API Server workflow after adding it.
4. Without `GEMINI_API_KEY`, the tutor returns a clearly labeled sample response. If a configured Gemini request fails, the API reports an error rather than silently replacing it with sample content.

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

In a second terminal, run the web app with the Vite environment values supplied by the Replit workflow:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/kannada-mitra run dev
```

The API listens on `PORT` and handles `/api/*`. Set `GEMINI_API_KEY` in the server environment to enable live tutoring. Keep it out of frontend environment variables and source control.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Server-only key for Gemini 2.5 Flash tutoring. Without it, the tutor uses a sample response. |
| `PORT` | Provided by workflow | Port for the API or web service. |
| `BASE_PATH` | Provided by workflow | Web app mount path. |

The tutor endpoint is `POST /api/gemini/tutor`. It accepts a message, learner level, and optional practice context. It validates requests against the generated OpenAPI contract before calling Gemini.

## Development checks

```bash
pnpm run typecheck
pnpm --filter @workspace/kannada-mitra run typecheck
pnpm --filter @workspace/api-server run typecheck
```

## Publish

Use Replit’s **Publish** action from the project to publish the web app. Add `GEMINI_API_KEY` to Replit Secrets before publishing if the live tutor should be enabled; otherwise the app remains usable in sample mode.

## Export a ZIP for submission

- In Replit, open the three-dot menu at the top of the file tree and choose **Download as zip**.
- Or run `pnpm run export:zip` from the project root. It creates `KannadaMitra-submission.zip`, excluding dependency folders, build output, local agent files, and `.env` files.

## Project structure

- `artifacts/kannada-mitra` — React, TypeScript, Vite, and Tailwind frontend
- `artifacts/api-server` — Express API and server-only Gemini tutor integration
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/api-client-react` and `lib/api-zod` — generated client hooks and validation schemas
