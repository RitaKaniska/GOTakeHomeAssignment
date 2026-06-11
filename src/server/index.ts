import "dotenv/config";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { prisma } from "./db.js";
import { ExamScoreRepository } from "./repositories/examScoreRepository.js";
import { SubjectCatalog } from "./subjects.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const catalog = new SubjectCatalog();
const repository = new ExamScoreRepository(prisma, catalog);

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res, next) => {
  try {
    res.json({ ok: true, records: await repository.countAll() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/subjects", (_req, res) => {
  res.json({
    subjects: catalog.all().map(({ key, label }) => ({ key, label })),
    levels: catalog.levels
  });
});

app.get("/api/scores/:sbd", async (req, res, next) => {
  try {
    const parsed = z
      .string()
      .trim()
      .regex(/^\d{8}$/, "Registration number must contain exactly 8 digits.")
      .safeParse(req.params.sbd);

    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message });
      return;
    }

    const score = await repository.findByRegistrationNumber(parsed.data);
    if (!score) {
      res.status(404).json({ message: "Registration number was not found." });
      return;
    }

    res.json({ score });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/subjects", async (_req, res, next) => {
  try {
    res.json({ reports: await repository.getReport() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/top/group-a", async (_req, res, next) => {
  try {
    res.json({ students: await repository.getTopGroupA(10) });
  } catch (error) {
    next(error);
  }
});

const clientBuildPath = resolve(process.cwd(), "dist");
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (_req, res) => {
    res.sendFile(resolve(clientBuildPath, "index.html"));
  });
}

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
);

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`G-Scores API is running at http://localhost:${port}`);
  });
}

export default app;
