# G-Scores

G-Scores is a full-stack TypeScript application for the 2024 Vietnam national high school exam dataset. It imports the raw CSV into a database with Prisma ORM, then exposes a responsive dashboard for score lookup, score-level reports, and top group-A students.

## Features

- Import `dataset/diem_thi_thpt_2024.csv` into a database table.
- Search exam scores by registration number (`sbd`) with API and UI validation.
- Report score distributions for every subject across 4 levels: `>= 8`, `6 - < 8`, `4 - < 6`, and `< 4`.
- Display top 10 group-A students by `math + physics + chemistry`.
- OOP subject management through `Subject` and `SubjectCatalog`.
- Prisma ORM for database access.
- Responsive React dashboard.
- Vercel deployment config included.

## Tech Stack

- Frontend: React, Vite, TypeScript, CSS
- Backend: Express, TypeScript
- Local database: SQLite
- Vercel database: PostgreSQL
- ORM: Prisma

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

For local development, keep this SQLite URL in `.env`:

```text
DATABASE_URL="file:./dev.db"
```

Generate the local Prisma client:

```bash
npm run db:generate:local
```

This workspace already has `prisma/dev.db` imported. If you recreate the database from scratch, import the CSV dataset after creating the SQLite schema:

```bash
npm run db:import
```

The import loads 1,061,605 rows from `dataset/diem_thi_thpt_2024.csv`.

## Run In Development

Start the API:

```bash
npm run server
```

In another terminal, start the React app:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:3001`.

## Vercel Deployment

This project is configured for Vercel with `vercel.json` and `api/index.ts`.

Vercel serverless functions should use a hosted PostgreSQL database, not a local SQLite file. Create a hosted Postgres database first. Prisma Postgres, Neon, Supabase, or Vercel Marketplace Postgres providers all work.

1. Push this repository to GitHub.
2. Create a new Vercel project from the GitHub repository.
3. Add this environment variable in Vercel:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

4. In Vercel project settings, keep the build command as:

```bash
npm run vercel-build
```

5. Deploy.
6. Run the database migration against the production database from your machine:

```bash
npm run db:deploy
```

7. Import the dataset into the same production database from your machine:

```bash
npm run db:import
```

After deployment, the app is available at your Vercel URL. API routes are served under `/api`.

## Useful API Endpoints

```text
GET /api/health
GET /api/subjects
GET /api/scores/:sbd
GET /api/reports/subjects
GET /api/top/group-a
```
