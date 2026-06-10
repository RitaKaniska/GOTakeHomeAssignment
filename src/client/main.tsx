import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Subject = { key: string; label: string };
type Level = { key: string; label: string };
type ScoreResponse = {
  score: Record<string, number | string | null>;
};
type Report = {
  key: string;
  label: string;
  levels: Record<string, number>;
};
type TopStudent = {
  sbd: string;
  toan: number;
  vatLi: number;
  hoaHoc: number;
  total: number;
};

const subjectOrder = [
  "toan",
  "nguVan",
  "ngoaiNgu",
  "vatLi",
  "hoaHoc",
  "sinhHoc",
  "lichSu",
  "diaLi",
  "gdcd"
];

const fallbackSubjects: Subject[] = [
  { key: "toan", label: "Math" },
  { key: "nguVan", label: "Literature" },
  { key: "ngoaiNgu", label: "Foreign language" },
  { key: "vatLi", label: "Physics" },
  { key: "hoaHoc", label: "Chemistry" },
  { key: "sinhHoc", label: "Biology" },
  { key: "lichSu", label: "History" },
  { key: "diaLi", label: "Geography" },
  { key: "gdcd", label: "Civic education" }
];

const fallbackLevels: Level[] = [
  { key: "excellent", label: ">= 8" },
  { key: "good", label: "6 - < 8" },
  { key: "average", label: "4 - < 6" },
  { key: "belowAverage", label: "< 4" }
];

const levelColors: Record<string, string> = {
  excellent: "#16865a",
  good: "#1d6fd8",
  average: "#d38913",
  belowAverage: "#c93f3f"
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }
  return data;
}

function App() {
  const [subjects, setSubjects] = useState<Subject[]>(fallbackSubjects);
  const [levels, setLevels] = useState<Level[]>(fallbackLevels);
  const [reports, setReports] = useState<Report[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [records, setRecords] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [score, setScore] = useState<Record<string, number | string | null> | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [subjectData, reportData, topData, healthData] = await Promise.all([
          fetchJson<{ subjects: Subject[]; levels: Level[] }>("/api/subjects"),
          fetchJson<{ reports: Report[] }>("/api/reports/subjects"),
          fetchJson<{ students: TopStudent[] }>("/api/top/group-a"),
          fetchJson<{ records: number }>("/api/health")
        ]);
        setSubjects(subjectData.subjects);
        setLevels(subjectData.levels);
        setReports(reportData.reports);
        setTopStudents(topData.students);
        setRecords(healthData.records);
      } catch (error) {
        setLookupMessage(error instanceof Error ? error.message : "Cannot load dashboard data.");
      } finally {
        setLoadingDashboard(false);
      }
    }

    loadDashboard();
  }, []);

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.key, subject.label])),
    [subjects]
  );

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScore(null);
    setLookupMessage("");

    const registrationNumber = query.trim();
    if (!/^\d{8}$/.test(registrationNumber)) {
      setLookupMessage("Registration number must contain exactly 8 digits.");
      return;
    }

    setLoadingLookup(true);
    try {
      const data = await fetchJson<ScoreResponse>(`/api/scores/${registrationNumber}`);
      setScore(data.score);
    } catch (error) {
      setLookupMessage(error instanceof Error ? error.message : "Lookup failed.");
    } finally {
      setLoadingLookup(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">National high school exam 2024</p>
          <h1>G-Scores</h1>
          <p className="hero-copy">
            Search student scores, inspect score distribution by subject, and review the
            strongest group-A results from the imported exam database.
          </p>
        </div>
        <div className="stat-panel">
          <span>Imported records</span>
          <strong>{records === null ? "..." : records.toLocaleString()}</strong>
        </div>
      </section>

      <section className="lookup-grid">
        <div className="panel lookup-panel">
          <div className="section-title">
            <p className="eyebrow">Search</p>
            <h2>Check score</h2>
          </div>
          <form onSubmit={handleLookup} className="lookup-form">
            <label htmlFor="registrationNumber">Registration number</label>
            <div className="search-row">
              <input
                id="registrationNumber"
                value={query}
                inputMode="numeric"
                maxLength={8}
                placeholder="01000001"
                onChange={(event) => setQuery(event.target.value.replace(/\D/g, ""))}
              />
              <button disabled={loadingLookup}>
                {loadingLookup ? "Searching" : "Search"}
              </button>
            </div>
          </form>
          {lookupMessage && <p className="message">{lookupMessage}</p>}
          {score && (
            <div className="score-list">
              {subjectOrder.map((key) => (
                <div className="score-item" key={key}>
                  <span>{subjectMap.get(key) ?? key}</span>
                  <strong>{score[key] ?? "-"}</strong>
                </div>
              ))}
              <div className="score-item">
                <span>Language code</span>
                <strong>{score.maNgoaiNgu ?? "-"}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="panel top-panel">
          <div className="section-title">
            <p className="eyebrow">Group A</p>
            <h2>Top 10 students</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>SBD</th>
                  <th>Math</th>
                  <th>Physics</th>
                  <th>Chemistry</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((student, index) => (
                  <tr key={student.sbd}>
                    <td>{index + 1}</td>
                    <td>{student.sbd}</td>
                    <td>{student.toan}</td>
                    <td>{student.vatLi}</td>
                    <td>{student.hoaHoc}</td>
                    <td>{student.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel report-panel">
        <div className="section-title report-heading">
          <div>
            <p className="eyebrow">Report</p>
            <h2>Score levels by subject</h2>
          </div>
          <div className="legend">
            {levels.map((level) => (
              <span key={level.key}>
                <i style={{ background: levelColors[level.key] }} />
                {level.label}
              </span>
            ))}
          </div>
        </div>

        {loadingDashboard ? (
          <p className="message">Loading report...</p>
        ) : (
          <div className="chart-list">
            {reports.map((report) => {
              const total = Object.values(report.levels).reduce((sum, value) => sum + value, 0);
              return (
                <div className="chart-row" key={report.key}>
                  <div className="chart-label">
                    <strong>{report.label}</strong>
                    <span>{total.toLocaleString()} scores</span>
                  </div>
                  <div className="bar" aria-label={`${report.label} score distribution`}>
                    {levels.map((level) => {
                      const value = report.levels[level.key] ?? 0;
                      const width = total === 0 ? 0 : (value / total) * 100;
                      return (
                        <span
                          key={level.key}
                          style={{
                            width: `${width}%`,
                            background: levelColors[level.key]
                          }}
                          title={`${level.label}: ${value.toLocaleString()}`}
                        />
                      );
                    })}
                  </div>
                  <div className="chart-values">
                    {levels.map((level) => (
                      <span key={level.key}>
                        {(report.levels[level.key] ?? 0).toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
