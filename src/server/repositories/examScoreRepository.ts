import { Prisma, type ExamScore, type PrismaClient } from "@prisma/client";
import { SubjectCatalog, type ScoreLevelKey, type SubjectKey } from "../subjects";

export type SubjectReport = {
  key: SubjectKey;
  label: string;
  levels: Record<ScoreLevelKey, number>;
};

export class ExamScoreRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly catalog: SubjectCatalog
  ) {}

  findByRegistrationNumber(sbd: string): Promise<ExamScore | null> {
    return this.prisma.examScore.findUnique({ where: { sbd } });
  }

  async getReport(): Promise<SubjectReport[]> {
    const reports = await Promise.all(
      this.catalog.all().map(async (subject) => {
        const [excellent, good, average, belowAverage] = await Promise.all([
          this.prisma.examScore.count({
            where: { [subject.key]: { gte: 8 } }
          }),
          this.prisma.examScore.count({
            where: { [subject.key]: { gte: 6, lt: 8 } }
          }),
          this.prisma.examScore.count({
            where: { [subject.key]: { gte: 4, lt: 6 } }
          }),
          this.prisma.examScore.count({
            where: { [subject.key]: { lt: 4 } }
          })
        ]);

        return {
          key: subject.key,
          label: subject.label,
          levels: { excellent, good, average, belowAverage }
        };
      })
    );

    return reports;
  }

  async getTopGroupA(limit = 10) {
    const isSqlite = process.env.DATABASE_URL?.startsWith("file:");
    const totalExpression = isSqlite
      ? Prisma.sql`ROUND(toan + vat_li + hoa_hoc, 2)`
      : Prisma.sql`ROUND((toan + vat_li + hoa_hoc)::numeric, 2)::float`;

    return this.prisma.$queryRaw<
      Array<{
        sbd: string;
        toan: number;
        vatLi: number;
        hoaHoc: number;
        total: number;
      }>
    >`
      SELECT
        sbd,
        toan,
        vat_li AS "vatLi",
        hoa_hoc AS "hoaHoc",
        ${totalExpression} AS total
      FROM exam_scores
      WHERE toan IS NOT NULL
        AND vat_li IS NOT NULL
        AND hoa_hoc IS NOT NULL
      ORDER BY total DESC, sbd ASC
      LIMIT ${limit}
    `;
  }

  countAll(): Promise<number> {
    return this.prisma.examScore.count();
  }
}
