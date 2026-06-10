import type { ExamScore } from "@prisma/client";

export type SubjectKey =
  | "toan"
  | "nguVan"
  | "ngoaiNgu"
  | "vatLi"
  | "hoaHoc"
  | "sinhHoc"
  | "lichSu"
  | "diaLi"
  | "gdcd";

export type ScoreLevelKey = "excellent" | "good" | "average" | "belowAverage";

export type ScoreLevel = {
  key: ScoreLevelKey;
  label: string;
  min: number | null;
  max: number | null;
};

export class Subject {
  constructor(
    public readonly key: SubjectKey,
    public readonly csvColumn: string,
    public readonly label: string
  ) {}

  getScore(row: Pick<ExamScore, SubjectKey>): number | null {
    return row[this.key] ?? null;
  }
}

export class SubjectCatalog {
  private readonly subjects: Subject[] = [
    new Subject("toan", "toan", "Math"),
    new Subject("nguVan", "ngu_van", "Literature"),
    new Subject("ngoaiNgu", "ngoai_ngu", "Foreign language"),
    new Subject("vatLi", "vat_li", "Physics"),
    new Subject("hoaHoc", "hoa_hoc", "Chemistry"),
    new Subject("sinhHoc", "sinh_hoc", "Biology"),
    new Subject("lichSu", "lich_su", "History"),
    new Subject("diaLi", "dia_li", "Geography"),
    new Subject("gdcd", "gdcd", "Civic education")
  ];

  readonly levels: ScoreLevel[] = [
    { key: "excellent", label: ">= 8", min: 8, max: null },
    { key: "good", label: "6 - < 8", min: 6, max: 8 },
    { key: "average", label: "4 - < 6", min: 4, max: 6 },
    { key: "belowAverage", label: "< 4", min: null, max: 4 }
  ];

  all(): Subject[] {
    return this.subjects;
  }

  groupA(): Subject[] {
    return this.subjects.filter((subject) =>
      ["toan", "vatLi", "hoaHoc"].includes(subject.key)
    );
  }

  parseScore(value: string | undefined): number | null {
    if (!value) return null;
    const score = Number(value);
    if (!Number.isFinite(score) || score < 0 || score > 10) return null;
    return score;
  }
}
