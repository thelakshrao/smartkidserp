"use client";
import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  GraduationCap,
  CheckCircle2,
  FileText,
  Megaphone,
  CalendarClock,
  UserPlus,
  UserCog,
  ClipboardCheck,
  FileBarChart2,
  ShieldPlus,
  IndianRupee,
  MapPin,
  X,
  Copy,
  Check,
  Loader2,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import DashboardSidebar from "@/dashboardcomponents/Dashboardsidebar";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import { useRouter } from "next/navigation";
import { db, createAdminLogin } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  logActivity,
  subscribeToRecentActivity,
  describeActivity,
  formatRelativeTime,
} from "@/lib/activityLog";

const ADMIN_ROLE_OPTIONS = [
  { value: "developer", label: "Developer" },
  { value: "owner", label: "Owner" },
  { value: "principal", label: "Principal" },
  { value: "admin", label: "Admin" },
  { value: "clerk", label: "Clerk" },
];

// Attendance Today has no real data source yet (waits on Phase B), so it
// stays as an honest placeholder rather than a fabricated live number.
const ATTENDANCE_TODAY_PLACEHOLDER = {
  label: "Attendance Today",
  value: "—",
  change: "Not tracked yet",
  icon: CheckCircle2,
  bg: "bg-[#e2f7ea]",
  fg: "text-[#2fa860]",
};

const ATTENDANCE_DATA = [
  { day: "Mon", pct: 78 },
  { day: "Tue", pct: 85 },
  { day: "Wed", pct: 72 },
  { day: "Thu", pct: 92.4 },
  { day: "Fri", pct: 65 },
  { day: "Sat", pct: 88 },
];
const EXAM_DATA = [
  { name: "Upcoming", value: 120, color: "#2f8fe0" },
  { name: "Ongoing", value: 80, color: "#2fa860" },
  { name: "Completed", value: 90, color: "#8c5cf0" },
  { name: "Pending Results", value: 30, color: "#f7941d" },
];
const UPCOMING_EVENTS = [
  {
    month: "JUL",
    day: "25",
    title: "Parent Teacher Meeting",
    time: "10:00 AM – 02:00 PM",
    location: "School Auditorium",
    bg: "bg-[#f7941d]",
  },
  {
    month: "JUL",
    day: "30",
    title: "Inter-House Competition",
    time: "09:00 AM Onwards",
    location: "School Ground",
    bg: "bg-[#8c5cf0]",
  },
  {
    month: "AUG",
    day: "05",
    title: "Independence Day Celebration",
    time: "08:00 AM Onwards",
    location: "School Campus",
    bg: "bg-[#2fa860]",
  },
];
const ANNOUNCEMENTS = [
  {
    title: "School will remain closed on 21 July",
    sub: "Due to Heavy Rainfall",
    when: "2 hours ago",
    icon: Megaphone,
    bg: "bg-[#fdece3]",
    fg: "text-[#ff5722]",
  },
  {
    title: "PTM Scheduled on 25 July",
    sub: "Timings: 10:00 AM – 02:00 PM",
    when: "1 day ago",
    icon: CalendarClock,
    bg: "bg-[#e2f7ea]",
    fg: "text-[#2fa860]",
  },
  {
    title: "Annual Day Celebration",
    sub: "Mark your calendars!",
    when: "2 days ago",
    icon: Megaphone,
    bg: "bg-[#efe7fb]",
    fg: "text-[#8c5cf0]",
  },
];

function generateDefaultPassword() {
  const year = new Date().getFullYear();
  const symbols = ["@", "#", "!", "$"];
  const sym1 = symbols[Math.floor(Math.random() * symbols.length)];
  const sym2 = symbols[Math.floor(Math.random() * symbols.length)];
  const rand = Math.floor(100 + Math.random() * 900);
  return `Skcs${sym1}${year}${sym2}${rand}`;
}

