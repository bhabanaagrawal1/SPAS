import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Code2,
  ExternalLink,
  Folder,
  GitBranch,
  Layers3,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  Star,
  TrendingUp,
  Zap,
  CircleHelp,
} from "lucide-react";

type Status = "Completed" | "In Progress" | "Archived";
type Project = {
  id: number;
  name: string;
  description: string;
  status: Status;
  technologies: string[];
  stars: string;
  commits: number;
  visual: "dashboard" | "github" | "mobile" | "mountain" | "commerce" | "blog";
};
const initialProjects: Project[] = [
  {
    id: 1,
    name: "Student 360° Dashboard",
    description:
      "A web application for academic performance, coding progress, and personal growth.",
    status: "Completed",
    technologies: ["React", "Node.js", "PostgreSQL", "Tailwind"],
    stars: "3.2k",
    commits: 12,
    visual: "dashboard",
  },
  {
    id: 2,
    name: "GitHub Portfolio",
    description:
      "A personal portfolio website with GitHub integration and project showcase.",
    status: "In Progress",
    technologies: ["React", "TypeScript", "G-API", "Tailwind"],
    stars: "1.4k",
    commits: 8,
    visual: "github",
  },
  {
    id: 3,
    name: "Task Management App",
    description:
      "A productivity app to manage tasks, set goals and track progress with deadlines.",
    status: "In Progress",
    technologies: ["React", "Firebase", "Tailwind", "Redux"],
    stars: "892",
    commits: 5,
    visual: "mobile",
  },
  {
    id: 4,
    name: "Weather Dashboard",
    description:
      "A weather app with real-time data, location search and a 5-day forecast.",
    status: "Completed",
    technologies: ["React", "OW-API", "Tailwind", "Axios"],
    stars: "678",
    commits: 7,
    visual: "mountain",
  },
  {
    id: 5,
    name: "E-commerce Website",
    description:
      "A modern e-commerce platform with product catalog, cart and user authentication.",
    status: "In Progress",
    technologies: ["Next.js", "Stripe", "PostgreSQL", "Tailwind"],
    stars: "1.2k",
    commits: 15,
    visual: "commerce",
  },
  {
    id: 6,
    name: "Blog Platform",
    description:
      "A simple blog platform with markdown support and an admin dashboard.",
    status: "Archived",
    technologies: ["Next.js", "MongoDB", "Tailwind", "MDX"],
    stars: "540",
    commits: 9,
    visual: "blog",
  },
];
const stack = [
  ["React", "✳", "text-sky-500"],
  ["Node.js", "◉", "text-emerald-600"],
  ["TypeScript", "▣", "text-blue-600"],
  ["Python", "⌘", "text-amber-500"],
  ["MongoDB", "◉", "text-green-600"],
  ["PostgreSQL", "◈", "text-sky-600"],
  ["Tailwind CSS", "≋", "text-cyan-500"],
  ["Firebase", "ϟ", "text-orange-500"],
];
const activity = [
  ["Updated Student 360° Dashboard", "2 hours ago", "bg-blue-500"],
  ["Added new feature to Blog Platform", "5 hours ago", "bg-blue-500"],
  ["Created new repository on GitHub", "1 day ago", "bg-rose-500"],
  ["Completed Weather Dashboard", "2 days ago", "bg-emerald-500"],
  ["Pushed changes to E-commerce", "3 days ago", "bg-slate-500"],
];
const ideas = [
  {
    title: "AI Study Assistant",
    tag: "Trending",
    description:
      "Build an AI-powered study assistant for notes, doubt solving and personalized learning.",
    tech: ["React", "OpenAI", "Node.js"],
    icon: <Code2 size={16} />,
  },
  {
    title: "Mobile Expense Tracker",
    tag: "Beginner Friendly",
    description:
      "A simple mobile app to track daily expenses and manage your budget.",
    tech: ["React Native", "Firebase", "SQLite"],
    icon: <BookOpen size={16} />,
  },
  {
    title: "DevOps Dashboard",
    tag: "Popular",
    description:
      "Monitor deployments, system health and CI/CD pipelines in one place.",
    tech: ["Docker", "Kubernetes", "Grafana"],
    icon: <Layers3 size={16} />,
  },
];
function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
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
function Artwork({ type }: { type: Project["visual"] }) {
  if (type === "github")
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white">
        <Code2 size={56} strokeWidth={1.6} />
      </div>
    );
  if (type === "mountain")
    return (
      <div className="relative h-full overflow-hidden bg-gradient-to-b from-sky-300 via-blue-300 to-slate-800">
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-slate-700 [clip-path:polygon(0_100%,0_55%,20%_20%,35%_54%,55%_0,78%_52%,100%_22%,100%_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-indigo-950/60 [clip-path:polygon(0_100%,0_52%,23%_70%,45%_18%,68%_62%,84%_32%,100%_58%,100%_100%)]" />
        <div className="absolute right-7 top-4 h-8 w-8 rounded-full bg-amber-100/80" />
      </div>
    );
  if (type === "mobile")
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-gradient-to-br from-blue-400 to-blue-500">
        <div className="h-20 w-12 rotate-[-9deg] rounded-xl border-[3px] border-slate-900 bg-white p-1.5 shadow-lg">
          <div className="mb-2 h-1 w-4 rounded-full bg-slate-300" />
          {["bg-blue-100", "bg-blue-100", "bg-amber-100", "bg-emerald-100"].map(
            (c) => (
              <i key={c} className={`mb-1 block h-3 rounded ${c}`} />
            ),
          )}
        </div>
        <div className="h-24 w-14 rotate-[7deg] rounded-xl border-[3px] border-slate-900 bg-white p-1.5 shadow-lg">
          <div className="mb-2 h-1 w-4 rounded-full bg-slate-300" />
          <div className="h-5 rounded bg-blue-100" />
          <div className="mt-2 h-2 rounded bg-slate-100" />
          <div className="mt-1 h-2 w-3/4 rounded bg-slate-100" />
          <div className="mt-3 h-6 rounded bg-blue-100" />
        </div>
      </div>
    );
  if (type === "commerce" || type === "blog")
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-gradient-to-br from-stone-100 to-slate-200 p-3">
        <div className="w-3/4 rotate-[-3deg] rounded-sm border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mx-auto mb-2 h-2 w-1/2 rounded bg-slate-300" />
          <div className="flex gap-2">
            <div className="h-12 w-1/2 rounded bg-gradient-to-br from-blue-100 to-amber-100" />
            <div className="flex-1 space-y-1">
              <i className="block h-1.5 rounded bg-slate-200" />
              <i className="block h-1.5 rounded bg-slate-200" />
              <i className="block h-1.5 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="relative h-full overflow-hidden bg-linear-to-br from-blue-200 via-blue-200 to-blue-100 p-3">
      <div className="absolute inset-3 overflow-hidden rounded-md border border-white/70 bg-white/90 p-2 shadow-lg">
        <div className="flex items-center gap-1 border-b border-slate-100 pb-1">
          {["bg-rose-300", "bg-amber-300", "bg-emerald-300"].map((c) => (
            <i key={c} className={`h-1.5 w-1.5 rounded-full ${c}`} />
          ))}
          <i className="ml-2 h-1.5 w-1/3 rounded bg-slate-200" />
        </div>
        <div className="mt-2 grid h-[calc(100%-18px)] grid-cols-[1fr_2fr] gap-2">
          <div className="space-y-1.5">
            <i className="block h-2 rounded bg-blue-100" />
            <i className="block h-2 rounded bg-slate-100" />
            <i className="block h-2 rounded bg-slate-100" />
            <i className="block h-2 rounded bg-blue-100" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              "bg-blue-100",
              "bg-blue-100",
              "bg-amber-100",
              "bg-emerald-100",
            ].map((c) => (
              <i key={c} className={`rounded ${c}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }: { status: Status }) {
  const cls =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-600"
      : status === "In Progress"
        ? "bg-blue-50 text-blue-400"
        : "bg-slate-200 text-slate-500";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

export default function MyProjects() {
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("React, TypeScript");
  const [notice, setNotice] = useState("");
  const completed = projects.filter((p) => p.status === "Completed").length;
  const progress = projects.filter((p) => p.status === "In Progress").length;
  const allTech = projects.flatMap((p) => p.technologies);
  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "All" || p.status === filter) &&
          `${p.name} ${p.description} ${p.technologies.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ),
    [projects, filter, search],
  );
  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }
  function addProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setProjects((current) => [
      {
        id: Date.now(),
        name: name.trim(),
        description: description.trim() || "A new project in your workspace.",
        status: "In Progress",
        technologies: technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        stars: "0",
        commits: 0,
        visual: "dashboard",
      },
      ...current,
    ]);
    setName("");
    setDescription("");
    setTechnologies("React, TypeScript");
    setShowForm(false);
    setFilter("All");
    setSearch("");
    notify("Project added to your workspace.");
  }
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-800">
      <main className="mx-auto max-w-[1600px] px-4 py-5 md:px-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[16px] font-medium text-blue-300">
              Developer Hub
            </p>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
              My Projects
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Build, track and showcase your projects. Turn your ideas into
              real-world solutions.
            </p>
          </div>
          <button
  onClick={() => setShowForm(true)}
  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400 bg-blue-400 px-3.5 py-2 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
