import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  // CircleAlert,
  Clock3,
  Code2,
  // Ellipsis,
  // Flame,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Bell,
  Pencil,
  Trash2,
  X,
  Zap,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  BarChart3,
  ClipboardList,
} from "lucide-react";

type TaskStatus = "To Do" | "In Progress" | "Completed";
type Priority = "High" | "Medium" | "Low";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
};

type Goal = {
  id: number;
  title: string;
  category: string;
  progress: number;
  deadline: string;
  icon: ReactNode;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Complete linked list problems",
    category: "DSA Practice",
    priority: "High",
    dueDate: "Today",
    status: "To Do",
  },
  {
    id: 2,
    title: "Finish dashboard responsive layout",
    category: "Web Development",
    priority: "High",
    dueDate: "Today",
    status: "In Progress",
  },
  {
    id: 3,
    title: "Review operating system notes",
    category: "Academics",
    priority: "Medium",
    dueDate: "Today",
    status: "Completed",
  },
  {
    id: 4,
    title: "Practice 2 binary tree questions",
    category: "DSA Practice",
    priority: "Medium",
    dueDate: "Tomorrow",
    status: "To Do",
  },
  {
    id: 5,
    title: "Read React documentation",
    category: "Web Development",
    priority: "Low",
    dueDate: "Tomorrow",
    status: "To Do",
  },
  {
    id: 6,
    title: "Update project README",
    category: "Projects",
    priority: "Low",
    dueDate: "Oct 31",
    status: "In Progress",
  },
];

const initialGoals: Goal[] = [
  {
    id: 1,
    title: "Master Data Structures",
    category: "DSA Practice",
    progress: 65,
    deadline: "Nov 10, 2026",
    icon: <Code2 size={17} />,
  },
  {
    id: 2,
    title: "Become a Frontend Developer",
    category: "Web Development",
    progress: 45,
    deadline: "Nov 20, 2026",
    icon: <BookOpen size={17} />,
  },
  {
    id: 3,
    title: "Build a Consistent Routine",
    category: "Personal Growth",
    progress: 80,
    deadline: "Nov 25, 2026",
    icon: <Users size={17} />,
  },
];

const deadlines = [
  {
    title: "Finish authentication module",
    subtitle: "Web Development Project",
    date: "Oct 31, 2026",
    priority: "High",
  },
  {
    title: "OS assignment",
    subtitle: "Operating Systems",
    date: "Nov 1, 2026",
    priority: "Medium",
  },
  {
    title: "Portfolio update",
    subtitle: "Personal Project",
    date: "Nov 5, 2026",
    priority: "Low",
  },
  {
    title: "DSA contest registration",
    subtitle: "Competitive Programming",
    date: "Nov 10, 2026",
    priority: "Info",
  },
];

const priorityStyle: Record<Priority, string> = {
  High: "bg-rose-50 text-rose-500",
  Medium: "bg-orange-50 text-orange-500",
  Low: "bg-emerald-50 text-emerald-600",
};

