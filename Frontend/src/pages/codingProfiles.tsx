import { Link } from "react-router-dom";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Code2,
  Flame,
  Globe2,
  Link2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
  Clock3,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const platforms = [
  {
    name: "Codeforces",
    handle: "@your_handle",
    color: "#5368e8",
    mark: "CF",
    status: "Connect account",
  },
  {
    name: "LeetCode",
    handle: "@your_handle",
    color: "#f59e0b",
    mark: "LC",
    status: "Connect account",
  },
  {
    name: "CodeChef",
    handle: "@your_handle",
    color: "#a36a45",
    mark: "CC",
    status: "Not connected",
  },
  {
    name: "GeeksforGeeks",
    handle: "@your_handle",
    color: "#159b70",
    mark: "GFG",
    status: "Connect account",
  },
  {
    name: "HackerRank",
    handle: "@your_handle",
    color: "#149b62",
    mark: "HR",
    status: "Not connected",
  },
];

const ratingData = [
  { month: "Jan", rating: 720 },
  { month: "Feb", rating: 760 },
  { month: "Mar", rating: 748 },
  { month: "Apr", rating: 805 },
  { month: "May", rating: 830 },
  { month: "Jun", rating: 875 },
  { month: "Jul", rating: 916 },
];

const solvedData = [
  { platform: "Codeforces", solved: 248, color: "#7064e8" },
  { platform: "LeetCode", solved: 182, color: "#f5a623" },
  { platform: "CodeChef", solved: 96, color: "#a88b74" },
  { platform: "GFG", solved: 74, color: "#34a879" },
  { platform: "HackerRank", solved: 28, color: "#60a5fa" },
];

const topicData = [
  { topic: "Arrays", strength: 82, needsWork: 18 },
  { topic: "Strings", strength: 70, needsWork: 30 },
  { topic: "Graphs", strength: 42, needsWork: 58 },
  { topic: "Trees", strength: 56, needsWork: 44 },
  { topic: "DP", strength: 32, needsWork: 68 },
  { topic: "Sorting", strength: 76, needsWork: 24 },
  { topic: "Math", strength: 61, needsWork: 39 },
];

