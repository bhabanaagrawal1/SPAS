import {
  BookOpen,
  Search,
  Bell,
  ChartNoAxesCombined,
  Trophy,
  Target,
  Sparkles,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Brain,
  BookMarked,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface SubjectPerformance {
  code: string;
  name: string;
  marks: number;
  classAverage: number;
  maxMarks: 30;
}

type PerformanceStatus = "Excellent" | "Good" | "Needs Attention";

interface Recommendation {
  title: string;
  description: string;
  action: string;
  icon: typeof Lightbulb;
  tone: "blue" | "green" | "orange" | "purple";
}

// -----------------------------------------------------------------------------
// SUBJECTS
// Replace marks and classAverage with values returned by your backend.
// All marks in this page are sample values out of 30.
// -----------------------------------------------------------------------------

const subjectData: SubjectPerformance[] = [
  {
    code: "OS",
    name: "Operating Systems",
    marks: 22,
    classAverage: 22,
    maxMarks: 30,
  },
  {
    code: "TOC",
    name: "Theory of Computation",
    marks: 25,
    classAverage: 20,
    maxMarks: 30,
  },
  {
    code: "CN",
    name: "Computer Networks",
    marks: 20,
    classAverage: 21,
    maxMarks: 30,
  },
  {
    code: "DBMS",
    name: "Database Management Systems",
    marks: 25,
    classAverage: 18,
    maxMarks: 30,
  },
  {
    code: "COA",
    name: "Computer Organization and Architecture",
    marks: 27,
    classAverage: 18,
    maxMarks: 30,
  },
  {
    code: "DAA",
    name: "Design and Analysis of Algorithms",
    marks: 27,
    classAverage: 20,
    maxMarks: 30,
  },
  {
    code: "ML",
    name: "Machine Learning",
    marks: 27,
    classAverage: 23,
    maxMarks: 30,
  },
  {
    code: "AI",
    name: "Artificial Intelligence",
    marks: 26,
    classAverage: 19,
    maxMarks: 30,
  },
];

// -----------------------------------------------------------------------------
// HELPERS
// These thresholds are illustrative. Adjust them to match your institution's
// grading rules.
// -----------------------------------------------------------------------------

function getPercentage(marks: number, maxMarks: number) {
  return Math.round((marks / maxMarks) * 100);
}

function getStatus(marks: number, maxMarks: number): PerformanceStatus {
  const percentage = getPercentage(marks, maxMarks);

  if (percentage >= 80) return "Excellent";
  if (percentage >= 60) return "Good";
  return "Needs Attention";
}

function getStatusStyles(status: PerformanceStatus) {
  if (status === "Excellent") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "Good") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  return "bg-orange-50 text-orange-700 ring-orange-200";
}

function buildRecommendations(
  subjects: SubjectPerformance[],
): Recommendation[] {
  const weakest = [...subjects].sort(
    (a, b) => a.marks / a.maxMarks - b.marks / b.maxMarks,
  )[0];

  const strongest = [...subjects].sort(
    (a, b) => b.marks / b.maxMarks - a.marks / a.maxMarks,
  )[0];

  const belowAverage = subjects.filter(
    (subject) => subject.marks < subject.classAverage,
  );

  const recommendations: Recommendation[] = [
    {
      title: `Focus on ${weakest.code}: ${weakest.name}`,
      description: `You scored ${weakest.marks}/${weakest.maxMarks}. Review the topics where you lost marks and solve practice questions before the next assessment.`,
      action: "Create study plan",
      icon: Target,
      tone: "orange",
    },
    {
      title: `Continue your progress in ${strongest.code}`,
      description: `${strongest.name} is currently your strongest subject. Strengthen your understanding with application-based and advanced questions.`,
      action: "Explore topics",
      icon: Trophy,
      tone: "green",
    },
  ];

  if (belowAverage.length > 0) {
    recommendations.push({
      title: "Review subjects below the class average",
      description: `${belowAverage.map((subject) => subject.code).join(", ")} ${
        belowAverage.length === 1 ? "is" : "are"
      } currently below the class average. Prioritize the concepts that need improvement.`,
      action: "Review performance",
      icon: BookMarked,
      tone: "blue",
    });
  }

  return recommendations;
}