const statusStyle: Record<TaskStatus, string> = {
  "To Do": "bg-blue-50 text-blue-600",
  "In Progress": "bg-orange-50 text-orange-600",
  Completed: "bg-emerald-50 text-emerald-600",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toast, setToast] = useState("");

  const [taskForm, setTaskForm] = useState({
    title: "",
    category: "DSA Practice",
    priority: "Medium" as Priority,
    dueDate: "Today",
    status: "To Do" as TaskStatus,
  });

  const [goalForm, setGoalForm] = useState({
    title: "",
    category: "Personal Growth",
    progress: 0,
    deadline: "Nov 30, 2026",
  });

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.category.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Today" && task.dueDate === "Today") ||
      (activeFilter === "Upcoming" && task.dueDate !== "Today") ||
      (activeFilter === "Completed" && task.status === "Completed");

    return matchesSearch && matchesFilter;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  function openNewTask() {
    setEditingTask(null);
    setTaskForm({
      title: "",
      category: "DSA Practice",
      priority: "Medium",
      dueDate: "Today",
      status: "To Do",
    });
    setShowTaskModal(true);
  }

  function editTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
    });
    setShowTaskModal(true);
  }

  function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!taskForm.title.trim()) return;

    if (editingTask) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingTask.id
            ? { ...task, ...taskForm, title: taskForm.title.trim() }
            : task
        )
      );
      notify("Task updated successfully");
    } else {
      setTasks((previous) => [
        {
          id: Date.now(),
          ...taskForm,
          title: taskForm.title.trim(),
        },
        ...previous,
      ]);
      notify("Task added successfully");
    }

    setShowTaskModal(false);
    setEditingTask(null);
  }

  function deleteTask(id: number) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    notify("Task deleted");
  }

  function changeStatus(id: number, status: TaskStatus) {
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? { ...task, status } : task))
    );
  }

  function saveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!goalForm.title.trim()) return;

    setGoals((previous) => [
      ...previous,
      {
        id: Date.now(),
        title: goalForm.title.trim(),
        category: goalForm.category,
        progress: goalForm.progress,
        deadline: goalForm.deadline,
        icon: <Target size={17} />,
      },
    ]);

    setShowGoalModal(false);
    setGoalForm({
      title: "",
      category: "Personal Growth",
      progress: 0,
      deadline: "Nov 30, 2026",
    });

    notify("Goal added successfully");
  }

  function changeProgress(id: number, progress: number) {
    setGoals((previous) =>
      previous.map((goal) =>
        goal.id === id ? { ...goal, progress } : goal
      )
    );
  }

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const calendarDays = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function hasCalendarEvent(day: number) {
    return [3, 7, 12, 18, 23, 30].includes(day);
  }

  return (
    <main className="min-h-screen p-3 text-slate-800 sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">

        {/* Header */}
        <header className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[16px] font-medium uppercase tracking-wide text-blue-300">
              <ClipboardList size={16} />
              Tasks & Goals
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Your Daily Execution Planner
            </h1>

            <p className="mt-1 text-[16px] text-slate-500">
              Turn your plans and coding goals into actionable work.
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="rotate-[-10deg] text-center text-[17px] font-bold leading-4 text-blue-300">
              Better
              <br />
              Every
              <br />
              Single Day
            </div>

            <div className="flex h-[100px] w-[120px] items-center justify-center rounded-xl bg-blue-50">
              <GraduationCap size={42} className="text-blue-300" />
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Total Tasks"
            value={totalTasks + 6}
            subtitle="2 today"
            icon={<CalendarCheck size={24} />}
            color="blue"
            trend={<TrendingUp size={18} />}
          />

          <StatCard
            title="Completed"
            value={completedTasks + 2}
            subtitle="1 today"
            icon={<CheckCircle2 size={23} />}
            color="green"
          />

          <StatCard
            title="In Progress"
            value={inProgressTasks + 2}
            subtitle="0 today"
            icon={<Clock3 size={23} />}
            color="orange"
          />

          <StatCard
            title="Goals Progress"
            value={goals.length}
            subtitle="This week"
            icon={<Target size={23} />}
            color="purple"
          />
        </section>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Left column */}
          <div className="min-w-0 space-y-4">

            {/* Task list */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-300">
                    <ListTodo size={22} />
                  </div>

                  <div>
                    <h2 className="text-[21px] font-medium text-slate-800">
                      Tasks
                    </h2>
                    <p className="text-[14px] text-slate-400">
                      Manage your daily tasks and deadlines
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {["All", "Today", "Upcoming", "Completed"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition ${
                        activeFilter === filter
                          ? "bg-blue-300 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-blue-50"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}

                  <button
                    onClick={openNewTask}
                    aria-label="Add task"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-3">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your tasks"
                    className="w-full rounded-lg border border-slate-100 bg-slate-50 py-2 pl-8 pr-3 text-[14px] outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="border-y border-slate-100 text-[14px] text-slate-400">
                      <th className="w-8 py-2 font-medium">
                        <Circle size={16} />
                      </th>
                      <th className="py-2 font-medium">Task</th>
                      <th className="py-2 font-medium">Category</th>
                      <th className="py-2 font-medium">Priority</th>
                      <th className="py-2 font-medium">Due Date</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="group border-b border-slate-50 transition hover:bg-slate-50/70"
                      >
                        <td className="py-3 pr-2">
                          <button
                            onClick={() =>
                              changeStatus(
                                task.id,
                                task.status === "Completed"
                                  ? "To Do"
                                  : "Completed"
                              )
                            }
                            aria-label="Toggle task completion"
                            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                              task.status === "Completed"
                                ? "border-blue-300 bg-blue-300 text-white"
                                : "border-slate-300 hover:border-blue-400"
                            }`}
                          >
                            {task.status === "Completed" && (
                              <Check size={18} />
                            )}
                          </button>
                        </td>

                        <td className="py-3 pr-3">
                          <span
                            className={`text-[14px] font-medium ${
                              task.status === "Completed"
                                ? "text-slate-400 line-through"
                                : "text-slate-700"
                            }`}
                          >
                            {task.title}
                          </span>
                        </td>

                        <td className="py-3 pr-2">
                          <span className="whitespace-nowrap rounded-full bg-indigo-50 px-3 py-1.5 text-[12px] font-medium text-blue-400">
                            {task.category}
                          </span>
                        </td>

                        <td className="py-3 pr-2">
                          <span
                            className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${priorityStyle[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td className="whitespace-nowrap py-3 pr-2 text-[14px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={15} />
                            {task.dueDate}
                          </span>
                        </td>

                        <td className="py-3 pr-2">
                          <select
                            value={task.status}
                            onChange={(event) =>
                              changeStatus(
                                task.id,
                                event.target.value as TaskStatus
                              )
                            }
                            aria-label={`Status of ${task.title}`}
                            className={`max-w-[105px] rounded-full border-0 px-3.5 py-2 text-[12px] font-semibold outline-none ${statusStyle[task.status]}`}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>

                        <td className="py-3">
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                              onClick={() => editTask(task)}
                              aria-label="Edit task"
                              className="rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-blue-400"
                            >
                              <Pencil size={18} />
                            </button>

                            <button
                              onClick={() => deleteTask(task.id)}
                              aria-label="Delete task"
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredTasks.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-[20px] text-slate-400"
                        >
                          No tasks found. Add a new task to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Kanban and Goals */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              {/* Kanban board */}
              <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-300">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <h2 className="text-[22px] font-medium">Task Board</h2>
                      <p className="text-[14px] text-slate-400">
                        Visualize your workflow
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={openNewTask}
                    className="flex items-center gap-1 rounded-full border border-blue-100 px-3 py-1.5 text-[14px] font-semibold text-blue-300 hover:bg-blue-50"
                  >
                    <Plus size={15} />
                    Add Task
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        name: "To Do",
                        color: "blue",
                        tasks: tasks.filter((task) => task.status === "To Do"),
                      },
                      {
                        name: "In Progress",
                        color: "purple",
                        tasks: tasks.filter(
                          (task) => task.status === "In Progress"
                        ),
                      },
                      {
                        name: "Done",
                        color: "green",
                        tasks: tasks.filter(
                          (task) => task.status === "Completed"
                        ),
                      },
                    ] as const
                  ).map((column) => (
                    <div
                      key={column.name}
                      className={`min-w-0 rounded-xl p-2 ${
                        column.color === "blue"
                          ? "bg-blue-50/70"
                          : column.color === "purple"
                            ? "bg-violet-50/70"
                            : "bg-emerald-50/70"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-1">
                        <h3 className="text-[18px] font-medium text-slate-600">
                          {column.name}
                        </h3>
                        <span className="rounded bg-white/80 px-2 py-0.5 text-[15px] text-slate-500">
                          {column.tasks.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {column.tasks.map((task) => (
                          <article
                            key={task.id}
                            className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm"
                          >
                            <p className="break-words text-[14px] font-medium leading-5 text-slate-700">
                              {task.title}
                            </p>

                            <span
                              className={`mt-3 inline-block rounded px-2.5 py-1.5 text-[13px] ${priorityStyle[task.priority]}`}
                            >
                              {task.priority}
                            </span>

                            <select
                              aria-label={`Move ${task.title}`}
                              value={task.status}
                              onChange={(event) =>
                                changeStatus(
                                  task.id,
                                  event.target.value as TaskStatus
                                )
                              }
                              className="mt-2 w-full rounded border border-slate-100 bg-slate-50 px-1 py-1 text-[13px] text-slate-500 outline-none"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Done</option>
                            </select>
                          </article>
                        ))}

                        {column.tasks.length === 0 && (
                          <p className="py-4 text-center text-[9px] text-slate-400">
                            No tasks
                          </p>
                        )}
                      </div>

                      <button
                        onClick={openNewTask}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 bg-white/60 py-2 text-[13px] text-slate-500 hover:text-blue-400"
                      >
                        <Plus size={15} />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Goals */}
              <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-50 p-2 text-blue-400">
                      <Target size={22} />
                    </div>
                    <div>
                      <h2 className="text-[22px] font-medium">Goals</h2>
                      <p className="text-[14px] text-slate-400">
                        Track your progress and achieve milestones
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="text-[15px] font-medium text-blue-300 hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-300 to-blue-300 text-white">
                          {goal.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="break-words text-[16px] font-semibold text-slate-700">
                              {goal.title}
                            </h3>
                            <span className="text-[16px] font-semibold text-slate-600">
                              {goal.progress}%
                            </span>
                          </div>

                          <p className="mt-1 text-[13px] text-slate-400">
                            {goal.category}
                          </p>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-200 to-blue-300 transition-all"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 flex justify-end">
                        <select
                          value={goal.progress}
                          onChange={(event) =>
                            changeProgress(
                              goal.id,
                              Number(event.target.value)
                            )
                          }
                          aria-label={`Update ${goal.title} progress`}
                          className="max-w-[95px] rounded border border-slate-100 bg-white px-1 py-1 text-[13px] text-slate-500 outline-none"
                        >
                          <option value={0}>0%</option>
                          <option value={20}>20%</option>
                          <option value={40}>40%</option>
                          <option value={45}>45%</option>
                          <option value={60}>60%</option>
                          <option value={65}>65%</option>
                          <option value={80}>80%</option>
                          <option value={100}>100%</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowGoalModal(true)}
                  className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-indigo-200 py-2 text-[14px] font-semibold text-blue-300 hover:bg-blue-50"
                >
                  <Plus size={16} />
                  Add New Goal
                </button>
              </section>
            </div>
          </div>

          {/* Right column */}
          <aside className="space-y-4">

            {/* Calendar */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={22} className="text-blue-300" />
                  <h2 className="text-[20px] font-medium">Calendar</h2>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setMonth(new Date(year, monthIndex - 1, 1))
                    }
                    aria-label="Previous month"
                    className="rounded p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <span className="text-[14px] font-medium text-slate-500">
                    {monthLabel}
                  </span>

                  <button
                    onClick={() =>
                      setMonth(new Date(year, monthIndex + 1, 1))
                    }
                    aria-label="Next month"
                    className="rounded p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-2 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <span
                      key={day}
                      className="pb-1 text-[14px] font-medium text-slate-400"
                    >
                      {day}
                    </span>
                  )
                )}

                {calendarDays.map((day, index) => (
                  <div key={`${day}-${index}`} className="flex justify-center">
                    {day ? (
                      <button
                        onClick={() => {
                          const selected = tasks.filter(
                            (task) => task.dueDate === String(day)
                          );
                          notify(
                            selected.length
                              ? `${selected.length} task(s) scheduled`
                              : `Selected ${monthLabel} ${day}`
                          );
                        }}
                        className={`relative flex h-6 w-6 items-center justify-center rounded-md text-[14px] transition ${
                          day === 30 && monthIndex === 9
                            ? "bg-blue-300 font-bold text-white"
                            : hasCalendarEvent(day)
                              ? "bg-blue-50 font-semibold text-blue-400"
                              : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                        {hasCalendarEvent(day) &&
                          !(day === 30 && monthIndex === 9) && (
                            <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-500" />
                          )}
                      </button>
                    ) : (
                      <span className="h-7 w-7" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <Legend color="bg-blue-500" label="Tasks" />
                <Legend color="bg-violet-500" label="Goals" />
                <Legend color="bg-orange-400" label="Deadlines" />
              </div>
            </section>

            {/* Upcoming deadlines */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={22} className="text-blue-300" />
                  <h2 className="text-[19px] font-medium">Upcoming Deadlines</h2>
                </div>

                <button
                  onClick={() => notify("Showing all upcoming deadlines")}
                  className="text-[14px] font-semibold text-blue-300 hover:underline"
                >
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {deadlines.map((deadline) => (
                  <div key={deadline.title} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        deadline.priority === "High"
                          ? "bg-rose-500"
                          : deadline.priority === "Medium"
                            ? "bg-orange-400"
                            : deadline.priority === "Low"
                              ? "bg-emerald-500"
                              : "bg-violet-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-[16px] font-medium text-slate-700">
                        {deadline.title}
                      </h3>
                      <p className="mt-0.5 text-[14px] text-slate-400">
                        {deadline.subtitle}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {deadline.date}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium ${
                        deadline.priority === "High"
                          ? "bg-rose-50 text-rose-500"
                          : deadline.priority === "Medium"
                            ? "bg-orange-50 text-orange-500"
                            : deadline.priority === "Low"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      {deadline.priority}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick actions */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Zap size={22} className="text-blue-300" />
                <h2 className="text-[20px] font-medium">Quick Actions</h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <QuickAction
                  label="Add Task"
                  icon={<Plus size={20} />}
                  color="blue"
                  onClick={openNewTask}
                />

                <QuickAction
                  label="Add Goal"
                  icon={<Target size={20} />}
                  color="purple"
                  onClick={() => setShowGoalModal(true)}
                />

                <QuickAction
                  label="View Calendar"
                  icon={<CalendarDays size={20} />}
                  color="green"
                  onClick={() => {
                    setMonth(new Date(2026, 9, 1));
                    notify("Calendar is shown above");
                  }}
                />

                <QuickAction
                  label="View Progress"
                  icon={<BarChart3 size={20} />}
                  color="orange"
                  onClick={() =>
                    notify(
                      `${completedTasks} of ${totalTasks} tasks completed`
                    )
                  }
                />
              </div>
            </section>

            {/* Motivational card */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 p-4 text-white shadow-sm">
              <div className="relative z-10 flex items-start gap-3">
                <div className="rounded-xl bg-white/15 p-2.5">
                  <Target size={21} />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold">Keep going!</h2>
                  <p className="mt-1 max-w-[180px] text-[12px] leading-4 text-blue-800">
                    Be consistent.
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-3 rotate-[-12deg] text-white/30">
                <TrendingUp size={95} />
              </div>

              <div className="absolute right-4 top-3 text-blue-800">
                <Trophy size={17} />
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Task modal */}
      {showTaskModal && (
        <Modal
          title={editingTask ? "Edit Task" : "Add New Task"}
          onClose={() => setShowTaskModal(false)}
        >
          <form onSubmit={saveTask} className="space-y-4">
            <Field label="Task name">
              <input
                required
                autoFocus
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, title: event.target.value })
                }
                placeholder="Enter your task"
                className={inputStyle}
              />
            </Field>

            <Field label="Category">
              <select
                value={taskForm.category}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, category: event.target.value })
                }
                className={inputStyle}
              >
                <option>DSA Practice</option>
                <option>Web Development</option>
                <option>Academics</option>
                <option>Projects</option>
                <option>Personal Growth</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      priority: event.target.value as Priority,
                    })
                  }
                  className={inputStyle}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </Field>

              <Field label="Due date">
                <select
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, dueDate: event.target.value })
                  }
                  className={inputStyle}
                >
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>Oct 31</option>
                  <option>Nov 1</option>
                  <option>Nov 5</option>
                  <option>Nov 10</option>
                </select>
              </Field>
            </div>

            <Field label="Status">
              <select
                value={taskForm.status}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    status: event.target.value as TaskStatus,
                  })
                }
                className={inputStyle}
              >
                <option>To Do</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                {editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Goal modal */}
      {showGoalModal && (
        <Modal title="Add New Goal" onClose={() => setShowGoalModal(false)}>
          <form onSubmit={saveGoal} className="space-y-4">
            <Field label="Goal name">
              <input
                required
                autoFocus
                value={goalForm.title}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, title: event.target.value })
                }
                placeholder="Enter your goal"
                className={inputStyle}
              />
            </Field>

            <Field label="Category">
              <select
                value={goalForm.category}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, category: event.target.value })
                }
                className={inputStyle}
              >
                <option>DSA Practice</option>
                <option>Web Development</option>
                <option>Academics</option>
                <option>Projects</option>
                <option>Personal Growth</option>
              </select>
            </Field>

            <Field label={`Progress: ${goalForm.progress}%`}>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={goalForm.progress}
                onChange={(event) =>
                  setGoalForm({
                    ...goalForm,
                    progress: Number(event.target.value),
                  })
                }
                className="w-full accent-indigo-600"
              />
            </Field>

            <Field label="Deadline">
              <input
                value={goalForm.deadline}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, deadline: event.target.value })
                }
                className={inputStyle}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Create Goal
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </main>
  );
}

/* Statistics card */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "purple";
  trend?: ReactNode;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-500",
    orange: "bg-orange-50 text-orange-500",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[22px] font-medium text-slate-500 sm:text-xs">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-2 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-2 flex items-center gap-1 text-[16px] text-slate-400">
        {trend && <span className="text-emerald-500">{trend}</span>}
        <span className="text-emerald-500">{subtitle}</span>
      </p>
    </article>
  );
}

/* Calendar legend */
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-[14px] text-slate-500">{label}</span>
    </div>
  );
}

/* Quick action button */
function QuickAction({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  color: "blue" | "purple" | "green" | "orange";
  onClick: () => void;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    green: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  };

  return (
    <button
      onClick={onClick}
      className={`flex min-h-10 items-center gap-2 rounded-xl p-2 text-left text-[14px] font-semibold transition ${colors[color]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* Reusable modal */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={17} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* Reusable form field */
function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";