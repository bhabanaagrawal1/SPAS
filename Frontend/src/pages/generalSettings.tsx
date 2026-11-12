import { useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Settings,
  UserRound,
  LockKeyhole,
  Globe,
  Bell,
  Palette,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CalendarDays,
  BarChart3,
  // Check,
} from "lucide-react";

// Reusable components are declared at module scope to keep their identity stable.

  // ==========================================
  // REUSABLE TOGGLE
  // ==========================================

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-1 shadow-inner transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 ${
      checked
        ? "bg-blue-400 hover:bg-blue-500"
        : "bg-slate-300 hover:bg-slate-400"
    }`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

  // ==========================================
  // REUSABLE SECTION HEADING
  // ==========================================

  const SectionHeading = ({
icon: Icon,
title,
description,
color = "blue",
  }: {
icon: LucideIcon;
title: string;
description: string;
color?: string;
  }) => {
const colors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-500",
  green: "bg-emerald-100 text-emerald-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
};

return (
  <div className="mb-5 flex items-center gap-4">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
        colors[color]
      }`}
    >
      <Icon size={23} />
    </div>

    <div className="min-w-0">
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="text-sm text-slate-500">
        {description}
      </p>
    </div>
  </div>
);
  };

  // ==========================================
  // REUSABLE SELECT COMPONENT
  // ==========================================

