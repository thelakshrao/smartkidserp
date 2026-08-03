"use client";
import Link from "next/link";
import {
  Home,
  Users,
  GraduationCap,
  UserCircle,
  ClipboardCheck,
  FileCheck2,
  FileText,
  IndianRupee,
  CalendarDays,
  BookOpen,
  Bus,
  Library,
  BarChart3,
  Mail,
  Bell,
  Download,
  Award,
  Activity,
  Settings,
  Headset,
  X,
} from "lucide-react";

const ROUTE_MAP = {
  Dashboard: "/dashboard",
  Students: "/dashboard/students",
  Teachers: "/dashboard/teachers",
  Attendance: "/dashboard/attendance",
  Exams: "/dashboard/exams",
  Fees: "/dashboard/fees",
  Timetable: "/dashboard/timetable",
  Homework: "/dashboard/homework",
  Transport: "/dashboard/transport",
  Library: "/dashboard/library",
  Reports: "/dashboard/reports",
  Messages: "/dashboard/messages",
  Settings: "/dashboard/settings",
  // student-only routes
  "My Profile": "/dashboard/profile",
  Assignments: "/dashboard/assignments",
  Grades: "/dashboard/grades",
  Notices: "/dashboard/notices",
  Downloads: "/dashboard/downloads",
  "My Activities": "/dashboard/activities",
};

const NAV_ITEMS = {
  admin: [
    { icon: Home, label: "Dashboard" },
    { icon: Users, label: "Students" },
    { icon: GraduationCap, label: "Teachers" },
    { icon: ClipboardCheck, label: "Attendance" },
    { icon: FileCheck2, label: "Exams" },
    { icon: IndianRupee, label: "Fees" },
    { icon: CalendarDays, label: "Timetable" },
    { icon: BookOpen, label: "Homework" },
    { icon: Bus, label: "Transport" },
    { icon: Library, label: "Library" },
    { icon: BarChart3, label: "Reports" },
    { icon: Mail, label: "Messages" },
    { icon: Settings, label: "Settings" },
  ],
  teacher: [
    { icon: Home, label: "Dashboard" },
    { icon: Users, label: "Students" },
    { icon: GraduationCap, label: "Teachers" },
    { icon: ClipboardCheck, label: "Attendance" },
    { icon: FileCheck2, label: "Exams" },
    { icon: CalendarDays, label: "Timetable" },
    { icon: BookOpen, label: "Homework" },
    { icon: Bus, label: "Transport" },
    { icon: Library, label: "Library" },
    { icon: BarChart3, label: "Reports" },
    { icon: Mail, label: "Messages" },
    { icon: Settings, label: "Settings" },
  ],
  student: [
    { icon: Home, label: "Dashboard" },
    { icon: UserCircle, label: "My Profile" },
    { icon: CalendarDays, label: "Timetable" },
    { icon: ClipboardCheck, label: "Attendance" },
    { icon: FileText, label: "Assignments" },
    { icon: FileCheck2, label: "Exams" },
    { icon: Award, label: "Grades" },
    { icon: IndianRupee, label: "Fees" },
    { icon: Library, label: "Library" },
    { icon: Bell, label: "Notices" },
    { icon: Mail, label: "Messages" },
    { icon: Download, label: "Downloads" },
    { icon: Activity, label: "My Activities" },
    { icon: Bus, label: "Transport" },
    { icon: Settings, label: "Settings" },
  ],
};

export default function DashboardSidebar({
  dashboardType = "admin",
  activeItem = "Dashboard",
  mobileOpen = false,
  onClose = () => {},
}) {
  const items = NAV_ITEMS[dashboardType] || [];

  const navContent = (
    <>
      <nav className="flex-1 flex flex-col gap-1 mt-2">
        {items.map(({ icon: Icon, label }) => {
          const isActive = label === activeItem;
          const href = ROUTE_MAP[label] || "/dashboard";

          return (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] text-left cursor-pointer transition-colors
                ${
                  isActive
                    ? "bg-orange-50 text-[#ff5722] font-semibold"
                    : "text-gray-600 font-medium hover:bg-gray-50"
                }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-gray-50 p-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Headset size={18} className="text-gray-500" />
          </span>
          <div className="text-[13px] font-bold text-gray-900">Need Help?</div>
        </div>
        <p className="text-[11.5px] text-gray-500 mb-3">Contact Support</p>
        <button className="text-[12px] font-semibold text-[#ff5722] bg-orange-50 rounded-lg px-3 py-1.5 cursor-pointer">
          Get Support
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-59 shrink-0 bg-white border-r border-gray-100 flex-col p-4 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col p-4 overflow-y-auto z-50">
            <button
              onClick={onClose}
              className="self-end text-gray-400 mb-2 cursor-pointer"
            >
              <X size={20} />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}