const recommendations = [
  {
    platform: "CF",
    title: "A. Bitland and Flags",
    topic: "Greedy",
    level: "Easy",
    reason: "Build confidence with implementation problems.",
    color: "#ef4444",
  },
  {
    platform: "LC",
    title: "Two Sum",
    topic: "Arrays · Hash Map",
    level: "Easy",
    reason: "Practice a core pattern you will reuse often.",
    color: "#f59e0b",
  },
  {
    platform: "CC",
    title: "Chef and Gift",
    topic: "Math",
    level: "Beginner",
    reason: "Strengthen your fundamentals with a short problem.",
    color: "#a36a45",
  },
  {
    platform: "GFG",
    title: "Maximum Subarray",
    topic: "Kadane's Algorithm",
    level: "Medium",
    reason: "Improve your array problem-solving approach.",
    color: "#159b70",
  },
  {
    platform: "CF",
    title: "Problem 1342C",
    topic: "Number Theory",
    level: "Medium",
    reason: "Get more comfortable reasoning about remainders.",
    color: "#5368e8",
  },
];

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(35,39,80,0.035)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-500">
          {icon}
        </span>
        <div>
          <h2 className="text-[16px] font-semibold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap() {
  const days = Array.from({ length: 364 }, (_, i) => {
    const seed = (i * 17 + i * i * 3) % 11;
    return seed < 3 ? 0 : seed < 5 ? 1 : seed < 8 ? 2 : seed < 10 ? 3 : 4;
  });
  const colors = [
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-300",
    "bg-blue-400",
    "bg-blue-600",
  ];
  return (
    <div>
      <div className="mb-2 flex justify-between pl-8 text-[12px] text-slate-400">
        <span>Nov</span>
        <span>Dec</span>
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
        <span>Oct</span>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 text-[12px] text-slate-400">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px] overflow-hidden">
          {days.map((level, i) => (
            <div
              key={i}
              title={`${level === 0 ? "No" : ["", "1", "2–3", "4–5", "6+"][level]} submissions`}
              className={`aspect-square min-w-0 rounded-[2px] ${colors[level]}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500">
        <span>
          Less{" "}
          <span className="mx-1 inline-flex gap-1 align-middle">
            {colors.map((c) => (
              <i
                key={c}
                className={`inline-block h-2.5 w-2.5 rounded-[2px] ${c}`}
              />
            ))}
          </span>{" "}
          More
        </span>
        <span>Sample activity • connect a profile to sync real data</span>
      </div>
    </div>
  );
}

export default function CodingProfiles() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#60A5FA]">
      <main className="mx-auto max-w-[1600px] px-4 py-5 md:px-7">
        {/* Page heading */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[14px] font-medium uppercase  text-[#60A5FA]">
              Your developer journey
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Coding Profiles
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-slate-500">
              Track your progress, unify your performance and get personalized
              recommendations.
            </p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#60A5FA] sm:flex">
            <Code2 size={29} />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main column */}
          <div className="min-w-0 space-y-4">
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    Connected Platforms
                  </h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    Your coding accounts, all in one place
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {platforms.map((p) => (
                  <button
                    key={p.name}
                    className="group rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div
                      className="mb-3 flex h-10 w-14 items-center justify-center rounded-lg text-[14px] font-extrabold"
                      style={{
                        backgroundColor: `${p.color}15`,
                        color: p.color,
                      }}
                    >
                      {p.mark}
                    </div>
                    <div className="text-base font-semibold text-slate-800">
                      {p.name}
                    </div>
                    <div className="mt-1 truncate text-[14px] text-slate-400">
                      {p.handle} <Link to="/"></Link>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[12px] font-medium">
                      <Link2 size={11} />
                      {p.status}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Problems Solved",
                  value: "628",
                  detail: "Across all platforms",
                  icon: <CheckCircle2 size={18} />,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Contests Attended",
                  value: "24",
                  detail: "Total participated",
                  icon: <Trophy size={18} />,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                },
                {
                  label: "Current Streak",
                  value: "7 days",
                  detail: "Keep it going!",
                  icon: <Flame size={18} />,
                  color: "text-orange-500",
                  bg: "bg-orange-50",
                },
                {
                  label: "Last Synchronized",
                  value: "2h ago",
                  detail: "Sync your profiles",
                  icon: <Clock3 size={18} />,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
              ].map((m) => (
                <Card key={m.label} className="pt-4 pb-4 pr-5 pl-5">
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${m.bg} ${m.color}`}
                  >
                    {m.icon}
                  </div>
                  <p className="text-[14px] text-slate-500">{m.label}</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                    {m.value}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-400">{m.detail}</p>
                </Card>
              ))}
            </div>

            <Card className="p-5 text-xl">
              <SectionTitle
                icon={<Activity size={18} />}
                title="Your Coding Activity"
                subtitle="Daily activity across your connected platforms"
              />
              <ActivityHeatmap />
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <SectionTitle
                    icon={<TrendingUp size={18} />}
                    title="Rating Progression"
                    subtitle="Track your rating changes over time"
                  />
                  <button className="flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] text-slate-500">
                    Codeforces <ChevronDown size={15} />
                  </button>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ratingData}
                      margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="ratingFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#60A5FA"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor="#60A5FA"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#edf0f7" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[600, 1000]}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #60A5FA",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rating"
                        stroke="#60A5FA"
                        strokeWidth={2.5}
                        fill="url(#ratingFill)"
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex items-center justify-between text-[12px] text-slate-500">
                  <span>
                    Current rating <b className="text-slate-800">&nbsp;916</b>
                  </span>
                  <span className="font-semibold text-blue-500">
                    ↑ 196 this year
                  </span>
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle
                  icon={<Target size={18} />}
                  title="Solved Questions by Platform"
                  subtitle="Total uniquely solved problems"
                />
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={solvedData}
                      margin={{ top: 8, right: 2, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#edf0f7"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="platform"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #60A5FA",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="solved"
                        radius={[5, 5, 0, 0]}
                        fill="#60A5FA"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  Counts are illustrative until accounts are connected.
                </p>
              </Card>
            </div>

            <Card className="p-5">
              <SectionTitle
                icon={<Zap size={18} />}
                title="Topic-wise Performance"
                subtitle="Your strengths and topics that deserve more practice"
              />
              <div className="mb-3 flex flex-wrap gap-3 text-[13px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-sm bg-[#60A5FA]" /> Strong
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-sm bg-[#caccce]" /> Needs
                  practice
                </span>
              </div>
              <div className="space-y-3">
                {topicData.map((t) => (
                  <div
                    key={t.topic}
                    className="grid grid-cols-[70px_minmax(0,1fr)_35px] items-center gap-3"
                  >
                    <span className="text-[13px] text-slate-600">
                      {t.topic}
                    </span>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-[#caccce]">
                      <div
                        className="rounded-full bg-[#60A5FA]"
                        style={{ width: `${t.strength}%` }}
                      />
                    </div>
                    <span className="text-right text-[12px] font-semibold text-slate-500">
                      {t.strength}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <Card className="p-5">
              <SectionTitle
                icon={<Trophy size={18} />}
                title="Your Progress"
                subtitle="Your current standing"
              />
              <div className="flex items-center gap-3">
                <div
                  className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#8bbefc 0deg 220deg, #e0e1e2 220deg 360deg)",
                  }}
                >
                  <div className="grid h-[80px] w-[80px] place-items-center rounded-full bg-white text-center">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">3</div>
                      <div className="text-[9px] leading-tight text-slate-500">
                        Platforms
                        <br />
                        Connected
                      </div>
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {[
                    ["Codeforces", "#5368e8"],
                    ["LeetCode", "#f59e0b"],
                    ["CodeChef", "#a36a45"],
                    ["GFG", "#159b70"],
                    ["HackerRank", "#149b62"],
                  ].map(([name, color]) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 text-[12px] text-slate-600"
                    >
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-blue-400">
                  <Sparkles size={14} /> Keep your momentum
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-blue-90/80">
                  Solve one problem today to build a consistent practice habit.
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <SectionTitle
                  icon={<Sparkles size={18} />}
                  title="Recommended for You"
                  subtitle="Based on your progress and practice history"
                />
              </div>
              <div className="space-y-3">
                {recommendations.map((r) => (
                  <div
                    key={r.title}
                    className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
                        style={{
                          backgroundColor: `${r.color}15`,
                          color: r.color,
                        }}
                      >
                        {r.platform}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold leading-snug text-slate-800">
                          {r.title}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-500">
                          {r.topic}
                        </p>
                      </div>
                      <button className="rounded-md bg-blue-400 px-2 py-1 text-[12px] font-semibold text-white hover:bg-blue-500">
                        Solve
                      </button>
                    </div>
                    <div className="ml-9 mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {r.level}
                      </span>
                      <p className="text-[12px] leading-relaxed text-slate-400">
                        {r.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-violet-200 py-2 text-[14px] font-semibold text-blue-500 hover:bg-blue-50">
                View all recommendations <span>→</span>
              </button>
            </Card>

            <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-400">
                <CircleHelp size={18} />
                <h3 className="text-[15px] font-semibold">Pro Tip</h3>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600">
                Consistency beats intensity. Try solving one problem daily and
                review mistakes each weekend.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-blue-400">
                <BookOpen size={17} /> Build your learning streak
              </div>
            </Card>

            <div className="flex items-center justify-center gap-2 px-2 text-[13px] text-slate-400">
              <ShieldCheck size={12} /> Your connected profile data stays
              private
            </div>
          </aside>
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[14px] text-slate-400">
          <span>Student 360° · Coding Profiles</span>
          <span className="flex items-center gap-1">
            <Globe2 size={15} /> Modern UI · Simple Statistics
          </span>
        </footer>
      </main>
    </div>
  );
}