const PreferenceSelect = ({
  label,
  value,
  onChange,
  options,
  inputClass,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  inputClass: string;
}) => (
<div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
  <label className="text-sm font-medium text-slate-700">
    {label}
  </label>

  <div className="relative min-w-0">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} appearance-none pr-10`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <ChevronDown
      size={17}
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
    />
  </div>
</div>
  );

export default function GeneralSettings() {
  // ==========================================
  // ACCOUNT INFORMATION
  // ==========================================

  const [email, setEmail] = useState("bhabanaagrawal1111@gmail.com");
  const [newEmail, setNewEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  // ==========================================
  // PASSWORD & SECURITY
  // ==========================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // ==========================================
  // GENERAL PREFERENCES
  // ==========================================

  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  const [notifications, setNotifications] = useState({
    email: true,
    tasks: true,
    goals: true,
    weekly: true,
  });

  // ==========================================
  // APPEARANCE
  // ==========================================

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [compactLayout, setCompactLayout] = useState(false);

  // ==========================================
  // FEEDBACK
  // ==========================================

  const [message, setMessage] = useState("");

  // ==========================================
  // COMMON STYLES
  // ==========================================

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

  const cardClass =
    "h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6";

  // ==========================================
  // NOTIFICATION HANDLER
  // ==========================================

  const updateNotification = (
    key: keyof typeof notifications
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ==========================================
  // PASSWORD HANDLER
  // ==========================================

  const handlePasswordChange = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      setMessage("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setMessage("Your new password must be different from your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    // TODO: Connect your change-password API.
    // Send currentPassword and newPassword to the backend.
    setMessage("Password form validated. Connect your password API.");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ==========================================
  // EMAIL HANDLER
  // ==========================================

  const handleEmailChange = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (normalizedEmail === email.toLowerCase()) {
      setMessage("The new email address must be different from your current email.");
      return;
    }

    // TODO: Connect your change-email API.
    // Do not update the verified email here. Update it only after
    // the backend confirms that the new address has been verified.
    setMessage("Email change request is ready for API integration.");
    setNewEmail("");
    setEditingEmail(false);
  };

  // ==========================================
  // ACCOUNT ACTIONS
  // ==========================================

  const handleDeactivate = () => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account?"
    );

    if (confirmed) {
      // TODO: Connect account deactivation API.
      setMessage("Connect your account deactivation API.");
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "This action is permanent. Are you sure you want to delete your account?"
    );

    if (confirmed) {
      // TODO: Connect account deletion API.
      setMessage("Connect your account deletion API.");
    }
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="min-h-screen w-full min-w-0 bg-[#fcfcfd] px-5 py-7 md:px-7 lg:px-8">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="mb-7 flex min-h-[115px] items-center justify-between gap-5">

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Settings size={16} className="text-blue-300" />

            <span>Settings</span>
            <span>/</span>

            <span className="font-medium text-slate-700">
              General
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            General Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Manage your account preferences and customize your experience.
          </p>
        </div>

        {/* Header Illustration */}

        <div className="relative hidden h-[115px] w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 lg:flex">

          <Settings
            size={65}
            strokeWidth={1.5}
            className="text-blue-300"
          />

          <UserRound
            size={60}
            strokeWidth={1.5}
            className="text-blue-400"
          />

        </div>
      </div>

      {/* =====================================
          FEEDBACK MESSAGE
      ===================================== */}

      {message && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">

          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
            className="shrink-0 font-semibold hover:text-blue-400"
          >
            Dismiss
          </button>

        </div>
      )}

      {/* =====================================
          SETTINGS GRID

          Desktop: 2 columns
          Mobile: 1 column
      ===================================== */}

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">

        {/* ===================================
            1. ACCOUNT INFORMATION
        =================================== */}

        <section className={`${cardClass} min-h-[282px]`}>

          <SectionHeading
            icon={UserRound}
            title="Account Information"
            description="Your basic account details"
            color="blue"
          />

          <div className="border-t border-slate-100 pt-5">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  Email Address
                </p>

                <p className="mt-1 break-all text-base font-bold text-slate-900">
                  {email}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                Verified
              </span>

            </div>

            {editingEmail ? (

              <form
                onSubmit={handleEmailChange}
                className="mt-5 space-y-3"
              >
                <input
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter your new email address"
                  className={inputClass}
                  required
                />

                <p className="text-xs text-slate-500">
                  You will need to verify your new email address.
                </p>

                <div className="flex gap-3">

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-blue-400"
                  >
                    Continue
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmail(false);
                      setNewEmail("");
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                </div>
              </form>

            ) : (

              <button
                onClick={() => setEditingEmail(true)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <Mail size={19} />
                Change Email
              </button>

            )}

          </div>
        </section>

        {/* ===================================
            2. PASSWORD & SECURITY
        =================================== */}

        <section className={`${cardClass} min-h-[282px]`}>

          <SectionHeading
            icon={LockKeyhole}
            title="Password & Security"
            description="Keep your account secure"
          />

          <form
            onSubmit={handlePasswordChange}
            className="space-y-3"
          >

            {[
              {
                label: "Current Password",
                value: currentPassword,
                setter: setCurrentPassword,
              },
              {
                label: "New Password",
                value: newPassword,
                setter: setNewPassword,
              },
              {
                label: "Confirm New Password",
                value: confirmPassword,
                setter: setConfirmPassword,
              },
            ].map((field) => (

              <div key={field.label} className="relative">

                <input
                  type={showPasswords ? "text" : "password"}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.label}
                  aria-label={field.label}
                  autoComplete={
                    field.label === "Current Password"
                      ? "current-password"
                      : "new-password"
                  }
                  className={`${inputClass} pr-12`}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-400"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            ))}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-300 py-3 text-[14px] font-semibold text-white transition hover:bg-blue-400"
            >
              <LockKeyhole size={17} />
              Change Password
            </button>

          </form>

          <div className="mt-3 flex items-start gap-2 text-[14px] text-slate-500">
            <ShieldCheck
              size={16}
              className="shrink-0 text-emerald-600"
            />

            Use a strong password with at least 8 characters.
          </div>

        </section>

        {/* ===================================
            3. GENERAL PREFERENCES
        =================================== */}

        <section className={`${cardClass} min-h-[280px]`}>

          <SectionHeading
            icon={Globe}
            title="General Preferences"
            description="Set your general preferences"
            color="green"
          />

          <div className="space-y-3">

            <PreferenceSelect
              label="Language"
              value={language}
              onChange={setLanguage}
              options={[
                { label: "English", value: "English" },
                { label: "Hindi", value: "Hindi" },
                { label: "Odia", value: "Odia" },
              ]}
              inputClass={inputClass}
            />

            <PreferenceSelect
              label="Timezone"
              value={timezone}
              onChange={setTimezone}
              options={[
                {
                  label: "(GMT +05:30) India Standard Time",
                  value: "Asia/Kolkata",
                },
                {
                  label: "(GMT +00:00) UTC",
                  value: "UTC",
                },
                {
                  label: "(GMT -05:00) Eastern Time",
                  value: "America/New_York",
                },
              ]}
              inputClass={inputClass}
            />

            <PreferenceSelect
              label="Date Format"
              value={dateFormat}
              onChange={setDateFormat}
              options={[
                {
                  label: "DD/MM/YYYY",
                  value: "DD/MM/YYYY",
                },
                {
                  label: "MM/DD/YYYY",
                  value: "MM/DD/YYYY",
                },
                {
                  label: "YYYY-MM-DD",
                  value: "YYYY-MM-DD",
                },
              ]}
              inputClass={inputClass}
            />

          </div>
        </section>

        {/* ===================================
            4. NOTIFICATIONS
        =================================== */}

        <section className={`${cardClass} min-h-[280px]`}>

          <SectionHeading
            icon={Bell}
            title="Notifications"
            description="Choose what you want to be notified about"
            color="orange"
          />

          <div className="space-y-5">

            {[
              {
                key: "email" as const,
                icon: Mail,
                title: "Email Notifications",
                description: "Receive important updates via email",
              },
              {
                key: "tasks" as const,
                icon: CalendarDays,
                title: "Task Reminders",
                description: "Get reminded about upcoming tasks",
              },
              {
                key: "goals" as const,
                icon: CheckCircle2,
                title: "Goal Updates",
                description: "Be notified about your goal progress",
              },
              {
                key: "weekly" as const,
                icon: BarChart3,
                title: "Weekly Progress Reports",
                description: "Get a summary of your progress every week",
              },
            ].map((item) => {

              const Icon = item.icon;

              return (

                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4"
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <Icon
                      size={20}
                      className="shrink-0 text-slate-600"
                    />

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.description}
                      </p>

                    </div>
                  </div>

                  <Toggle
                    checked={notifications[item.key]}
                    onChange={() => updateNotification(item.key)}
                    label={item.title}
                  />

                </div>

              );
            })}

          </div>
        </section>

        {/* ===================================
            5. APPEARANCE
        =================================== */}

        <section className={`${cardClass} min-h-[148px]`}>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>

              <SectionHeading
                icon={Palette}
                title="Appearance"
                description="Customize the look and feel"
              />

              <div className="grid grid-cols-2 gap-2">

                {/* LIGHT MODE */}

                <button
                  onClick={() => setTheme("light")}
                  className={`rounded-xl border p-3 text-left transition ${
                    theme === "light"
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300"
                      : "border-slate-200 hover:border-blue-400"
                  }`}
                >

                  <div className="flex items-center gap-2">

                    <Sun
                      size={18}
                      className="text-blue-400"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      Light Mode
                    </span>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Bright and clean
                  </p>

                </button>

                {/* DARK MODE */}

                <button
                  onClick={() => setTheme("dark")}
                  className={`rounded-xl border p-3 text-left transition ${
                    theme === "dark"
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300"
                      : "border-slate-200 hover:border-blue-400"
                  }`}
                >

                  <div className="flex items-center gap-2">

                    <Moon
                      size={18}
                      className="text-slate-600"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      Dark Mode
                    </span>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Easy on your eyes
                  </p>

                </button>

              </div>

            </div>

            {/* COMPACT LAYOUT */}

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:min-w-[185px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Compact Layout
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Show a more compact sidebar and layout
                </p>
              </div>

              <Toggle
                checked={compactLayout}
                onChange={() => setCompactLayout(!compactLayout)}
                label="Compact Layout"
              />

            </div>

          </div>
        </section>

        {/* ===================================
            6. DANGER ZONE
        =================================== */}

        <section className="h-full min-h-[148px] rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm md:p-6">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">

              <AlertTriangle size={23} />

            </div>

            <div>
              <h2 className="text-lg font-bold text-red-600">
                Danger Zone
              </h2>

              <p className="text-sm text-red-500">
                These actions are irreversible. Please be careful.
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <button
              onClick={handleDeactivate}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              Deactivate Account
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Trash2 size={17} />
              Delete Account
            </button>

          </div>
        </section>

      </div>
    </div>
  );
}