// -----------------------------------------------------------------------------
// REUSABLE COMPONENTS
// Keep reusable components outside the page component.
// -----------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof TrendingUp;
  tone: "blue" | "green" | "orange" | "purple";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: StatCardProps) {
  const toneStyles = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    orange: "bg-orange-50 text-orange-600 ring-orange-100",
    purple: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ring-1 ${toneStyles[tone]}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon: typeof BookOpen;
}

function SectionHeading({
  title,
  subtitle,
  icon: Icon,
}: SectionHeadingProps) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const Icon = recommendation.icon;

  const tones = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
      <div
        className={`h-fit rounded-xl border p-3 ${tones[recommendation.tone]}`}
      >
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-800">
          {recommendation.title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {recommendation.description}
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-400"
        >
          {recommendation.action}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------------------------------

export default function SubjectPerformance() {
  const totalMarks = subjectData.reduce(
    (total, subject) => total + subject.marks,
    0,
  );

  const totalMaximumMarks = subjectData.reduce(
    (total, subject) => total + subject.maxMarks,
    0,
  );

  const averagePercentage = Math.round(
    (totalMarks / totalMaximumMarks) * 100,
  );

  const strongestSubject = [...subjectData].sort(
    (a, b) => b.marks / b.maxMarks - a.marks / a.maxMarks,
  )[0];

  const needsAttention = subjectData.filter(
    (subject) => getStatus(subject.marks, subject.maxMarks) === "Needs Attention",
  ).length;

  const aboveClassAverage = subjectData.filter(
    (subject) => subject.marks >= subject.classAverage,
  ).length;

  const recommendations = buildRecommendations(subjectData);

  const chartData = subjectData.map((subject) => ({
    subject: subject.code,
    "Your Marks": subject.marks,
    "Class Average": subject.classAverage,
  }));

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* TOP BAR */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search subjects, topics, or recommendations..."
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">STU001</p>
                <p className="text-xs text-slate-500">Student</p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE TITLE */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
              <BookOpen size={27} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Subject-wise Performance
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Analyze your mid-semester results and improve subject by subject.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-400"
          >
            Academic Year 2026–27 · Semester 5
            <ChevronDown size={16} />
          </button>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Overall Mid-sem Average"
            value={`${averagePercentage}%`}
            subtitle={`${totalMarks} out of ${totalMaximumMarks} marks`}
            icon={ChartNoAxesCombined}
            tone="blue"
          />

          <StatCard
            title="Strongest Subject"
            value={strongestSubject.code}
            subtitle={`${strongestSubject.marks}/${strongestSubject.maxMarks} · ${strongestSubject.name}`}
            icon={Trophy}
            tone="green"
          />

          <StatCard
            title="Needs Attention"
            value={`${needsAttention} Subjects`}
            subtitle="Below 60% of the maximum marks"
            icon={Target}
            tone="orange"
          />

          <StatCard
            title="At / Above Class Average"
            value={`${aboveClassAverage}/${subjectData.length}`}
            subtitle="Subjects meeting the class benchmark"
            icon={TrendingUp}
            tone="purple"
          />
        </section>

        {/* CHART + PERFORMANCE SUMMARY */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
            <SectionHeading
              title="Subject-wise Marks Comparison"
              subtitle="Your mid-semester marks compared with the class average · Out of 30"
              icon={ChartNoAxesCombined}
            />

            <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Your Marks
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-200" />
                Class Average
              </span>
            </div>

            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: -18, bottom: 4 }}
                  barGap={5}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="subject"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 30]}
                    ticks={[0, 5, 10, 15, 20, 25, 30]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#eff6ff" }}
                    contentStyle={{
                      border: "1px solid #dbeafe",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value}/30`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Your Marks"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={25}
                  />
                  <Bar
                    dataKey="Class Average"
                    fill="#bfdbfe"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
            <SectionHeading
              title="Performance Overview"
              subtitle="Subject classification based on marks out of 30"
              icon={Target}
            />

            <div className="space-y-5">
              {(
                [
                  {
                    status: "Excellent" as const,
                    description: "80% and above",
                    color: "bg-emerald-500",
                  },
                  {
                    status: "Good" as const,
                    description: "60% to 79%",
                    color: "bg-blue-500",
                  },
                  {
                    status: "Needs Attention" as const,
                    description: "Below 60%",
                    color: "bg-orange-500",
                  },
                ]
              ).map((item) => {
                const count = subjectData.filter(
                  (subject) =>
                    getStatus(subject.marks, subject.maxMarks) === item.status,
                ).length;

                const percentage = (count / subjectData.length) * 100;

                return (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.status}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-slate-800">
                        {count}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Lightbulb size={18} />
                <p className="text-sm font-semibold">Quick insight</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                You are at or above the class average in {aboveClassAverage} of
                your {subjectData.length} subjects. Focus on the subjects where
                your marks are below the benchmark.
              </p>
            </div>
          </div>
        </section>

        {/* SUBJECT TABLE + STRENGTHS */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
            <div className="p-5 pb-2">
              <SectionHeading
                title="Subject Details"
                subtitle="Detailed mid-semester marks, class averages, and performance status"
                icon={BookOpen}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Your Marks
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Class Avg.
                    </th>
                    <th className="px-4 py-3 font-semibold">Performance</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {subjectData.map((subject) => {
                    const percentage = getPercentage(
                      subject.marks,
                      subject.maxMarks,
                    );
                    const status = getStatus(
                      subject.marks,
                      subject.maxMarks,
                    );
                    const difference =
                      subject.marks - subject.classAverage;

                    return (
                      <tr
                        key={subject.code}
                        className="transition hover:bg-blue-50/40"
                      >
                        <td className="max-w-[240px] px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {subject.name}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {subject.code}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="font-semibold text-slate-800">
                            {subject.marks}
                          </span>
                          <span className="text-slate-400">
                            /{subject.maxMarks}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center text-slate-600">
                          {subject.classAverage}/{subject.maxMarks}
                        </td>

                        <td className="min-w-[150px] px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  status === "Needs Attention"
                                    ? "bg-orange-500"
                                    : status === "Good"
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-9 text-right text-xs font-medium text-slate-600">
                              {percentage}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusStyles(status)}`}
                            >
                              {status}
                            </span>
                            <span
                              className={`text-[11px] ${
                                difference >= 0
                                  ? "text-emerald-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {difference >= 0 ? "+" : ""}
                              {difference} vs class
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeading
                title="Strengths & Weaknesses"
                subtitle="Based on your current mid-semester marks"
                icon={Brain}
              />

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={18} />
                  <p className="text-sm font-semibold">Your strengths</p>
                </div>

                <div className="space-y-2">
                  {[...subjectData]
                    .sort((a, b) => b.marks - a.marks)
                    .slice(0, 3)
                    .map((subject) => (
                      <div
                        key={subject.code}
                        className="flex items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <span>{subject.name}</span>
                        <span className="font-semibold">
                          {subject.marks}/30
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-orange-700">
                  <AlertTriangle size={18} />
                  <p className="text-sm font-semibold">Areas to improve</p>
                </div>

                <div className="space-y-2">
                  {[...subjectData]
                    .sort((a, b) => a.marks - b.marks)
                    .slice(0, 3)
                    .map((subject) => (
                      <div
                        key={subject.code}
                        className="flex items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <span>{subject.name}</span>
                        <span className="font-semibold">
                          {subject.marks}/30
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeading
                title="Class Benchmark"
                subtitle="How your marks compare with the class"
                icon={TrendingUp}
              />

              <div className="space-y-3">
                {subjectData.map((subject) => {
                  const difference =
                    subject.marks - subject.classAverage;

                  return (
                    <div
                      key={subject.code}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-medium text-slate-600">
                        {subject.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          difference >= 0
                            ? "text-emerald-600"
                            : "text-orange-600"
                        }`}
                      >
                        {difference >= 0 ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                        {difference > 0 ? "+" : ""}
                        {difference}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* AI RECOMMENDATIONS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title="Personalized Recommendations"
              subtitle="Suggestions generated from your subject-wise performance"
              icon={Sparkles}
            />

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Mid-semester analysis
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.title}
                recommendation={recommendation}
              />
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-4 text-xs text-slate-400">
          <p>Student 360° · Track · Analyze · Grow</p>
          <p>Mid-semester assessment · Marks out of 30</p>
        </footer>
      </div>
    </main>
  );
}
