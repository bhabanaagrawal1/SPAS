
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  BrainCircuit,
  GraduationCap,
  ShieldAlert,
  Users,
  Sparkles,
  Lightbulb,
  CircleCheck,
  AlertTriangle,
  ChevronRight,
  Target,
  RefreshCw,
  Clock3,
  ScanSearch,
  BookOpen,
  CalendarCheck,
  Zap,
  TrendingUp,
  // Activity,
  BarChart3,
} from "lucide-react";

import { useInsights, type LatestInsight } from "../hooks/useInsights";

// ======================================================
// CONSTANTS
// ======================================================

const RISK_COLORS = {
  Low: "#10B981",
  Medium: "#F59E0B",
  High: "#EF4444",
};

const CATEGORY_ICON = {
  Mentoring: CalendarCheck,
  Practice: Target,
  Habits: Clock3,
  Remedial: BookOpen,
  "Skill building": Zap,
  "Peer learning": Users,
  Enrichment: Sparkles,
};

const GAP_LABEL: Record<string, string> = {
  ATTENDANCE_PERCENTAGE: "Attendance (%)",
  STUDY_HOURS_PER_DAY: "Study hours / day",
  ASSIGNMENT_SUBMISSION_RATE: "Assignment submission (%)",
};

// ======================================================
// TYPES
// ======================================================

interface Recommendation {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  why: string;
  score: number;
}

interface RiskData {
  level?: string;
  score?: number;
  probabilities?: Record<string, number>;
}

