import { useState } from "react";
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
import { useCodingProfiles } from "@/hooks/useCodingProfiles";
import type { Dashboard, PlatformCard, PlatformKey, Recommendation } from "@/types/codingProfiles";

/* ------------------------------- helpers -------------------------------- */

const statusText = (p: PlatformCard) => {
  if (!p.connected) return "Connect account";
  if (p.syncing) return "Syncing…";
  if (p.needsAttention) return "Check username";
  return "Connected";
};

const timeAgo = (iso: string | null) => {
  if (!iso) return "Never";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300";

const primaryButtonClass =
  "rounded-lg bg-blue-400 px-4 py-2 text-[14px] font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "rounded-lg border border-slate-200 px-4 py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

/* ------------------------------ components ------------------------------ */

function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <section
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: { key: string }) => e.key === "Enter" && onClick() : undefined}
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(35,39,80,0.035)] ${className}${onClick ? " cursor-pointer" : ""}`}
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

function PlatformMark({ platform }: { platform: PlatformCard }) {
  return (
    <div
      className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-[14px] font-extrabold"
      style={{ backgroundColor: `${platform.color}15`, color: platform.color }}
    >
      {platform.mark}
    </div>
  );
}

/* ---- the screen a student sees until they have linked their handles ---- */

type HandleEntry = { platform: PlatformKey; handle: string };

function ConnectHandles({
  platforms,
  errors,
  onSubmit,
  onContinue,
}: {
  platforms: PlatformCard[];
  errors: Partial<Record<PlatformKey, string>>;
  onSubmit: (entries: HandleEntry[]) => Promise<void>;
  onContinue: () => void;
}) {
  const [values, setValues] = useState<Partial<Record<PlatformKey, string>>>({});
  const [busy, setBusy] = useState(false);

  const entries: HandleEntry[] = platforms
    .filter((p) => !p.connected && (values[p.key] ?? "").trim() !== "")
    .map((p) => ({ platform: p.key, handle: (values[p.key] ?? "").trim() }));

  const anyConnected = platforms.some((p) => p.connected);

  const submit = async () => {
    if (!entries.length || busy) return;
    setBusy(true);
    try {
      await onSubmit(entries);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto max-w-3xl p-5">
      <SectionTitle
        icon={<Link2 size={18} />}
        title="Connect your coding profiles"
        subtitle="Add your usernames once. We bring your progress from every platform together in one dashboard."
      />

      <div className="space-y-3">
        {platforms.map((p) => (
          <div key={p.key} className="rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <PlatformMark platform={p} />
              <div className="min-w-0 flex-1 basis-40">
                <div className="text-base font-semibold text-slate-800">{p.name}</div>
                <div className="text-[12px] text-slate-400">
                  {p.connected ? `@${p.handle} · ${statusText(p)}` : "Your public username"}
                </div>
              </div>

              {p.connected ? (
                <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-600">
                  <CheckCircle2 size={16} /> Connected
                </span>
              ) : (
                <div className="w-full sm:w-64">
                  <input
                    value={values[p.key] ?? ""}
                    onChange={(e: { target: { value: string } }) =>
                      setValues((prev) => ({ ...prev, [p.key]: e.target.value }))
                    }
                    onKeyDown={(e: { key: string }) => e.key === "Enter" && void submit()}
                    placeholder={`${p.name} username`}
                    maxLength={40}
                    disabled={busy}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
            {errors[p.key] && <p className="mt-2 text-[12px] text-red-500">{errors[p.key]}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={() => void submit()} disabled={!entries.length || busy} className={primaryButtonClass}>
          {busy ? "Connecting…" : "Connect profiles"}
        </button>
        {anyConnected && (
          <button onClick={onContinue} disabled={busy} className={secondaryButtonClass}>
            Continue to dashboard
          </button>
        )}
        <span className="text-[12px] text-slate-400">
          You can connect just one platform now and add the rest later.
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[13px] text-slate-400">
        <ShieldCheck size={12} /> Only your public profile data is read. Your connected profile data stays private.
      </div>
    </Card>
  );
}

/* ---- small dialog to connect / change / disconnect one platform (used on the dashboard) ---- */

function HandleDialog({
  platform,
  onClose,
  onSave,
  onDisconnect,
}: {
  platform: PlatformCard;
  onClose: () => void;
  onSave: (handle: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
}) {
  const [value, setValue] = useState(platform.handle ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const save = () => {
    const handle = value.trim();
    if (!handle || busy) return;
    if (platform.connected && handle.toLowerCase() === (platform.handle ?? "").toLowerCase()) {
      onClose();
      return;
    }
    void run(() => onSave(handle));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <PlatformMark platform={platform} />
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {platform.connected ? `Update ${platform.name} username` : `Connect ${platform.name}`}
            </h3>
            <p className="text-[12px] text-slate-400">Your public username on {platform.name}</p>
          </div>
        </div>

        <input
          autoFocus
          value={value}
          onChange={(e: { target: { value: string } }) => setValue(e.target.value)}
          onKeyDown={(e: { key: string }) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") onClose();
          }}
          placeholder={`${platform.name} username`}
          maxLength={40}
          disabled={busy}
          className={inputClass}
        />
        {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={save} disabled={!value.trim() || busy} className={primaryButtonClass}>
            {busy ? "Saving…" : platform.connected ? "Save" : "Connect"}
          </button>
          <button onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            Cancel
          </button>
          {platform.connected && (
            <button
              onClick={() => {
                if (window.confirm(`Disconnect ${platform.name}?`)) void run(onDisconnect);
              }}
              disabled={busy}
              className="ml-auto text-[13px] font-semibold text-red-500 hover:underline disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- heatmap (real data only) ---- */

type HeatmapCell = { level: number; title: string; pad?: boolean };

function ActivityHeatmap({
  days,
  monthLabels,
  totalSubmissions,
}: {
  days: Dashboard["activity"]["days"];
  monthLabels: string[];
  totalSubmissions: number;
}) {
  const colors = [
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-300",
    "bg-blue-400",
    "bg-blue-600",
  ];

  // Empty leading cells so the first day lands on its real weekday row (Mon = first row).
  const firstDay = days.length ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 1;
  const padding: HeatmapCell[] = Array.from({ length: (firstDay + 6) % 7 }, () => ({
    level: 0,
    title: "",
    pad: true,
  }));
  const cells: HeatmapCell[] = [
    ...padding,
    ...days.map((d) => ({
      level: d.level,
      title: `${d.count} submission${d.count === 1 ? "" : "s"} on ${d.date}`,
    })),
  ];

  return (
    <div>
      <div className="mb-2 flex justify-between pl-8 text-[12px] text-slate-400">
        {monthLabels.map((label, i) => (
          <span key={`${label}-${i}`}>{label}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 text-[12px] text-slate-400">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px] overflow-hidden">
          {cells.map((cell, i) => (
            <div
              key={i}
              title={cell.title}
              className={`aspect-square min-w-0 rounded-[2px] ${cell.pad ? "invisible" : colors[cell.level]}`}
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
        <span>{`${totalSubmissions} submissions in the last year`}</span>
      </div>
    </div>
  );
}

/* ---- the dashboard (shown once at least one handle is linked) ---- */

function DashboardBody({
  data,
  recommendations,
  onPlatformClick,
  onSync,
  onRatingPlatformClick,
}: {
  data: Dashboard;
  recommendations: Recommendation[];
  onPlatformClick: (platform: PlatformCard) => void;
  onSync: () => void;
  onRatingPlatformClick: () => void;
}) {
  const rating = data.ratingProgression;
  const ratingPlatformName =
    (rating.platform && data.platforms.find((p) => p.key === rating.platform)?.name) || "Rating";
  const ratingDomain: [number, number] = rating.domain ?? [600, 1000];

  const ringAngle = Math.round((data.progress.connected / data.progress.total) * 360);

  const metrics = [
    {
      label: "Problems Solved",
      value: String(data.summary.problemsSolved),
      detail: "Across all platforms",
      icon: <CheckCircle2 size={18} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: "Contests Attended",
      value: String(data.summary.contestsAttended),
      detail: "Total participated",
      icon: <Trophy size={18} />,
      color: "text-violet-600",
      bg: "bg-violet-50",
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: "Current Streak",
      value: `${data.summary.currentStreak} day${data.summary.currentStreak === 1 ? "" : "s"}`,
      detail: "Keep it going!",
      icon: <Flame size={18} />,
      color: "text-orange-500",
      bg: "bg-orange-50",
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: "Last Synchronized",
      value: data.syncing ? "Syncing…" : timeAgo(data.summary.lastSyncedAt),
      detail: "Sync your profiles",
      icon: <Clock3 size={18} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      // Clicking this card re-syncs all linked platforms.
      onClick: onSync,
    },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* Main column */}
      <div className="min-w-0 space-y-4">
        {data.syncing && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-[13px] text-blue-500">
            <Sparkles size={14} /> Fetching your data. This can take a few seconds.
          </div>
        )}

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
            {data.platforms.map((p) => (
              <button
                key={p.key}
                onClick={() => onPlatformClick(p)}
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
                  {p.handle ? `@${p.handle}` : "@your_handle"} <Link to="/"></Link>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[12px] font-medium">
                  <Link2 size={11} />
                  {statusText(p)}
                </div>
                {p.needsAttention && p.lastSyncError && (
                  <div className="mt-1 text-[11px] leading-snug text-red-500">{p.lastSyncError}</div>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} className="pt-4 pb-4 pr-5 pl-5" onClick={m.onClick}>
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
          <ActivityHeatmap
            days={data.activity.days}
            monthLabels={data.activity.months.slice(-12).map((m) => m.label)}
            totalSubmissions={data.activity.totalSubmissions}
          />
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
              <button
                onClick={onRatingPlatformClick}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] text-slate-500"
              >
                {ratingPlatformName} <ChevronDown size={15} />
              </button>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={rating.data}
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
                    domain={ratingDomain}
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
                Current rating{" "}
                <b className="text-slate-800">&nbsp;{rating.current ?? "—"}</b>
              </span>
              <span className="font-semibold text-blue-500">
                {rating.current === null
                  ? ""
                  : `${rating.changeThisYear >= 0 ? "↑" : "↓"} ${Math.abs(rating.changeThisYear)} this year`}
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
                  data={data.solvedByPlatform}
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
              Counts come from your connected accounts.
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
            {data.topics.map((t) => (
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
                background: `conic-gradient(#8bbefc 0deg ${ringAngle}deg, #e0e1e2 ${ringAngle}deg 360deg)`,
              }}
            >
              <div className="grid h-[80px] w-[80px] place-items-center rounded-full bg-white text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{data.progress.connected}</div>
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
            {recommendations.length === 0 && (
              <p className="text-[12px] text-slate-400">
                Recommendations will appear once your profiles finish syncing.
              </p>
            )}
            {recommendations.map((r) => (
              <div
                key={`${r.platform}-${r.title}`}
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
                  <button
                    onClick={() => window.open(r.url, "_blank", "noopener,noreferrer")}
                    className="rounded-md bg-blue-400 px-2 py-1 text-[12px] font-semibold text-white hover:bg-blue-500"
                  >
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
  );
}

/* ---------------------------------- page --------------------------------- */

export default function CodingProfiles() {
  const {
    dashboard,
    recommendations,
    error,
    reload,
    setRatingPlatform,
    connect,
    disconnect,
    syncNow,
  } = useCodingProfiles();

  const [dialogPlatform, setDialogPlatform] = useState<PlatformCard | null>(null);
  const [connectErrors, setConnectErrors] = useState<Partial<Record<PlatformKey, string>>>({});

  const hasHandles = Boolean(dashboard?.hasData);
  const showConnectScreen = Boolean(dashboard) && (!hasHandles || Object.keys(connectErrors).length > 0);

  // Connects every filled-in username. Failures are kept so the student can fix them on the same screen.
  const connectAll = async (entries: HandleEntry[]) => {
    const results = await Promise.allSettled(entries.map((e) => connect(e.platform, e.handle)));
    const failures: Partial<Record<PlatformKey, string>> = {};
    results.forEach((result, i) => {
      if (result.status === "rejected") failures[entries[i].platform] = errorMessage(result.reason);
    });
    setConnectErrors(failures);
  };

  const handleSync = async () => {
    try {
      await syncNow();
    } catch (err) {
      window.alert(errorMessage(err));
    }
  };

  // The dropdown button cycles through the platforms that have a rating history.
  const handleRatingPlatformClick = () => {
    const rating = dashboard?.ratingProgression;
    if (!rating || rating.available.length < 2 || !rating.platform) return;
    const index = rating.available.indexOf(rating.platform);
    setRatingPlatform(rating.available[(index + 1) % rating.available.length]);
  };

  let body: React.ReactNode;
  if (!dashboard) {
    body = error ? (
      <Card className="mx-auto max-w-3xl p-5">
        <p className="text-[14px] text-slate-700">We could not load your coding profiles.</p>
        <p className="mt-1 text-[12px] text-red-500">{error}</p>
        <button onClick={reload} className={`mt-4 ${primaryButtonClass}`}>
          Try again
        </button>
      </Card>
    ) : (
      <Card className="mx-auto max-w-3xl p-5">
        <p className="text-[14px] text-slate-500">Loading your coding profiles…</p>
      </Card>
    );
  } else if (showConnectScreen) {
    body = (
      <ConnectHandles
        platforms={dashboard.platforms}
        errors={connectErrors}
        onSubmit={connectAll}
        onContinue={() => setConnectErrors({})}
      />
    );
  } else {
    body = (
      <DashboardBody
        data={dashboard}
        recommendations={recommendations ?? []}
        onPlatformClick={setDialogPlatform}
        onSync={() => void handleSync()}
        onRatingPlatformClick={handleRatingPlatformClick}
      />
    );
  }

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

        {body}

        {dialogPlatform && (
          <HandleDialog
            key={dialogPlatform.key}
            platform={dialogPlatform}
            onClose={() => setDialogPlatform(null)}
            onSave={(handle) => connect(dialogPlatform.key, handle)}
            onDisconnect={() => disconnect(dialogPlatform.key)}
          />
        )}

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