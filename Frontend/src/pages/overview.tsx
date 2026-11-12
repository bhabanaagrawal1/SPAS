import { useState } from "react";
import {
  Search,
  Bell,
  // RefreshCw,
  TrendingUp,
  Trophy,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  ChartNoAxesCombined,
  // Github,
  FolderCode,
  CheckCircle2,
  Circle,
  ArrowRight,
  Plus,
  Code2,
  // Clock3,
  // BookOpen,
  // FlaskConical,
  Lightbulb,
  ChevronRight,
  Target,
  GraduationCapIcon,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------

interface AcademicData {
  semester: string;
  sgpa: number;
  cgpa: number;
}

interface Task {
  id: number;
  title: string;
  due: string;
  completed: boolean;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: "Live" | "In Progress";
  technology: string;
}

interface Recommendation {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
}

// ------------------------------------------------------------------
// DEMO DATA
// Replace these values with your API response later.
// ------------------------------------------------------------------

const academicData: AcademicData[] = [
  { semester: "Sem 1", sgpa: 9.7, cgpa: 9.7 },
  { semester: "Sem 2", sgpa: 9.07, cgpa: 9.39 },
  { semester: "Sem 3", sgpa: 9.18, cgpa: 9.32 },
  { semester: "Sem 4", sgpa: 8.98, cgpa: 9.23 },
];

const projects: Project[] = [
  {
    id: 1,
    name: "SPAS – Student Portal",
    description: "Student-teacher platform with academic analytics.",
    status: "Live",
    technology: "Typescript",
  },
  {
    id: 2,
    name: "Student 360° Analytics",
    description: "ML-powered student growth and risk prediction.",
    status: "In Progress",
    technology: "Python",
  },
];

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Complete DSA practice",
    due: "Apr 26",
    completed: false,
  },
  {
    id: 2,
    title: "Finish ML project report",
    due: "Apr 28",
    completed: false,
  },
  {
    id: 3,
    title: "Prepare for GATE",
    due: "May 10",
    completed: false,
  },
];