function formatINR(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

export default function AdminDashboard({ profile }) {
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAdminsList, setShowAdminsList] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  // A1 — live Recent Activities feed.
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    const unsub = subscribeToRecentActivity(setActivities, 6);
    return () => unsub();
  }, []);

  // A2 — live student count + fee aggregation (also feeds A3).
  const [students, setStudents] = useState([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "students"),
      (snap) => {
        setStudents(snap.docs.map((d) => d.data()));
        setStudentsLoaded(true);
      },
      (err) => {
        console.error("Failed to load students for dashboard stats:", err);
        setStudentsLoaded(true);
      },
    );
    return () => unsub();
  }, []);

  // A2 — live teacher count.
  const [teacherCount, setTeacherCount] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "teachers"),
      (snap) => setTeacherCount(snap.size),
      (err) => {
        console.error("Failed to load teachers for dashboard stats:", err);
        setTeacherCount(0);
      },
    );
    return () => unsub();
  }, []);

  // A3 — aggregate fee numbers from the live students list.
  const feeSummary = useMemo(() => {
    const totalFees = students.reduce(
      (sum, s) => sum + (Number(s.feeTotal) || 0),
      0,
    );
    const totalPaid = students.reduce(
      (sum, s) => sum + (Number(s.feePaid) || 0),
      0,
    );
    const totalPending = students.reduce((sum, s) => {
      if (s.feeStatus === "Paid") return sum;
      return sum + (Number(s.feePending) || 0);
    }, 0);
    const pct = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;
    return { totalFees, totalPaid, totalPending, pct };
  }, [students]);

  const stats = [
    {
      label: "Total Students",
      value: studentsLoaded ? students.length.toLocaleString("en-IN") : "…",
      icon: Users,
      bg: "bg-[#efe7fb]",
      fg: "text-[#8c5cf0]",
    },
    {
      label: "Total Teachers",
      value: teacherCount === null ? "…" : teacherCount.toLocaleString("en-IN"),
      icon: GraduationCap,
      bg: "bg-[#e3f0fd]",
      fg: "text-[#2f8fe0]",
    },
    ATTENDANCE_TODAY_PLACEHOLDER,
    {
      label: "Fees Collection",
      value: studentsLoaded ? formatINR(feeSummary.totalPaid) : "…",
      icon: FileText,
      bg: "bg-[#fdecd8]",
      fg: "text-[#f7941d]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <DashboardTopbar
        profile={profile}
        notificationCount={5}
        onMenuClick={() => setMobileNavOpen((o) => !o)}
      />
      <div className="flex flex-1 min-w-0">
        <DashboardSidebar
          dashboardType="admin"
          activeItem="Dashboard"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Welcome back, {profile?.name?.split(" ")[0] || "Admin"}! 👋
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Here&apos;s what&apos;s happening in your school today.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <button
                  onClick={() => setShowAdminsList(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ShieldCheck size={15} />
                  Higher Authority
                </button>
                <div className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map(({ label, value, change, icon: Icon, bg, fg }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[13px] text-gray-500 font-medium">
                      {label}
                    </span>
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
                    >
                      <Icon size={18} className={fg} />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {value}
                  </div>
                  {change && (
                    <div className="text-[12px] text-gray-400 font-medium">
                      {change}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 mb-5">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">
                    Attendance Overview
                  </h2>
                  <select className="text-[12.5px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={ATTENDANCE_DATA}>
                    <defs>
                      <linearGradient
                        id="attendanceFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2f8fe0"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2f8fe0"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f1f5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "#8a8f9c" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 12, fill: "#8a8f9c" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
                    <Area
                      type="monotone"
                      dataKey="pct"
                      stroke="#2f8fe0"
                      strokeWidth={2.5}
                      fill="url(#attendanceFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">
                    Recent Announcements
                  </h2>
                  <button className="text-[12.5px] font-semibold text-[#ff5722] cursor-pointer">
                    View All
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {ANNOUNCEMENTS.map(
                    ({ title, sub, when, icon: Icon, bg, fg }) => (
                      <div
                        key={title}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
                        >
                          <Icon size={16} className={fg} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-gray-900 truncate">
                            {title}
                          </div>
                          <div className="text-[12px] text-gray-500">{sub}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {when}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900 text-[13.5px]">
                    Exam Overview
                  </h2>
                  <button className="text-[12px] font-semibold text-[#ff5722] cursor-pointer">
                    View All
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 shrink-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={EXAM_DATA}
                          dataKey="value"
                          innerRadius={24}
                          outerRadius={39}
                          paddingAngle={2}
                        >
                          {EXAM_DATA.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-[13px] font-bold text-gray-900">
                        {EXAM_DATA.reduce((s, d) => s + d.value, 0)}
                      </div>
                      <div className="text-[8px] text-gray-500">Total</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11.5px]">
                    {EXAM_DATA.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-gray-500 truncate">{d.name}</span>
                        <span className="font-bold text-gray-900 ml-1">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-gray-900 text-[13.5px]">
                    Fee Collection
                  </h2>
                  <select className="text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer">
                    <option>This Month</option>
                  </select>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {studentsLoaded ? formatINR(feeSummary.totalPaid) : "…"}
                </div>
                <div className="text-[11px] text-gray-500 mb-2">
                  {studentsLoaded ? `${feeSummary.pct}% of total fees` : ""}
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div
                    className="h-full bg-[#2fa860] transition-all"
                    style={{ width: `${studentsLoaded ? feeSummary.pct : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11.5px]">
                  <div>
                    <div className="text-gray-500">Total Fees</div>
                    <div className="font-bold text-gray-900">
                      {studentsLoaded ? formatINR(feeSummary.totalFees) : "…"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500">Pending</div>
                    <div className="font-bold text-gray-900">
                      {studentsLoaded
                        ? formatINR(feeSummary.totalPending)
                        : "…"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm lg:row-span-2">
                <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction
                    icon={UserPlus}
                    label="Add Student"
                    bg="bg-[#efe7fb]"
                    fg="text-[#8c5cf0]"
                    onClick={() => router.push("/dashboard/addstudents")}
                  />
                  <QuickAction
                    icon={UserCog}
                    label="Add Teacher"
                    bg="bg-[#e3f0fd]"
                    fg="text-[#2f8fe0]"
                    onClick={() => router.push("/dashboard/addteachers")}
                  />
                  <QuickAction
                    icon={ClipboardCheck}
                    label="Mark Attendance"
                    bg="bg-[#e2f7ea]"
                    fg="text-[#2fa860]"
                  />
                  <QuickAction
                    icon={Megaphone}
                    label="Create Notice"
                    bg="bg-[#fdece3]"
                    fg="text-[#ff5722]"
                  />
                  <QuickAction
                    icon={FileBarChart2}
                    label="Generate Report"
                    bg="bg-[#e3f0fd]"
                    fg="text-[#2f8fe0]"
                  />
                  <QuickAction
                    icon={ShieldPlus}
                    label="Add Admin"
                    bg="bg-[#fdecec]"
                    fg="text-[#ed1c24]"
                    onClick={() => setShowAddAdmin(true)}
                  />
                </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">Recent Activities</h2>
                  <button className="text-[12.5px] font-semibold text-[#ff5722] cursor-pointer">
                    View All
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {activities.length === 0 ? (
                    <p className="text-[12.5px] text-gray-400 py-3">
                      No recent activity yet.
                    </p>
                  ) : (
                    activities.map((raw) => {
                      const {
                        text,
                        icon: Icon,
                        bg,
                        fg,
                      } = describeActivity(raw);
                      return (
                        <div
                          key={raw.id}
                          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}
                          >
                            <Icon size={15} className={fg} />
                          </span>
                          <div className="min-w-0 flex-1 text-[12.5px] text-gray-600 truncate">
                            {text}
                          </div>
                          <div className="text-[11px] text-gray-400 shrink-0">
                            {formatRelativeTime(raw.createdAt)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm mt-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Upcoming Events</h2>
                <button className="text-[12.5px] font-semibold text-[#ff5722] cursor-pointer">
                  View Calendar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {UPCOMING_EVENTS.map(
                  ({ month, day, title, time, location, bg }) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 p-3.5"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 text-white ${bg}`}
                      >
                        <span className="text-[9px] font-bold uppercase leading-none">
                          {month}
                        </span>
                        <span className="text-[15px] font-bold leading-tight">
                          {day}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-gray-900">
                          {title}
                        </div>
                        <div className="text-[11.5px] text-gray-500 mt-0.5">
                          {time}
                        </div>
                        <div className="flex items-center gap-1 text-[11.5px] text-gray-500 mt-0.5">
                          <MapPin size={11} />
                          {location}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {showAddAdmin && (
        <AddAdminModal
          profile={profile}
          onClose={() => setShowAddAdmin(false)}
        />
      )}
      {showAdminsList && (
        <AdminsListModal
          onClose={() => setShowAdminsList(false)}
          onAddNew={() => {
            setShowAdminsList(false);
            setShowAddAdmin(true);
          }}
        />
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, bg, fg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 p-4 text-center cursor-pointer
                 hover:-translate-y-0.5 hover:shadow-sm transition-all"
    >
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}
      >
        <Icon size={17} className={fg} />
      </span>
      <span className="text-[12px] font-semibold text-gray-900">{label}</span>
    </button>
  );
}

function AddAdminModal({ profile, onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    userId: "",
    role: "admin",
  });
  const [defaultPassword, setDefaultPassword] = useState(
    generateDefaultPassword(),
  );
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleCopyPassword() {
    navigator.clipboard?.writeText(defaultPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const authUid = await createAdminLogin({
        email: form.email,
        password: defaultPassword,
        name: form.name,
        phone: form.phone,
        userId: form.userId,
        role: form.role,
        createdBy: profile?.uid || profile?.name,
      });

      await setDoc(doc(db, "admins", authUid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        userId: form.userId,
        role: form.role,
        status: "active",
        createdBy: profile?.uid || profile?.name || null,
        createdAt: serverTimestamp(),
      });

      await logActivity("admin_added", {
        actorName: profile?.name,
        targetName: form.name,
        meta: { role: form.role },
      });

      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      console.error("Failed to create admin:", err);
      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email already has a login account. Use a different email.",
        );
      } else {
        setError(
          "Something went wrong while creating the account. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 cursor-pointer"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Add Admin</h2>
        <p className="text-[12.5px] text-gray-500 mb-5">
          Create a developer, owner, principal, admin, or clerk account.
        </p>

        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span className="text-[13px] font-semibold text-emerald-700">
              Account created successfully.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <Field
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <Field
              label="User ID"
              name="userId"
              value={form.userId}
              onChange={handleChange}
              required
              placeholder="e.g. ADM-0012"
            />
            <div>
              <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50
                           outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
              >
                {ADMIN_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3.5">
              <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                Default Password (Auto Generated)
              </label>
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white">
                <span className="text-[13px] font-semibold text-gray-900">
                  {defaultPassword}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-[#ff5722] cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                They'll be asked to change this on first login.
              </p>
            </div>

            {error && (
              <p className="text-[12.5px] font-semibold text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl py-3 text-[13.5px] font-bold text-white cursor-pointer
                         bg-[#ff5722] hover:bg-[#f4511e] transition-colors
                         shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AdminsListModal({ onClose, onAddNew }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAdmins(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load admins:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  async function handleDelete(admin) {
    const confirmed = window.confirm(
      `Remove ${admin.name} from admin access? This revokes their login access immediately, though their email will remain reserved in Authentication.`,
    );
    if (!confirmed) return;
    setDeletingId(admin.docId);
    try {
      await deleteDoc(doc(db, "admins", admin.docId));
      await deleteDoc(doc(db, "users", admin.docId));
    } catch (err) {
      console.error("Failed to remove admin:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-7 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 cursor-pointer"
        >
          <X size={20} />
        </button>
        <div className="flex items-center justify-between mb-1 pr-8">
          <h2 className="text-lg font-bold text-gray-900">Higher Authority</h2>
        </div>
        <p className="text-[12.5px] text-gray-500 mb-4">
          Everyone added through "Add New Admin" — developer, owner, principal,
          admin, or clerk access.
        </p>

        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white text-[13px] font-bold py-2.5 mb-4 cursor-pointer transition-colors shrink-0"
        >
          <ShieldPlus size={15} />
          Add New Admin
        </button>

        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-10">
              No admins added yet. Click "Add New Admin" to create the first
              one.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {admins.map((admin) => (
                <div
                  key={admin.docId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {admin.name?.slice(0, 2).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-gray-900 truncate">
                        {admin.name}
                      </div>
                      <div className="text-[11.5px] text-gray-500 truncate">
                        {admin.email} ·{" "}
                        {ADMIN_ROLE_OPTIONS.find((r) => r.value === admin.role)
                          ?.label || admin.role}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin.docId}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Remove admin"
                  >
                    {deletingId === admin.docId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50
                   placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
      />
    </div>
  );
}