interface AnomalyData {
  isAnomaly?: boolean;
  score?: number;
  reasons?: string[];
}

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="min-h-[120px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
      {text}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="text-blue-300" size={24} />
        <h2 className="font-semibold text-slate-800 text-[16px]">
          {title}
        </h2>
      </div>

      {description && (
        <p className="text-[14px] text-slate-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

// ======================================================
// METRIC CARD
// ======================================================

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badge,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: "blue" | "amber" | "violet" | "green" | "red";
  badge: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-400",
    amber: "bg-amber-50 text-amber-500",
    violet: "bg-violet-50 text-violet-500",
    green: "bg-emerald-50 text-emerald-500",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>

        <span className="text-[12px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          {badge}
        </span>
      </div>

      <p className="text-[12px] text-slate-500 mt-4">
        {title}
      </p>

      <h3 className="text-2xl font-bold text-slate-800 mt-1 break-words">
        {value}
      </h3>

      <p className="text-[11px] text-slate-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
}

// ======================================================
// RISK ANALYSIS
// ======================================================

function RiskAnalysis({
  risk,
  why,
}: {
  risk: RiskData | null;
  why?: string;
}) {
  if (!risk) {
    return (
      <Panel>
        <SectionHeading
          icon={ShieldAlert}
          title="Risk Analysis"
          description="Academic risk classification"
        />
        <Empty text="Risk model has not produced a result yet." />
      </Panel>
    );
  }

  const probabilities = risk.probabilities ?? {};

  const chartData = (
    ["Low", "Medium", "High"] as const
  ).map((level) => ({
    name: `${level} Risk`,
    value: Math.round((probabilities[level] ?? 0) * 100),
    color: RISK_COLORS[level],
  }));

  const highRisk = Math.round(
    (probabilities.High ?? 0) * 100
  );

  return (
    <Panel>
      <SectionHeading
        icon={ShieldAlert}
        title="Risk Analysis"
        description="Classifier probability for each risk level"
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
        <div className="w-full sm:w-1/2 h-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={4}
                stroke="none"
              >
                {chartData.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}
              </Pie>

              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-800">
              {risk.score ?? "--"}
            </span>
            <span className="text-[12px] text-slate-500">
              Risk score
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          {chartData.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600">
                  {item.name}
                </span>

                <span className="font-semibold text-slate-800">
                  {item.value}%
                </span>
              </div>

              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mt-3 flex gap-3">
        <Lightbulb
          className="text-amber-500 shrink-0"
          size={30}
        />

        <div>
          <p className="text-[14px] font-semibold text-slate-800">
            Predicted level: {risk.level ?? "Unavailable"}
          </p>

          <p className="text-[13px] text-slate-600 mt-1">
            {highRisk}% estimated chance of High risk.
            {why ? ` Main area to improve: ${why}` : ""}
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ======================================================
// RECOMMENDATIONS
// ======================================================

function Recommendations({
  recs,
  peerGap,
}: {
  recs: Recommendation[];
  peerGap?: Record<string, number>;
}) {
  const priorityStyles = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-amber-50 text-amber-600",
    Low: "bg-emerald-50 text-emerald-600",
  };

  const gaps = Object.entries(peerGap ?? {}).filter(
    ([key, value]) =>
      key in GAP_LABEL && typeof value === "number"
  );

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="text-violet-600" size={21} />

        <div>
          <h2 className="font-semibold text-slate-800">
            AI Recommendations
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Personalized suggestions based on your academic data
          </p>
        </div>
      </div>

      {recs.length === 0 ? (
        <Empty text="Recommendations will appear after analysis." />
      ) : (
        <div className="space-y-3">
          {recs.map((recommendation, index) => {
            const Icon =
              CATEGORY_ICON[
                recommendation.category as keyof typeof CATEGORY_ICON
              ] ?? Lightbulb;

            return (
              <div
                key={recommendation.id || index}
                className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                  <Icon size={21} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="text-[14px] font-semibold text-slate-800">
                      {recommendation.title}
                    </h3>

                    <span
                      className={`text-[12px] px-3 py-1 rounded-full h-fit ${
                        priorityStyles[recommendation.priority]
                      }`}
                    >
                      {recommendation.priority} Priority
                    </span>
                  </div>

                  <p className="text-[12px] text-slate-500 leading-relaxed mt-1/2">
                    Why: {recommendation.why}
                  </p>

                  <span className="text-[12px] text-slate-400">
                    {recommendation.category} · match{" "}
                    {Math.round(recommendation.score * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {gaps.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[14px] font-semibold text-slate-800 mb-3">
            Gap vs similar peers
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {gaps.map(([key, value]) => (
              <div
                key={key}
                className="bg-slate-50 rounded-lg p-3 text-center"
              >
                <p className="text-[13px] text-slate-500">
                  {GAP_LABEL[key]}
                </p>

                <p
                  className={`text-[16px] font-bold mt-1 ${
                    value > 0
                      ? "text-amber-600"
                      : value < 0
                        ? "text-red-600"
                        : "text-emerald-600"
                  }`}
                >
                  {value > 0 ? "+" : ""}
                  {value.toFixed(1)}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-slate-400 mt-2">
            Values are differences from the peer comparison baseline.
            Interpret positive and negative values according to the metric.
          </p>
        </div>
      )}
    </Panel>
  );
}

// ======================================================
// STUDENT SEGMENTATION
// ======================================================

function ClusterAnalysis({
  clusterName,
  clusterId,
  groups,
}: {
  clusterName?: string;
  clusterId?: number;
  groups?: Array<{
    name: string;
    students: number;
    meanCgpa: number;
  }>;
}) {
  return (
    <Panel>
      <SectionHeading
        icon={Users}
        title="Student Segmentation"
        description="Your peer group identified through clustering"
      />

      {clusterName ? (
        <>
          <div className="mt-5 bg-blue-50 rounded-xl p-5">
            <p className="text-[15px] text-blue-500">
              Your assigned peer group
            </p>

            <h3 className="text-xl font-bold text-blue-400 mt-1">
              {clusterName}
            </h3>

            {clusterId != null && (
              <p className="text-[11px] text-blue-600 mt-2">
                Cluster ID: {clusterId}
              </p>
            )}
          </div>

          {groups && groups.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-700">
                Cluster overview
              </p>

              {groups.map((group) => (
                <div
                  key={group.name}
                  className="flex justify-between gap-3 text-xs border-b border-slate-100 pb-2"
                >
                  <div>
                    <p className="font-medium text-slate-700">
                      {group.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {group.students.toLocaleString()} students
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      {group.meanCgpa.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mean CGPA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Empty text="Clustering information is not available yet." />
      )}
    </Panel>
  );
}

// ======================================================
// ANOMALY DETECTION
// ======================================================

function AnomalyPanel({
  anomaly,
  inputs,
}: {
  anomaly: AnomalyData | null;
  inputs?: Record<string, unknown>;
}) {
  const flagged = anomaly?.isAnomaly === true;

  const attendance = inputs?.attendancePercentage;
  const backlogs = inputs?.previousSemesterBacklogs;
  const studyHours = inputs?.studyHoursPerDay;

  return (
    <Panel className="flex flex-col">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <ScanSearch
            className={
              flagged ? "text-red-500" : "text-emerald-600"
            }
            size={24}
          />

          <h2 className="font-semibold text-slate-800 text-[18px]">
            Anomaly Detection
          </h2>
        </div>

        {anomaly && (
          <span
            className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
              flagged
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {flagged ? "Flagged" : "Normal"}
          </span>
        )}
      </div>

      <p className="text-[14px] text-slate-500 mt-1">
        Identification of unusual academic patterns
      </p>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
        {!anomaly ? (
          <Empty text="Anomaly model has not produced a result yet." />
        ) : flagged ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle
                size={30}
                className="text-red-500"
              />
            </div>

            <h3 className="font-semibold text-slate-800 text-sm">
              Record needs review
            </h3>

            <ul className="text-xs text-slate-600 mt-2 space-y-1">
              {anomaly.reasons?.length ? (
                anomaly.reasons.map((reason, index) => (
                  <li key={`${reason}-${index}`}>
                    • {reason}
                  </li>
                ))
              ) : (
                <li>
                  Statistically unusual combination of values
                </li>
              )}
            </ul>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CircleCheck
                size={30}
                className="text-emerald-500"
              />
            </div>

            <h3 className="font-semibold text-slate-800">
              No anomalies detected
            </h3>

            <p className="text-[13px] text-slate-500 mt-2">
              No unusual pattern was flagged in this record.
            </p>
          </>
        )}
      </div>

      {anomaly?.score != null && (
        <p className="text-[12px] text-slate-400 text-center mb-3">
          Anomaly score: {anomaly.score.toFixed(4)}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <div className="text-center">
          <p className="text-[12px] text-slate-500">
            Attendance
          </p>
          <p className="text-[14px] font-semibold text-slate-700 mt-1">
            {attendance != null
              ? `${Number(attendance).toFixed(0)}%`
              : "--"}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[12px] text-slate-500">
            Backlogs
          </p>
          <p className="text-[14px] font-semibold text-slate-700 mt-1">
            {backlogs != null ? String(backlogs) : "--"}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[12px] text-slate-500">
            Study hrs/day
          </p>
          <p className="text-[14px] font-semibold text-slate-700 mt-1">
            {studyHours != null
              ? Number(studyHours).toFixed(1)
              : "--"}
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ======================================================
// MODEL METRICS
// ======================================================

function ModelMetrics({
  metrics,
}: {
  metrics?: Array<{
    label: string;
    value: string;
  }>;
}) {
  if (!metrics?.length) return null;

  return (
    <Panel>
      <SectionHeading
        icon={BarChart3}
        title="Model Performance"
        description="Evaluation metrics reported by the analytics service"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mt-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-slate-50 rounded-lg p-3 text-center"
          >
            <p className="text-[10px] text-slate-500">
              {metric.label}
            </p>

            <p className="text-xl font-bold text-slate-800 mt-1">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ======================================================
// ACADEMIC PERFORMANCE CHART
// ======================================================

function PerformanceChart({
  chart,
}: {
  chart?: Array<{
    semester: string;
    actual: number | null;
    predicted: number | null;
  }>;
}) {
  const hasData = chart?.some(
    (item) =>
      item.actual != null || item.predicted != null
  );

  return (
    <Panel>
      <SectionHeading
        icon={TrendingUp}
        title="Academic Performance Forecast"
        description="Actual and predicted CGPA across semesters"
      />

      {!hasData ? (
        <Empty text="Performance history will appear when academic records are available." />
      ) : (
        <div className="mt-5">
          <div className="flex flex-wrap gap-4 mb-3 text-[11px]">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              Actual CGPA
            </span>

            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-violet-500" />
              Predicted CGPA
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chart}
                margin={{
                  top: 10,
                  right: 15,
                  left: -15,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                />

                <XAxis
                  dataKey="semester"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual CGPA"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted CGPA"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  connectNulls
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[13px] text-slate-400 mt-2">
            Predicted values are estimates and are not confirmed academic results.
          </p>
        </div>
      )}
    </Panel>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function MLInsights() {
  const {
    data,
    loading,
    running,
    error,
    runAnalysis,
  } = useInsights();

  // ----------------------------------------------------
  // READ THE ACTUAL API RESPONSE
  // ----------------------------------------------------

  const latest: LatestInsight | null =
    data?.latest ?? null;

  const risk = latest?.risk ?? null;

  const anomaly = latest?.anomaly ?? null;

  const recommendations: Recommendation[] =
    latest?.recommendations ?? [];

  const moduleErrors = Object.entries(
    latest?.moduleErrors ?? {}
  );

  const hasInsights = latest != null;

  const riskColor =
    risk?.level === "Low"
      ? "green"
      : risk?.level === "High"
        ? "red"
        : "amber";

  // ----------------------------------------------------
  // RUN ANALYSIS
  // ----------------------------------------------------

  const handleRunAnalysis = async () => {
    try {
      await runAnalysis();
    } catch {
      // Error is already stored by the hook.
    }
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 space-y-5">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl text-blue-300 font-bold">
            ML Insights
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Understand your academic performance with machine learning.
          </p>

          {data?.student && (
            <p className="text-xs text-slate-500 mt-2">
              {data.student.name}
              {data.student.section
                ? ` · ${data.student.section}`
                : ""}
            </p>
          )}
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={running || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-400 text-white text-medium font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw
            size={15}
            className={running ? "animate-spin" : ""}
          />

          {running ? "Running models..." : "Run analysis"}
        </button>
      </div>

      {/* LOADING */}

      {loading && (
        <Panel>
          <div className="flex items-center justify-center gap-3 py-5 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading your ML insights...
          </div>
        </Panel>
      )}

      {/* ERROR */}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs p-3">
          {error}
        </div>
      )}

      {/* MODULE ERRORS */}

      {moduleErrors.length > 0 && (
        <div className="rounded-lg bg-amber-50 text-amber-800 text-xs p-3 space-y-1">
          <p className="font-semibold">
            Some analytics modules reported errors:
          </p>

          {moduleErrors.map(([key, value]) => (
            <div key={key}>
              <b>{key}</b>: {String(value)}
            </div>
          ))}
        </div>
      )}

      {/* HERO */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E7EDFF] via-[#DCE7FF] to-[#C7D6FF] border border-blue-100">
        <div className="relative z-10 p-6 md:p-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/70 text-blue-300 px-3 py-1.5 rounded-full text-[12px] font-semibold">
            <Sparkles size={14} />
            AI POWERED ANALYTICS
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-[#142B59] mt-4">
            Your Academic Intelligence
          </h2>

          <p className="text-sm text-blue-900/70 mt-2 max-w-lg">
            Discover your strengths, identify academic risks and get
            personalized recommendations powered by machine learning.
          </p>

          <div className="flex items-center gap-2 mt-5 text-[14px] text-blue-400">
            <BrainCircuit size={16} />
            <span>
              Powered by machine learning modules
            </span>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:flex items-center justify-center opacity-20">
          <BrainCircuit
            size={190}
            className="text-blue-700"
          />
        </div>
      </div>

      {/* NO INSIGHTS */}

      {!loading && !hasInsights && (
        <div className="rounded-lg bg-blue-50 text-blue-400 text-xs p-4">
          {!data?.hasAcademicRecord
            ? "No academic record is available for your account yet. Please contact your faculty or administrator."
            : "No analysis result is available yet. Click Run analysis to generate your ML insights."}
        </div>
      )}

      {/* METRIC CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Predicted CGPA"
          icon={GraduationCap}
          color="blue"
          badge="Regression"
          value={
            latest?.predictedCgpa != null
              ? `${latest.predictedCgpa.toFixed(2)} / 10`
              : "-- / 10"
          }
          subtitle={
            latest?.predictedCgpa != null
              ? `± ${latest.errorMargin?.toFixed(2) ?? "–"} typical error · Sem ${latest.semester ?? "--"}`
              : "Awaiting model inference"
          }
        />

        <MetricCard
          title="Academic Risk"
          icon={ShieldAlert}
          color={riskColor}
          badge="Classification"
          value={risk?.level ?? "--"}
          subtitle={
            risk
              ? `${Math.round(
                  (risk.probabilities?.High ?? 0) * 100
                )}% chance of High risk`
              : "Awaiting classification"
          }
        />

        <MetricCard
          title="Student Segment"
          icon={Users}
          color="violet"
          badge="Clustering"
          value={latest?.cluster?.name ?? "--"}
          subtitle={
            latest?.cluster?.name
              ? "Peer group from clustering"
              : "Awaiting cluster assignment"
          }
        />

        <MetricCard
          title="Anomaly Status"
          icon={ScanSearch}
          color={
            anomaly?.isAnomaly === true
              ? "red"
              : anomaly?.isAnomaly === false
                ? "green"
                : "amber"
          }
          badge="Detection"
          value={
            anomaly?.isAnomaly == null
              ? "--"
              : anomaly.isAnomaly
                ? "Flagged"
                : "Normal"
          }
          subtitle={
            anomaly?.isAnomaly == null
              ? "Awaiting anomaly analysis"
              : anomaly.isAnomaly
                ? "Record needs review"
                : "No unusual pattern"
          }
        />
      </div>

      {/* PERFORMANCE CHART AND RISK */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PerformanceChart chart={data?.chart} />

        <RiskAnalysis
          risk={risk}
          why={recommendations[0]?.why}
        />
      </div>

      {/* RECOMMENDATIONS */}

      <Recommendations
        recs={recommendations}
        peerGap={latest?.peerGap}
      />

      {/* CLUSTER AND ANOMALY */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClusterAnalysis
          clusterName={latest?.cluster?.name}
          clusterId={latest?.cluster?.id}
          groups={data?.clusterMap?.groups}
        />

        <AnomalyPanel
          anomaly={anomaly}
          inputs={latest?.inputs}
        />
      </div>

      {/* MODEL METRICS */}

      <ModelMetrics metrics={data?.metrics} />

      {/* FOOTER */}

      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-400 pb-2">
        <span>
          Student 360° · Machine Learning Intelligence
        </span>

        <span>
          Model version: {latest?.modelVersion ?? "—"}
        </span>

        <span>
          Last updated:{" "}
          {latest?.createdAt
            ? new Date(latest.createdAt).toLocaleString()
            : "—"}
        </span>
      </div>
    </div>
  );
}