const recommendations: Recommendation[] = [
  {
    title: "Improve Quiz Performance",
    description: "Practice more quizzes to improve your academic average.",
    icon: TrendingUp,
    color: "blue",
  },
  {
    title: "Practice Advanced DSA",
    description: "Focus on graphs and dynamic programming.",
    icon: Code2,
    color: "purple",
  },
  {
    title: "Aim for 9.5+ CGPA",
    description: "Your current academic trend is strong.",
    icon: Trophy,
    color: "orange",
  },
];

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof TrendingUp;
  color: "blue" | "purple" | "green" | "orange";
  trend?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <Card className={`p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="mt-2 flex items-center gap-2">
            <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
            {trend && (
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp size={14} />
                {trend}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3 shadow-sm">
          <Icon size={25} />
        </div>
      </div>
    </Card>
  );
}

interface SectionHeaderProps {
  title: string;
  icon: typeof TrendingUp;
  action?: string;
}

function SectionHeader({ title, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-blue-600" />
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>

      {action && (
        <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800">
          {action}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// OVERVIEW PAGE
// ------------------------------------------------------------------

export default function Overview() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<"tasks" | "goals">("tasks");

  const completedTasks = tasks.filter((task) => task.completed).length;

  const toggleTask = (id: number) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 p-5 lg:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* TOP HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search insights, projects, or goals..."
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  STU001
                </p>
                <p className="text-xs text-slate-500">Student</p>
              </div>
            </div>
          </div>
        </header>

        {/* WELCOME BANNER */}
        <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 p-6">
          <div className="relative z-10">
            <p className="mb-2 text-sm font-medium text-blue-700">
              STUDENT DASHBOARD
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Welcome back, STU001!
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Here's your complete student overview and personalized insights.
            </p>
          </div>

          <GraduationCapIcon
            size={110}
            className="absolute -bottom-5 right-8 hidden rotate-12 text-blue-300 opacity-60 md:block"
          />
        </section>

        {/* ACADEMIC SUMMARY */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="CGPA"
            value="9.23"
            subtitle="Strong Performance"
            icon={ChartNoAxesCombined}
            color="blue"
            trend="+0.12"
          />

          <StatCard
            title="Latest SGPA"
            value="8.98"
            subtitle="On Track"
            icon={Trophy}
            color="purple"
            trend="+0.05"
          />

          <StatCard
            title="Attendance"
            value="90%"
            subtitle="Excellent"
            icon={CalendarDays}
            color="green"
            trend="+6%"
          />

          <StatCard
            title="Risk Level"
            value="Low"
            subtitle="Great Progress!"
            icon={ShieldCheck}
            color="orange"
          />
        </section>

        {/* ML INSIGHTS / PERFORMANCE / CODING */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* ML INSIGHTS */}
          <Card className="p-5 xl:col-span-4">
            <SectionHeader
              title="ML Insights"
              icon={Sparkles}
              action="View Details"
            />

            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#10b981 0% 92%, #e2e8f0 92% 100%)",
                  }}
                >
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white">
                    <span className="text-3xl font-bold text-slate-900">
                      92%
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Success Probability
                </p>
                <p className="text-xs text-slate-500">(Next Semester)</p>
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="font-semibold text-slate-800">
                  Key Insights
                </h3>

                {[
                  "You are performing above average in most metrics.",
                  "Focus on improving quiz performance.",
                  "Your attendance is excellent!",
                ].map((item, index) => (
                  <div key={index} className="flex gap-2 text-sm">
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-500"
                    />
                    <p className="text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ACADEMIC TREND */}
          <Card className="p-5 xl:col-span-5">
            <SectionHeader
              title="Academic Performance Trend"
              icon={ChartNoAxesCombined}
            />

            <div className="mb-3 flex justify-end gap-4 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                SGPA
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                CGPA
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={academicData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="semester"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[6, 10]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sgpa"
                    name="SGPA"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cgpa"
                    name="CGPA"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* GITHUB / CODING PROFILE */}
          <Card className="p-5 xl:col-span-3">
            <SectionHeader
              title="Coding & GitHub"
              icon={Code2}
              action="View Profile"
            />

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-100 p-3">
                <Code2 size={36} className="text-slate-900" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">STU001</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Coding Profile
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div>
                <p className="text-xl font-bold text-slate-900">515+</p>
                <p className="text-xs text-slate-500">Solved</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">70%</p>
                <p className="text-xs text-slate-500">Acceptance</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">811</p>
                <p className="text-xs text-slate-500">CF Rating</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Top Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {["C++", "DSA", "Algorithms", "Web Dev"].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* PROJECTS / TASKS / RECOMMENDATIONS */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">

          {/* MY PROJECTS */}
          <Card className="p-5">
            <SectionHeader
              title="My Projects"
              icon={FolderCode}
              action="View All"
            />

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                    <Code2 size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {project.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          project.status === "Live"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {project.description}
                    </p>

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {project.technology}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* TASKS AND GOALS */}
          <Card className="p-5">
            <SectionHeader title="Tasks & Goals" icon={CheckCircle2} />

            <div className="mb-5 flex gap-5 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("tasks")}
                className={`border-b-2 px-2 pb-2 text-sm font-semibold ${
                  activeTab === "tasks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500"
                }`}
              >
                Tasks ({tasks.length})
              </button>

              <button
                onClick={() => setActiveTab("goals")}
                className={`border-b-2 px-2 pb-2 text-sm font-semibold ${
                  activeTab === "goals"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500"
                }`}
              >
                Goals
              </button>
            </div>

            {activeTab === "tasks" ? (
              <>
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {completedTasks} of {tasks.length} completed
                  </span>
                  <span>
                    {Math.round((completedTasks / tasks.length) * 100)}%
                    complete
                  </span>
                </div>

                <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${
                        (completedTasks / tasks.length) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        aria-label={`Mark ${task.title} as ${
                          task.completed ? "incomplete" : "complete"
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2
                            size={20}
                            className="text-emerald-500"
                          />
                        ) : (
                          <Circle size={20} className="text-slate-400" />
                        )}
                      </button>

                      <span
                        className={`flex-1 text-sm ${
                          task.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-700"
                        }`}
                      >
                        {task.title}
                      </span>

                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {task.due}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <Plus size={17} />
                  Add New Task
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Target size={19} />
                    <span className="text-sm font-semibold">
                      Achieve 9.5 CGPA
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Current CGPA: 9.23
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-blue-100">
                    <div className="h-2 w-[92%] rounded-full bg-blue-600" />
                  </div>
                </div>

                <div className="rounded-xl bg-purple-50 p-4">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Code2 size={19} />
                    <span className="text-sm font-semibold">
                      Become a Specialist
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Improve competitive programming skills.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* RECOMMENDATIONS */}
          <Card className="p-5 lg:col-span-2 2xl:col-span-1">
            <SectionHeader
              title="Personalized Recommendations"
              icon={Lightbulb}
            />

            <div className="space-y-3">
              {recommendations.map((item) => {
                const Icon = item.icon;

                const styles = {
                  blue: "bg-blue-50 text-blue-600",
                  purple: "bg-purple-50 text-purple-600",
                  orange: "bg-orange-50 text-orange-600",
                };

                return (
                  <button
                    key={item.title}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-blue-200 hover:bg-slate-50"
                  >
                    <div
                      className={`rounded-xl p-3 ${styles[item.color as keyof typeof styles]}`}
                    >
                      <Icon size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={19}
                      className="shrink-0 text-slate-400"
                    />
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-4 text-xs text-slate-400">
          <p>Student 360° · Know · Improve · Excel</p>
          <p>Academic Year 2026–27</p>
        </footer>
      </div>
    </main>
  );
}