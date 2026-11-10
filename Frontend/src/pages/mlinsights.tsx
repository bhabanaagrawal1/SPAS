
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
} from "recharts";

import {
  BrainCircuit,
  GraduationCap,
  ShieldAlert,
  Users,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Lightbulb,
  Activity,
  CircleCheck,
  AlertTriangle,
  ChevronRight,
  Target,
  RefreshCw,
  ChartNoAxesCombined,
  Clock3,
  Layers3,
  ScanSearch,
  BarChart3,
  CheckCircle2,
  Plus,
  Info,
  Zap,
} from "lucide-react";

// =====================================================
// DEMO DATA
// Replace with actual API responses when integrating ML.
// =====================================================

const cgpaData = [
  { semester: "Sem 1", actual: 6.4, predicted: 6.5 },
  { semester: "Sem 2", actual: 6.8, predicted: 6.9 },
  { semester: "Sem 3", actual: 7.1, predicted: 7.0 },
  { semester: "Sem 4", actual: 7.3, predicted: 7.4 },
  { semester: "Sem 5", actual: 7.5, predicted: 7.7 },
  { semester: "Sem 6", actual: null, predicted: 7.9 },
];

const riskData = [
  { name: "Low Risk", value: 65, color: "#10B981" },
  { name: "Medium Risk", value: 25, color: "#F59E0B" },
  { name: "High Risk", value: 10, color: "#EF4444" },
];

const clusterData = [
  { attendance: 95, marks: 88, group: "High Performers" },
  { attendance: 90, marks: 82, group: "High Performers" },
  { attendance: 85, marks: 78, group: "High Performers" },
  { attendance: 80, marks: 72, group: "Consistent Learners" },
  { attendance: 75, marks: 65, group: "Consistent Learners" },
  { attendance: 68, marks: 58, group: "Consistent Learners" },
  { attendance: 55, marks: 45, group: "Needs Improvement" },
  { attendance: 48, marks: 38, group: "Needs Improvement" },
  { attendance: 42, marks: 30, group: "At Risk" },
];

const recommendations = [
  {
    title: "Improve Database Management",
    description:
      "Strengthen SQL, normalization and query optimization concepts.",
    category: "Academic",
    priority: "High",
    icon: BookOpen,
    color: "blue",
    action: "Create task",
  },
  {
    title: "Maintain Attendance",
    description:
      "Aim for consistent attendance to reduce your academic risk.",
    category: "Attendance",
    priority: "Medium",
    icon: CalendarCheck,
    color: "amber",
    action: "Add to planner",
  },
  {
    title: "Practice Problem Solving",
    description:
      "Solve more DSA problems to strengthen your technical skills.",
    category: "Technical",
    priority: "Medium",
    icon: Target,
    color: "violet",
    action: "Set goal",
  },
];