>
  <Plus size={17} strokeWidth={2.25} />
  Add New Project
</button>
        </div>
        {notice && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[16px] font-medium text-emerald-700"
          >
            <Check size={18} />
            {notice}
          </div>
        )}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Panel className="p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-500">
                  <Folder size={20} />
                </div>
                <p className="text-[14px] text-slate-500">Total Projects</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {projects.length}
                </p>
                <p className="mt-2 flex items-center gap-1 text-[14px] font-medium text-emerald-600">
                  <TrendingUp size={18} /> +2 this month
                </p>
              </Panel>
              <Panel className="p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-500">
                  <Code2 size={22} />
                </div>
                <p className="text-[14px] text-slate-500">Completed</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {completed}
                </p>
                <p className="mt-2 text-[14px] text-slate-500">
                  {Math.round((completed / Math.max(projects.length, 1)) * 100)}
                  % completion rate
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-blue-400"
                    style={{
                      width: `${(completed / Math.max(projects.length, 1)) * 100}%`,
                    }}
                  />
                </div>
              </Panel>
              <Panel className="p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-400">
                  <Clock3 size={22} />
                </div>
                <p className="text-[14px] text-slate-500">In Progress</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {progress}
                </p>
                <p className="mt-2 text-[14px] text-slate-500">
                  {Math.round((progress / Math.max(projects.length, 1)) * 100)}%
                  in progress
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-blue-400"
                    style={{
                      width: `${(progress / Math.max(projects.length, 1)) * 100}%`,
                    }}
                  />
                </div>
              </Panel>
              <Panel className="p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500">
                  <Star size={22} />
                </div>
                <p className="text-[14px] text-slate-500">Technologies Used</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {new Set(allTech).size}
                </p>
                <p className="mt-2 text-[14px] text-slate-500">
                  React, Node.js, Python + more
                </p>
              </Panel>
            </div>

            <Panel className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold text-slate-900">
                    Your Projects
                  </h2>
                  <p className="mt-1 text-[14px] text-slate-500">
                    Manage and track all your projects in one place.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    ["All", "Completed", "In Progress", "Archived"] as const
                  ).map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${filter === item ? "bg-blue-400 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-blue-50"}`}
                    >
                      {item}
                    </button>
                  ))}
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2">
                    <Search size={15} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search projects"
                      className="w-28 bg-transparent text-[14px] outline-none placeholder:text-slate-400 sm:w-36"
                    />
                  </label>
                </div>
              </div>
              {filtered.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {filtered.map((project) => (
                    <article
                      key={project.id}
                      className="group overflow-hidden rounded-xl border border-slate-200/90 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60"
                    >
                      <div className="relative m-3 mb-0.5 h-45 overflow-hidden rounded-lg">
                        <Artwork type={project.visual} />
                        <button
                          aria-label={`More options for ${project.name}`}
                          onClick={() =>
                            notify(
                              `More actions for "${project.name}" can be connected next.`,
                            )
                          }
                          className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-blue-400"
                        >
                          <MoreVertical size={13} />
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[15px] font-medium leading-5 text-slate-900">
                            {project.name}
                          </h3>
                          <StatusBadge status={project.status} />
                        </div>
                        <p className="mt-2 min-h-9 text-[14px] leading-relaxed text-slate-500">
                          {project.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-full bg-blue-50 px-3 py-1 text-[12px] font-medium text-blue-500"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-3 text-[14px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Star size={14} className="text-amber-500" />
                              {project.stars}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch size={14} />
                              {project.commits} commits
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              notify(
                                `Connect "${project.name}" to a project detail page next.`,
                              )
                            }
                            className="flex items-center gap-1 text-[14px] font-semibold text-blue-400 hover:text-blue-500"
                          >
                            View Project <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <Folder size={25} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-[16px] font-medium text-slate-700">
                    No projects found
                  </p>
                  <p className="mt-1 text-[13px] text-slate-400">
                    Try a different search or filter.
                  </p>
                </div>
              )}
            </Panel>

            <Panel className="bg-gradient-to-br from-blue-50/80 to-blue-50/70 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-400 shadow-sm">
                    <Lightbulb size={23} />
                  </span>
                  <div>
                    <h2 className="text-[18px] font-semibold text-slate-900">
                      Project Recommendations
                    </h2>
                    <p className="mt-0.5 text-[14px] text-slate-500">
                      Ideas based on skills and interests
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    notify(
                      "More project recommendations will be available here.",
                    )
                  }
                  className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2 text-[13px] font-medium text-blue-400 hover:bg-white"
                >
                  View All Suggestions{" "}
                  <ArrowRight size={13} className="ml-1 inline" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {ideas.map((idea) => (
                  <article
                    key={idea.title}
                    className="rounded-xl border border-white bg-white/90 p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-500">
                        {idea.icon}
                      </span>
                      <div>
                        <h3 className="text-[14px] font-medium text-slate-800 mb-0">
                          {idea.title}
                        </h3>
                        <span className="text-[13px] text-blue-400">
                          {idea.tag}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
                      {idea.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {idea.tech.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-blue-50 px-3 py-1 text-[13px] text-blue-500"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                <Zap size={18} className="text-blue-400" /> Quick Actions
              </h2>
              {[
                {
                  label: "Create New Project",
                  icon: <Plus size={16} />,
                  run: () => setShowForm(true),
                },
                {
                  label: "Import from GitHub",
                  icon: <Code2 size={16} />,
                  run: () =>
                    notify(
                      "GitHub import is a placeholder. Connect GitHub to enable it.",
                    ),
                },
                {
                  label: "Browse Templates",
                  icon: <BookOpen size={16} />,
                  run: () => notify("Project templates will be added here."),
                },
                {
                  label: "View All Repositories",
                  icon: <ExternalLink size={16} />,
                  run: () =>
                    notify("Connect GitHub to view your repositories."),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.run}
                  className="flex w-full items-center gap-2 border-b border-slate-100 py-3 text-left text-[14px] text-slate-600 last:border-0 hover:text-blue-500"
                >
                  <span className="text-blue-500">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight size={15} className="text-slate-400" />
                </button>
              ))}
            </Panel>
            <Panel className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                <Layers3 size={18} className="text-blue-500" /> Technology Stack
              </h2>
              <div className="space-y-3">
                {stack.map(([name, mark, color]) => (
                  <div
                    key={name}
                    className="flex items-center gap-2.5 text-[14px]"
                  >
                    <span
                      className={`grid w-4 place-items-center font-bold ${color}`}
                    >
                      {mark}
                    </span>
                    <span className="flex-1 text-slate-600">{name}</span>
                    <span className="text-slate-500">
                      {
                        allTech.filter((t) =>
                          t
                            .toLowerCase()
                            .includes(name.toLowerCase().replace(" css", "")),
                        ).length
                      }
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[18px] font-semibold text-slate-900">
                <Clock3 size={18} className="text-blue-400" /> Recent Activity
              </h2>
              <div className="space-y-4">
                {activity.map(([title, time, color]) => (
                  <div key={title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-50 ${color}`}
                      />
                      <span className="mt-1 w-px flex-1 bg-slate-100" />
                    </div>
                    <div className="pb-1">
                      <p className="text-[14px] font-medium leading-relaxed text-slate-700">
                        {title}
                      </p>
                      <p className="mt-1 text-[13px] text-slate-400">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-400">
                <CircleHelp size={17} />
                <h3 className="text-[15px] font-semibold">Pro Tip</h3>
              </div>
              <p className="text-[14px] leading-relaxed text-slate-600">
                Keep your README updated, add screenshots, and document what you
                learned. A polished project is easier to showcase.
              </p>
              <button
                onClick={() =>
                  notify(
                    "README checklist: overview, setup instructions, features, screenshots, and tech stack.",
                  )
                }
                className="mt-3 flex items-center gap-1 text-[14px] font-semibold text-blue-400 hover:text-blue-500"
              >
                View README checklist <ArrowUpRight size={14} />
              </button>
            </Panel>
          </aside>
        </div>
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[14px] text-slate-400">
          <span>Student 360° · My Projects</span>
          <span>Project Data · Commit Changes</span>
        </footer>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  id="new-project-title"
                  className="text-[20px] font-medium text-slate-900"
                >
                  Create a project
                </h2>
                <p className="mt-1 text-[14px] text-slate-500">
                  Add a project to your Student 360° workspace.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-2 pt-1 pb-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={addProject} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium text-slate-700">
                  Project name *
                </span>
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Study Assistant"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium text-slate-700">
                  Image URL
                </span>
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Image url"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does your project do?"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium text-slate-700">
                  Technologies (comma-separated)
                </span>
                <input
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="React, TypeScript, PostgreSQL"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-400 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-blue-500"
                >
                  <Plus size={15} className="mr-1 inline" /> Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
