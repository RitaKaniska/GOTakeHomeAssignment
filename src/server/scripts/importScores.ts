import "dotenv/config";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { prisma } from "../db";
import { SubjectCatalog } from "../subjects";

type ImportRow = {
  sbd: string;
  toan: number | null;
  nguVan: number | null;
  ngoaiNgu: number | null;
  vatLi: number | null;
  hoaHoc: number | null;
  sinhHoc: number | null;
  lichSu: number | null;
  diaLi: number | null;
  gdcd: number | null;
  maNgoaiNgu: string | null;
};

const csvPath = resolve(process.cwd(), "dataset", "diem_thi_thpt_2024.csv");
const batchSize = 5000;
const catalog = new SubjectCatalog();

function toRow(values: string[]): ImportRow | null {
  const sbd = values[0]?.trim();
  if (!/^\d{8}$/.test(sbd)) return null;

  return {
    sbd,
    toan: catalog.parseScore(values[1]),
    nguVan: catalog.parseScore(values[2]),
    ngoaiNgu: catalog.parseScore(values[3]),
    vatLi: catalog.parseScore(values[4]),
    hoaHoc: catalog.parseScore(values[5]),
    sinhHoc: catalog.parseScore(values[6]),
    lichSu: catalog.parseScore(values[7]),
    diaLi: catalog.parseScore(values[8]),
    gdcd: catalog.parseScore(values[9]),
    maNgoaiNgu: values[10]?.trim() || null
  };
}

async function flush(rows: ImportRow[]) {
  if (rows.length === 0) return;
  await prisma.examScore.createMany({
    data: rows
  });
}

async function main() {
  const file = createReadStream(csvPath);
  const lines = createInterface({ input: file, crlfDelay: Infinity });
  const batch: ImportRow[] = [];
  let imported = 0;
  let skipped = 0;
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    if (lineNumber === 1) continue;

    const row = toRow(line.split(","));
    if (!row) {
      skipped += 1;
      continue;
    }

    batch.push(row);
    if (batch.length >= batchSize) {
      await flush(batch);
      imported += batch.length;
      batch.length = 0;
      if (imported % 100000 === 0) {
        console.log(`Imported ${imported.toLocaleString()} rows...`);
      }
    }
  }

  await flush(batch);
  imported += batch.length;
  console.log(`Import complete. Imported ${imported.toLocaleString()} rows, skipped ${skipped}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
