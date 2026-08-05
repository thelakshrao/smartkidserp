"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  Loader2,
  UserPlus,
  CheckCircle2,
  PlusSquare,
  UploadCloud,
  CalendarDays,
  Megaphone,
} from "lucide-react";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function TeacherDashboard({ profile }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [teacherDoc, setTeacherDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.teacherId && !profile?.uid) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "teachers"),
      where("authUid", "==", profile.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0];
          setTeacherDoc({ docId: d.id, ...d.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load teacher record:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [profile]);

  const mappings = teacherDoc?.classSubjectMappings || [];

  const [studentsInClasses, setStudentsInClasses] = useState([]);

  useEffect(() => {
    const classNames = mappings.map((m) => m.className).filter(Boolean);

    if (classNames.length === 0) {
      setStudentsInClasses([]);
      return;
    }

    const q = query(
      collection(db, "students"),
      where("className", "in", classNames.slice(0, 10)),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setStudentsInClasses(snap.docs.map((d) => d.data())),
      (err) => {
        console.error("Failed to load students for teacher's classes:", err);
        setStudentsInClasses([]);
      },
    );
    return () => unsub();
  }, [teacherDoc]);

  const stats = useMemo(() => {
    const totalClasses = mappings.length;
    const totalStudents = studentsInClasses.length;
    return { totalClasses, totalStudents };
  }, [mappings, studentsInClasses]);

  // Per-class breakdown for the "My Classes" list below.
  const studentCountByClass = useMemo(() => {
    const counts = {};
    studentsInClasses.forEach((s) => {
      if (s.className) counts[s.className] = (counts[s.className] || 0) + 1;
    });
    return counts;
  }, [studentsInClasses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <DashboardTopbar
        profile={profile}
        notificationCount={5}
        onMenuClick={() => setMobileNavOpen((o) => !o)}
      />
      <div className="flex flex-1 min-w-0">
        <Sidebar
          dashboardType="teacher"
          activeItem="Dashboard"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Welcome back, {teacherDoc?.fullName?.split(" ")[0] || "Teacher"}
                ! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Here's what's happening with your classes today.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={BookOpen}
              label="Total Classes"
              value={stats.totalClasses || "-"}
              sub="My Classes"
              bg="bg-violet-50"
              fg="text-violet-600"
            />
            <StatCard
              icon={Users}
              label="Across all classes"
              value={stats.totalStudents || "-"}
              sub="Total Students"
              bg="bg-emerald-50"
              fg="text-emerald-600"
            />
            <StatCard
              icon={ClipboardCheck}
              label="Not tracked yet"
              value="-"
              sub="Today's Classes"
              bg="bg-blue-50"
              fg="text-blue-600"
            />
            <StatCard
              icon={FileText}
              label="Not tracked yet"
              value="-"
              sub="Pending Assignments"
              bg="bg-amber-50"
              fg="text-amber-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Not tracked yet"
              value="-"
              sub="Attendance Today"
              bg="bg-rose-50"
              fg="text-rose-600"
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-[14px]">
                  My Classes
                </h2>
                <Link
                  href="/dashboard/myclasses"
                  className="text-[12px] font-semibold text-[#ff5722] hover:underline"
                >
                  View All
                </Link>
              </div>
              {mappings.length ? (
                <div className="flex flex-col gap-2.5">
                  {mappings.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                          <BookOpen size={14} />
                        </span>
                        <div>
                          <div className="text-[13px] font-bold text-gray-900">
                            Class {m.className}
                          </div>
                          <div className="text-[11.5px] text-gray-500">
                            {m.subjects?.join(", ") || "No subjects set"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11.5px] text-gray-400">
                        {studentCountByClass[m.className]
                          ? `${studentCountByClass[m.className]} Students`
                          : "0 Students"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-gray-400">
                  No classes assigned yet.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-[14px]">
                  Today's Timetable
                </h2>
                <span className="text-[11px] text-gray-300 font-semibold">
                  Not built yet
                </span>
              </div>
              <p className="text-[12.5px] text-gray-400">
                Timetable module isn't live yet — this will show your real daily
                schedule once Phase 5 is built.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-[14px] flex items-center gap-1.5">
                  <Megaphone size={14} className="text-gray-400" />
                  Recent Announcements
                </h2>
                <span className="text-[11px] text-gray-300 font-semibold">
                  Not built yet
                </span>
              </div>
              <p className="text-[12.5px] text-gray-400">
                School announcements will appear here once that module exists.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-[14px]">
                  Pending Assignments
                </h2>
                <span className="text-[11px] text-gray-300 font-semibold">
                  Not built yet
                </span>
              </div>
              <p className="text-[12.5px] text-gray-400">
                Once the Assignments module exists, ungraded submissions for
                your classes will show up here.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 text-[14px] mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <QuickAction
                  icon={UserPlus}
                  label="Add Student"
                  bg="bg-violet-500"
                  href="/dashboard/addstudents"
                />
                <QuickAction
                  icon={BookOpen}
                  label="View My Classes"
                  bg="bg-blue-500"
                  href="/dashboard/myclasses"
                />
                <QuickAction
                  icon={CheckCircle2}
                  label="Mark Attendance"
                  bg="bg-emerald-500"
                />
                <QuickAction
                  icon={PlusSquare}
                  label="Create Assignment"
                  bg="bg-amber-500"
                />
                <QuickAction
                  icon={UploadCloud}
                  label="Upload Material"
                  bg="bg-sky-500"
                />
                <QuickAction
                  icon={CalendarDays}
                  label="Class Timetable"
                  bg="bg-rose-500"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, bg, fg, className = "" }) {
  return (
    <div
      className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{sub}</span>
        <div
          className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${fg}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, bg, href }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-4 px-2 text-center hover:bg-gray-100 transition-colors cursor-pointer h-full">
      <span
        className={`w-9 h-9 rounded-lg ${bg} text-white flex items-center justify-center`}
      >
        <Icon size={16} />
      </span>
      <span className="text-[11px] font-semibold text-gray-700 leading-tight">
        {label}
      </span>
    </div>
  );
  return href ? (
    <Link href={href}>{content}</Link>
  ) : (
    <button className="w-full h-full" title="Coming soon">
      {content}
    </button>
  );
}
