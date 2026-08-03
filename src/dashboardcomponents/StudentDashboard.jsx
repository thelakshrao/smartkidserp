"use client";
import { useState } from "react";
import {
  ClipboardCheck,
  FileText,
  FileCheck2,
  IndianRupee,
  Award,
  Megaphone,
  CalendarClock,
  Gift,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Library,
  Download,
  Images,
} from "lucide-react";
import DashboardTopbar from "./Dashboardtopbar";
import DashboardSidebar from "./Dashboardsidebar";

const TIMETABLE = [
  {
    time: "08:15 AM – 09:00 AM",
    subject: "Mathematics",
    teacher: "Mrs. Priya Sharma",
    room: "Room 12",
    status: "done",
  },
  {
    time: "09:00 AM – 09:45 AM",
    subject: "English",
    teacher: "Mr. Anil Verma",
    room: "Room 08",
    status: "done",
  },
  {
    time: "10:00 AM – 10:45 AM",
    subject: "Science",
    teacher: "Ms. Kavita Singh",
    room: "",
    status: "now",
  },
  {
    time: "11:00 AM – 11:45 AM",
    subject: "Social Science",
    teacher: "Mr. Rakesh Yadav",
    room: "Room 07",
    status: "upcoming",
  },
  {
    time: "12:00 PM – 12:45 PM",
    subject: "Hindi",
    teacher: "Ms. Neha Gupta",
    room: "Room 10",
    status: "upcoming",
  },
];

const ANNOUNCEMENTS = [
  {
    icon: Megaphone,
    iconBg: "bg-red-100 text-red-500",
    title: "School will remain closed on 21 July",
    detail: "Due to Heavy Rainfall",
    time: "2 hours ago",
  },
  {
    icon: CalendarClock,
    iconBg: "bg-emerald-100 text-emerald-500",
    title: "PTM Scheduled on 25 July",
    detail: "Timings: 10:00 AM – 02:00 PM",
    time: "1 day ago",
  },
  {
    icon: Gift,
    iconBg: "bg-violet-100 text-violet-500",
    title: "Annual Day Celebration",
    detail: "Mark your calendars!",
    time: "2 days ago",
  },
];

const RECENT_ASSIGNMENTS = [
  {
    title: "Maths Worksheet – Chapter 2",
    due: "22 Jul 2025",
    status: "Submitted",
  },
  { title: "Science Lab Report", due: "25 Jul 2025", status: "Pending" },
  {
    title: "Social Science Project",
    due: "30 Jul 2025",
    status: "Not Started",
  },
];

const STATUS_STYLES = {
  Submitted: "bg-emerald-50 text-emerald-600",
  Pending: "bg-amber-50 text-amber-600",
  "Not Started": "bg-gray-100 text-gray-500",
};

const EXAM_RESULTS = [
  {
    exam: "Unit Test – 1",
    subject: "Mathematics",
    marks: "88 / 100",
    grade: "A",
  },
  { exam: "Unit Test – 1", subject: "English", marks: "82 / 100", grade: "A" },
  { exam: "Unit Test – 1", subject: "Science", marks: "90 / 100", grade: "A+" },
  {
    exam: "Unit Test – 1",
    subject: "Social Science",
    marks: "85 / 100",
    grade: "A",
  },
];

const SCHOOL_NOTICES = [
  {
    icon: Megaphone,
    title: "School uniform will be mandatory from 1st August.",
    date: "18 Jul 2025",
  },
  {
    icon: CalendarClock,
    title: "Inter-House Competition on 30 July 2025.",
    date: "17 Jul 2025",
  },
];

const QUICK_LINKS = [
  {
    icon: BookOpen,
    label: "Study Materials",
    bg: "bg-violet-100 text-violet-600",
  },
  { icon: Library, label: "Library", bg: "bg-emerald-100 text-emerald-600" },
  { icon: Download, label: "Downloads", bg: "bg-blue-100 text-blue-600" },
  { icon: Award, label: "My Certificates", bg: "bg-amber-100 text-amber-600" },
  { icon: Images, label: "Activity Gallery", bg: "bg-rose-100 text-rose-600" },
];

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

function formatToday() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