const modelMetrics = [
  { label: "RMSE", value: "0.42", icon: TrendingUp, color: "blue" },
  { label: "Macro-F1", value: "0.87", icon: Target, color: "violet" },
  { label: "Silhouette", value: "0.71", icon: Users, color: "green" },
  { label: "R² Score", value: "0.89", icon: BarChart3, color: "amber" },
  { label: "High-risk Recall", value: "0.91", icon: ShieldAlert, color: "pink" },
  { label: "Anomaly F1", value: "0.94", icon: ScanSearch, color: "cyan" },
];

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          {action}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badge,
  trend,
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>

        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          {badge}
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-4">{title}</p>

      <h3 className="text-2xl font-bold text-slate-800 mt-1">
        {value}
      </h3>

      <div className="flex items-center gap-1 mt-2">
        {trend && (
          <TrendingUp size={13} className="text-emerald-500" />
        )}
        <span className="text-[11px] text-slate-500">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatusBadge({ children, type = "success" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${styles[type]}`}>
      {children}
    </span>
  );
}

// =====================================================
// CGPA PERFORMANCE CHART
// =====================================================

function CGPAChart() {
  const [view, setView] = useState("CGPA");

  const tabs = ["CGPA", "Marks", "Attendance"];

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined className="text-blue-600" size={21} />
            <h2 className="font-semibold text-slate-800">
              Academic Performance Forecast
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your predicted academic trajectory
          </p>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`text-[11px] px-3 py-1.5 rounded-md transition ${
                view === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-5 mt-5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          Actual {view}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          Predicted {view}
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cgpaData}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E9EEF5"
            />

            <XAxis
              dataKey="semester"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              dy={10}
            />

            <YAxis
              domain={[0, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                fontSize: 12,
              }}
            />

            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              connectNulls={false}
              name="Actual"
            />

            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              fill="url(#predictedGradient)"
              name="Predicted"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

// =====================================================
// RISK DISTRIBUTION
// =====================================================

function RiskAnalysis() {
  return (
    <Panel>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-500" size={21} />
          <h2 className="font-semibold text-slate-800">
            Risk Analysis
          </h2>
        </div>
        <Info size={16} className="text-slate-400" />
      </div>

      <p className="text-xs text-slate-500 mt-1">
        Classification probability distribution
      </p>

      <div className="flex items-center gap-3 mt-4">
        <div className="w-1/2 h-[160px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={4}
                stroke="none"
              >
                {riskData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-800">--</span>
            <span className="text-[10px] text-slate-500">Risk score</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {riskData.map((risk) => (
            <div key={risk.name}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600">{risk.name}</span>
                <span className="font-semibold text-slate-800">
                  {risk.value}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${risk.value}%`,
                    backgroundColor: risk.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-50 rounded-lg p-3 mt-3 flex gap-3">
        <Lightbulb className="text-emerald-600 shrink-0" size={20} />
        <div>
          <p className="text-xs font-semibold text-emerald-800">
            Risk insight
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Your personalized risk explanation will appear here.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// =====================================================
// AI RECOMMENDATIONS
// =====================================================

function Recommendations() {
  const priorityStyles = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-amber-50 text-amber-600",
    Low: "bg-emerald-50 text-emerald-600",
  };

  const iconStyles = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <Panel>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-600" size={21} />
          <h2 className="font-semibold text-slate-800">
            AI Recommendations
          </h2>
        </div>
        <button className="text-xs text-blue-600 font-medium flex items-center gap-1">
          View all <ArrowRight size={13} />
        </button>
      </div>

      <div className="space-y-3">
        {recommendations.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconStyles[item.color]}`}>
                <Icon size={21} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-800">
                    {item.title}
                  </h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full h-fit ${priorityStyles[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  {item.description}
                </p>

                <button className="text-[11px] text-blue-600 font-medium mt-2 flex items-center gap-1 hover:gap-2 transition-all">
                  {item.action}
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// =====================================================
// STUDENT CLUSTERING
// =====================================================

function ClusterAnalysis() {
  const groups = [
    { name: "High Performers", color: "#3B82F6" },
    { name: "Consistent Learners", color: "#8B5CF6" },
    { name: "Needs Improvement", color: "#F59E0B" },
    { name: "At Risk", color: "#10B981" },
  ];

  return (
    <Panel>
      <SectionHeading
        title="Student Segmentation"
        subtitle="Understand your peer group through clustering"
      />

      <div className="h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, bottom: 10, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
            <XAxis
              type="number"
              dataKey="attendance"
              name="Attendance"
              domain={[30, 100]}
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Attendance %",
                position: "insideBottom",
                offset: -5,
                fontSize: 10,
                fill: "#64748B",
              }}
            />
            <YAxis
              type="number"
              dataKey="marks"
              name="Marks"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
            />
            <ZAxis range={[70, 70]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />

            {groups.map((group) => (
              <Scatter
                key={group.name}
                name={group.name}
                data={clusterData.filter(
                  (item) => item.group === group.name
                )}
                fill={group.color}
              />
            ))}

            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

// =====================================================
// ANOMALY DETECTION
// =====================================================

function AnomalyPanel() {
  return (
    <Panel className="flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ScanSearch className="text-emerald-600" size={21} />
          <h2 className="font-semibold text-slate-800">
            Anomaly Detection
          </h2>
        </div>
        <StatusBadge>Monitoring</StatusBadge>
      </div>

      <p className="text-xs text-slate-500 mt-1">
        Unusual academic patterns
      </p>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <ShieldAlert size={38} className="text-emerald-500" />
        </div>

        <h3 className="font-semibold text-slate-800 text-sm">
          Analysis pending
        </h3>

        <p className="text-xs text-slate-500 mt-2 max-w-[220px]">
          Detected anomalies and explanations will appear here after inference.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        {["Attendance", "Marks", "Backlogs"].map((item) => (
          <div key={item} className="text-center">
            <p className="text-[10px] text-slate-500">{item}</p>
            <p className="text-xs font-semibold text-slate-700 mt-1">--</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// =====================================================
// MODEL PERFORMANCE
// =====================================================

function ModelPerformance() {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    pink: "bg-pink-50 text-pink-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <Panel>
      <SectionHeading
        title="Model Performance"
        subtitle="Evaluation metrics from your trained ML models"
        action="View details"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {modelMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="bg-slate-50/80 rounded-xl p-3 text-center border border-slate-100"
            >
              <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center ${colorStyles[metric.color]}`}>
                <Icon size={20} />
              </div>

              <p className="text-[11px] text-slate-500 mt-3">
                {metric.label}
              </p>

              <p className="text-xl font-bold text-slate-800 mt-1">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function MLInsights() {
  const [lastUpdated] = useState("Just now");

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 space-y-5">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span>Academic</span>
            <ChevronRight size={13} />
            <span className="text-blue-600 font-medium">ML Insights</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            ML Insights
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Understand your academic performance with machine learning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge>
            <span className="inline-flex items-center gap-1">
              <CircleCheck size={12} />
              5 ML Modules
            </span>
          </StatusBadge>

          <button
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            title="Refresh insights"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* HERO BANNER */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E7EDFF] via-[#DCE7FF] to-[#C7D6FF] border border-blue-100">
        <div className="relative z-10 p-6 md:p-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/70 text-blue-700 px-3 py-1.5 rounded-full text-[11px] font-semibold">
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

          <div className="flex items-center gap-2 mt-5 text-xs text-blue-800">
            <BrainCircuit size={16} />
            <span>Powered by 5 machine learning modules</span>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:flex items-center justify-center opacity-20">
          <BrainCircuit size={190} className="text-blue-700" />
        </div>
      </div>

      {/* OVERVIEW CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Predicted CGPA"
          value="-- / 10"
          subtitle="Awaiting model inference"
          icon={GraduationCap}
          color="blue"
          badge="Regression"
        />

        <MetricCard
          title="Academic Risk"
          value="--"
          subtitle="Awaiting classification"
          icon={ShieldAlert}
          color="amber"
          badge="Classifier"
        />

        <MetricCard
          title="Student Segment"
          value="--"
          subtitle="Awaiting cluster assignment"
          icon={Users}
          color="violet"
          badge="Clustering"
        />

        <MetricCard
          title="Anomaly Status"
          value="--"
          subtitle="Awaiting anomaly analysis"
          icon={ScanSearch}
          color="green"
          badge="Detection"
        />
      </div>

      {/* MAIN ANALYTICS ROW */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <CGPAChart />
        </div>

        <div className="xl:col-span-5">
          <RiskAnalysis />
        </div>
      </div>

      {/* RECOMMENDATIONS */}

      <div>
        <Recommendations />
      </div>

      {/* CLUSTERING + ANOMALY */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClusterAnalysis />
        <AnomalyPanel />
      </div>

      {/* MODEL PERFORMANCE */}

      <ModelPerformance />

      {/* GROWTH PLAN BANNER */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E3E8FF] to-[#C7D4FF] border border-blue-100 p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/70 rounded-xl text-blue-600">
              <Sparkles size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-blue-950">
                Your Personalized Growth Plan
              </h2>

              <p className="text-xs text-blue-900/70 mt-1 max-w-lg">
                Use your ML insights to focus on weak areas, stay
                consistent and achieve your academic goals.
              </p>
            </div>
          </div>

          <button className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2 transition">
            View Growth Plan
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* FOOTER */}

      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-400 pb-2">
        <span>Student 360° · Machine Learning Intelligence</span>
        <span>Last updated: {lastUpdated}</span>
      </div>
    </div>
  );
}
