# KannadaMitra — Your AI Kannada Companion

KannadaMitra is a practical Kannada-learning app for newcomers, students, employees, and travellers in Karnataka. It was built for the Kannada Digital Innovation Hackathon 2026.

## Problem statement

**Challenge chosen: “Kannada for Everyone.”** People who are new to Kannada need an accessible way to learn useful words and phrases, understand pronunciation, and practice everyday situations—not just memorize vocabulary.

KannadaMitra combines guided lessons, a searchable phrasebook, quizzes, and real-life practice scenarios so learners can build confidence using Kannada in daily life.

## Features

- Beginner, intermediate, and advanced sample lessons
- Kannada script, English transliteration, and English meanings
- Searchable phrasebook with categories and favorites
- Multiple-choice quizzes with scores and answer explanations
- Guided practice for travel, shopping, restaurants, and other situations
- Browser speech synthesis when a Kannada voice is available
- Learning progress and favorites saved in browser local storage
- Optional Gemini tutor endpoint, with a clearly labeled sample mode when no API key is configured
- About page describing the challenge, solution, technology, and intended impact

Lessons, quizzes, and practice work without an AI key. Progress and favorites are stored in the current browser and do not sync between devices.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Wouter
- **API:** Node.js, Express, TypeScript
- **AI tutor:** Gemini 2.5 Flash through a server-side API request
- **API contract and validation:** OpenAPI, generated React client, Zod
- **Persistence:** Browser local storage for learner progress and favorites

## Requirements

- Node.js 20 or newer
- pnpm

## Setup and run locally

```bash
git clone <your-github-repository-url>
cd <repository-directory>
pnpm install
cp .env.example .env
```

Open two terminals from the project root. Start the API server in the first:

```bash
set -a && . ./.env && set +a
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Start the web app in the second:

```bash
set -a && . ./.env && set +a
PORT=23969 BASE_PATH=/ pnpm --filter @workspace/kannada-mitra run dev
```

Open `http://localhost:23969`. The Vite development server forwards `/api/*` requests to the local API server on port `8080`.

To enable live Gemini tutoring, set `GEMINI_API_KEY` in `.env` before starting the API server. The key is read only by the server; do not add it to frontend environment variables or commit `.env`. With the key left blank, the tutor returns a sample response. If a configured Gemini request fails, the API reports an error instead of silently substituting sample content.

## Run on Replit

Open the project in Replit and use **Run**. The project has separate web and API workflows:

- `artifacts/kannada-mitra: web`
- `artifacts/api-server: API Server`

The web app runs at the root preview, and the API is available under `/api`. To enable live Gemini tutoring, add `GEMINI_API_KEY` in **Tools → Secrets**, then restart the API Server workflow. Without the key, the tutor remains in sample mode.

## API

`POST /api/gemini/tutor` accepts a message, learner level, and optional practice context. Requests and responses are validated against the generated OpenAPI contract.

## Development checks

```bash
pnpm run typecheck
pnpm --filter @workspace/kannada-mitra run typecheck
pnpm --filter @workspace/api-server run typecheck
```

## Publish

Use Replit’s **Publish** action to publish the web app. Add `GEMINI_API_KEY` to Replit Secrets before publishing if live tutoring should be enabled; otherwise the app remains usable in sample mode.

## Submission notes

- Create or select a GitHub repository and push this project to it.
- Make the repository public, or grant the organizers access before submitting its URL.
- Keep `.env` and all real API keys out of Git; `.env.example` contains only a blank placeholder.
- The existing commit history is preserved. Use clear messages for future commits.

## Export a ZIP

- In Replit, open the three-dot menu at the top of the file tree and choose **Download as zip**.
- Or run `pnpm run export:zip` from the project root. It creates `KannadaMitra-submission.zip`, excluding dependency folders, build output, local agent files, and `.env` files.

## Project structure

- `artifacts/kannada-mitra` — React, TypeScript, Vite, and Tailwind frontend
- `artifacts/api-server` — Express API and server-only Gemini tutor integration
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/api-client-react` and `lib/api-zod` — generated client hooks and validation schemas