function CardHeader({ title, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-[14.5px] text-gray-900">{title}</h3>
      {actionLabel && (
        <button className="text-[12px] font-semibold text-[#ff5722] flex items-center gap-1 cursor-pointer">
          {actionLabel} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export default function StudentDashboard({ profile }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = profile?.name?.split(" ")[0] || "Student";
  const className = profile?.className ? `Class ${profile.className}` : "—";
  const admissionNumber = profile?.admissionNumber || "—";

  const feeTotal = Number(profile?.feeTotal) || 0;
  const feePaid = Number(profile?.feePaid) || 0;
  const feePending = Number(profile?.feePending) || 0;
  const feeStatusLabel = profile?.feeStatus || "—";

  const classTeacher = "Mrs. Priya Sharma";
  const totalStudents = 28;
  const classLinks = [
    "Class Timetable",
    "Class Assignments",
    "Class Notices",
    "Class Materials",
  ];

  const stats = [
    {
      icon: ClipboardCheck,
      iconBg: "bg-violet-100 text-violet-600",
      label: "Attendance",
      value: "94%",
      sub: "This Month",
      action: "View Details",
    },
    {
      icon: FileText,
      iconBg: "bg-emerald-100 text-emerald-600",
      label: "Assignments Due",
      value: "3",
      action: "View Assignments",
    },
    {
      icon: FileCheck2,
      iconBg: "bg-blue-100 text-blue-600",
      label: "Upcoming Exams",
      value: "2",
      action: "View Exams",
    },
    {
      icon: IndianRupee,
      iconBg: "bg-amber-100 text-amber-600",
      label: "Fee Status",
      value: feeStatusLabel,
      action: "View Details",
    },
    {
      icon: Award,
      iconBg: "bg-rose-100 text-rose-600",
      label: "Overall Grade",
      value: "A",
      sub: "Very Good",
      action: "View Report",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <DashboardTopbar
        profile={profile}
        onMenuClick={() => setMobileOpen(true)}
      />

      <div className="flex">
        <DashboardSidebar
          dashboardType="student"
          activeItem="Dashboard"
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex-1 p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-bold text-[20px] text-gray-900">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-[13px] text-gray-500">
                Here's what's happening with your studies today.
              </p>
            </div>
            <button className="flex items-center gap-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2 cursor-pointer">
              <CalendarClock size={16} className="text-gray-400" />
              {formatToday()}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map(({ icon: Icon, iconBg, label, value, sub, action }) => (
              <Panel key={label}>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}
                >
                  <Icon size={19} />
                </div>
                <div className="text-[12px] text-gray-500 mb-1">{label}</div>
                <div className="text-[19px] font-bold text-gray-900 leading-tight">
                  {value}
                </div>
                {sub && (
                  <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
                )}
                <button className="text-[11.5px] font-semibold text-blue-600 mt-2.5 flex items-center gap-1 cursor-pointer">
                  {action} <ChevronRight size={12} />
                </button>
              </Panel>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel>
              <CardHeader
                title="Today's Timetable"
                actionLabel="View Full Timetable"
              />
              <div className="relative pl-4">
                <div className="absolute left-1.25 top-1 bottom-1 w-px bg-gray-100" />
                <div className="space-y-4">
                  {TIMETABLE.map((slot) => (
                    <div
                      key={slot.time}
                      className={`relative flex items-center justify-between rounded-xl px-3 py-2 -ml-3 ${
                        slot.status === "now" ? "bg-orange-50" : ""
                      }`}
                    >
                      <span
                        className={`absolute -left-3.25 w-2.5 h-2.5 rounded-full ${
                          slot.status === "now"
                            ? "bg-[#ff5722]"
                            : slot.status === "done"
                              ? "bg-emerald-400"
                              : "bg-blue-400"
                        }`}
                      />
                      <div>
                        <div className="text-[12px] text-gray-500">
                          {slot.time}
                        </div>
                        <div className="text-[13.5px] font-semibold text-gray-900">
                          {slot.subject}
                        </div>
                        <div className="text-[11.5px] text-gray-500">
                          {slot.teacher}
                        </div>
                      </div>
                      {slot.status === "now" ? (
                        <span className="text-[11px] font-bold text-[#ff5722]">
                          Now
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-gray-400">
                          {slot.room}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <CardHeader title="Announcements" actionLabel="View All" />
              <div className="space-y-4">
                {ANNOUNCEMENTS.map(
                  ({ icon: Icon, iconBg, title, detail, time }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                      >
                        <Icon size={16} />
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900 leading-snug">
                          {title}
                        </div>
                        <div className="text-[11.5px] text-gray-500">
                          {detail}
                        </div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">
                          {time}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </Panel>

            <Panel>
              <CardHeader title="My Class" actionLabel="View Class Details" />
              <div className="rounded-xl bg-violet-50 p-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">
                      {className}
                    </div>
                    <div className="text-[11.5px] text-gray-500">
                      Class Teacher: {classTeacher}
                    </div>
                    <div className="text-[11.5px] text-gray-500">
                      Total Students: {totalStudents}
                    </div>
                    <div className="text-[11.5px] text-gray-500">
                      Admission No: {admissionNumber}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {classLinks.map((label) => (
                  <button
                    key={label}
                    className="w-full flex items-center justify-between text-[13px] font-medium text-gray-700 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded-lg"
                  >
                    {label} <ChevronRight size={15} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel>
              <CardHeader title="Recent Assignments" actionLabel="View All" />
              <div className="space-y-3">
                {RECENT_ASSIGNMENTS.map((a) => (
                  <div
                    key={a.title}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-gray-900 truncate">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Due: {a.due}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10.5px] font-semibold rounded-full px-2.5 py-1 whitespace-nowrap ${STATUS_STYLES[a.status]}`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <CardHeader title="Latest Exam Results" actionLabel="View All" />
              <div className="text-[12px]">
                <div className="grid grid-cols-4 text-gray-400 font-medium mb-2 pb-2 border-b border-gray-100">
                  <span>Exam</span>
                  <span>Subject</span>
                  <span>Marks</span>
                  <span>Grade</span>
                </div>
                <div className="space-y-2.5">
                  {EXAM_RESULTS.map((r, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 items-center text-gray-700"
                    >
                      <span>{r.exam}</span>
                      <span>{r.subject}</span>
                      <span>{r.marks}</span>
                      <span className="font-semibold text-emerald-600">
                        {r.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="text-[12px] font-semibold text-[#ff5722] mt-4 flex items-center gap-1 cursor-pointer">
                View Detailed Report <ChevronRight size={13} />
              </button>
            </Panel>

            <Panel>
              <CardHeader title="Fee Overview" actionLabel="View Details" />
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="text-[11px] text-gray-500 mb-1">
                    Total Fees
                  </div>
                  <div className="text-[15px] font-bold text-gray-900">
                    {inr(feeTotal)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="text-[11px] text-gray-500 mb-1">Paid</div>
                  <div className="text-[15px] font-bold text-emerald-600">
                    {inr(feePaid)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="text-[11px] text-gray-500 mb-1">Due</div>
                  <div className="text-[15px] font-bold text-red-500">
                    {inr(feePending)}
                  </div>
                </div>
              </div>
              {feePending === 0 ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[12.5px] font-semibold rounded-xl px-3 py-2.5">
                  ✓ All fees paid. Thank you!
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-[12.5px] font-semibold rounded-xl px-3 py-2.5">
                  {inr(feePending)} pending — {feeStatusLabel}
                </div>
              )}
            </Panel>
          </div>

          {/* School Notices / Quick Links — MOCK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel>
              <CardHeader title="School Notices" actionLabel="View All" />
              <div className="space-y-3">
                {SCHOOL_NOTICES.map(({ icon: Icon, title, date }) => (
                  <div
                    key={title}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                        <Icon size={15} />
                      </span>
                      <span className="text-[13px] text-gray-700 truncate">
                        {title}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {date}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <CardHeader title="Quick Links" />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {QUICK_LINKS.map(({ icon: Icon, label, bg }) => (
                  <button
                    key={label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 py-3 px-1.5 cursor-pointer hover:bg-gray-50"
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="text-[10.5px] font-medium text-gray-600 text-center leading-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
