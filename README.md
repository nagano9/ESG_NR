# AIPulse ESG

AIPulse ESG is a command-center style ESG management app for Nusantara Renewable Holding. It combines disclosure tracking, GHG inventory views, double materiality, safeguard checks, action tracking, stakeholder mapping, and AI-assisted disclosure drafting.

## Stack

- React 19, Vite, Tailwind CSS
- Express API served from `server.ts`
- Drizzle ORM with PostgreSQL
- Firebase Authentication
- Gemini API for disclosure drafting and gap analysis

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Fill the PostgreSQL, Firebase, and Gemini values in `.env`.

4. Apply the initial database schema to an empty PostgreSQL database:

   ```bash
   psql "$DATABASE_URL" -f drizzle/0000_initial_esg_schema.sql
   ```

5. Optionally set `SEED_ON_STARTUP="true"` for local demo data.

6. Run the development server:

   ```bash
   bun run dev
   ```

7. Open the app at `http://localhost:3000`.

## Useful Scripts

- `bun run dev` starts the Express API and Vite middleware.
- `bun run build` builds the frontend and bundles the server.
- `bun run start` runs the production server from `dist/server.cjs`.
- `bun run lint` runs TypeScript checks.

## Data Model

The app stores ESG data in PostgreSQL through Drizzle tables for organizations, frameworks, disclosure requirements, data points, GHG inventory, materiality assessments, action tracking, evidence, audit logs, stakeholders, and engagements.

## AI Guardrails

AI-generated disclosure drafts should be treated as assisted narrative text, not a calculated source of truth. Quantitative values must come from stored ESG data points, GHG inventory records, or approved framework mappings.

## Current Development Focus

- Replace mock dashboard data with API-backed data.
- Add request validation and audit logging.
- Connect disclosure drafting and gap analysis to the backend Gemini routes.
- Add migrations, tests, and production deployment guidance.
