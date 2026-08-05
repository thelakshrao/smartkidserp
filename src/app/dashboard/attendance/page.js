"use client";
import { useState, useEffect, useMemo } from "react";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  todayDateString,
  isFutureDate,
  getAttendanceRecord,
  saveAttendance,
  ATTENDANCE_STATUSES,
} from "@/lib/attendance";
import {
  Loader2,
  Check,
  CalendarDays,
  Users,
  ShieldAlert,
  UserCheck,
  UserX,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const STATUS_CONFIG = {
  Present: {
    color: "#2fa860",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    activeBtn: "bg-emerald-500 text-white border-emerald-500 shadow-sm",
  },
  Absent: {
    color: "#ed1c24",
    bg: "bg-rose-50",
    text: "text-rose-600",
    activeBtn: "bg-rose-500 text-white border-rose-500 shadow-sm",
  },
  Leave: {
    color: "#f7941d",
    bg: "bg-amber-50",
    text: "text-amber-600",
    activeBtn: "bg-amber-500 text-white border-amber-500 shadow-sm",
  },
};
const INACTIVE_BTN =
  "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50";

const ADMIN_ROLES = ["developer", "owner", "principal", "admin", "clerk"];
const CLASS_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

function sidebarTypeFor(role) {
  if (role === "teacher") return "teacher";
  if (role === "student" || role === "parent") return "student";
  return "admin";
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

const teacherMappingsCache = new Map();

export default function AttendancePage() {
  const { profile } = useAuth?.() || {};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdmin = ADMIN_ROLES.includes(profile?.role);
  const isTeacher = profile?.role === "teacher";
  const hasAccess = isAdmin || isTeacher;
  const dashboardType = sidebarTypeFor(profile?.role);

  const [teacherMappings, setTeacherMappings] = useState([]);
  const [loadingMappings, setLoadingMappings] = useState(true);

  useEffect(() => {
    async function loadTeacherMappings() {
      if (!isTeacher || !profile?.uid) {
        setLoadingMappings(false);
        return;
      }
      if (teacherMappingsCache.has(profile.uid)) {
        setTeacherMappings(teacherMappingsCache.get(profile.uid));
        setLoadingMappings(false);
        return;
      }
      try {
        const q = query(
          collection(db, "teachers"),
          where("authUid", "==", profile.uid),
        );
        const snap = await getDocs(q);
        const mappings = snap.empty
          ? []
          : snap.docs[0].data().classSubjectMappings || [];
        teacherMappingsCache.set(profile.uid, mappings);
        setTeacherMappings(mappings);
      } catch (err) {
        console.error("Failed to load teacher's classes:", err);
      } finally {
        setLoadingMappings(false);
      }
    }
    if (hasAccess) loadTeacherMappings();
    else setLoadingMappings(false);
  }, [isTeacher, profile, hasAccess]);

  const classOptionsForTeacher = useMemo(
    () => teacherMappings.map((m) => m.className).filter(Boolean),
    [teacherMappings],
  );

  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(todayDateString());

  const subjectOptionsForClass = useMemo(() => {
    if (isAdmin) return [];
    const mapping = teacherMappings.find((m) => m.className === className);
    return mapping?.subjects || [];
  }, [teacherMappings, className, isAdmin]);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  function clearLoadedClass() {
    setStudents([]);
    setStatusMap({});
    setIsEditingExisting(false);
    setSaveSuccess(false);
    setSaveError("");
  }

  useEffect(() => {
    setSubject("");
    clearLoadedClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  useEffect(() => {
    clearLoadedClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, date]);

  async function handleLoadClass() {
    if (!className || !date) return;
    if (isFutureDate(date)) {
      setSaveError("Attendance cannot be marked for a future date.");
      return;
    }
    if (isTeacher && !classOptionsForTeacher.includes(className)) {
      setSaveError("You are not assigned to this class.");
      return;
    }

    setSaveError("");
    setSaveSuccess(false);
    setLoadingStudents(true);
    try {
      const studentsQuery = query(
        collection(db, "students"),
        where("className", "==", className),
      );

      const [studentsSnap, existing] = await Promise.all([
        getDocs(studentsQuery),
        getAttendanceRecord(className, subject, date),
      ]);

      const studentList = studentsSnap.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }));
      studentList.sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || ""),
      );
      setStudents(studentList);

      if (existing) {
        setStatusMap(existing.records || {});
        setIsEditingExisting(true);
      } else {
        setStatusMap({});
        setIsEditingExisting(false);
      }
    } catch (err) {
      console.error("Failed to load class for attendance:", err);
      setSaveError("Couldn't load students for this class. Please try again.");
    } finally {
      setLoadingStudents(false);
    }
  }

  function setStudentStatus(studentId, status) {
    setStatusMap((m) => ({ ...m, [studentId]: status }));
  }

  function markAllAs(status) {
    const next = {};
    students.forEach((s) => (next[s.docId] = status));
    setStatusMap(next);
  }

  async function handleSave() {
    setSaveError("");

    const unmarked = students.filter((s) => !statusMap[s.docId]).length;
    if (unmarked > 0) {
      setSaveError(
        `${unmarked} student${unmarked > 1 ? "s haven't" : " hasn't"} been marked yet. Please mark everyone before saving.`,
      );
      return;
    }

    setSaving(true);
    try {
      await saveAttendance({
        className,
        subject,
        date,
        records: statusMap,
        markedBy: profile?.uid,
        markedByName: profile?.name,
        markedByRole: isAdmin ? "admin" : "teacher",
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setSaveError(
        err.message || "Couldn't save attendance. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(() => {
    const values = Object.values(statusMap);
    const total = values.length;
    const present = values.filter((v) => v === "Present").length;
    const absent = values.filter((v) => v === "Absent").length;
    const leave = values.filter((v) => v === "Leave").length;
    return { total, present, absent, leave };
  }, [statusMap]);

  const unmarkedCount = students.length - Object.keys(statusMap).length;

  const donutData = useMemo(
    () =>
      [
        {
          name: "Present",
          value: summary.present,
          color: STATUS_CONFIG.Present.color,
        },
        {
          name: "Absent",
          value: summary.absent,
          color: STATUS_CONFIG.Absent.color,
        },
        {
          name: "Leave",
          value: summary.leave,
          color: STATUS_CONFIG.Leave.color,
        },
      ].filter((d) => d.value > 0),
    [summary],
  );

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
        <DashboardTopbar
          profile={profile}
          notificationCount={5}
          onMenuClick={() => setMobileNavOpen((o) => !o)}
        />
        <div className="flex flex-1 min-w-0">
          <Sidebar
            dashboardType={dashboardType}
            activeItem="Attendance"
            mobileOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md flex flex-col items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                <ShieldAlert size={22} />
              </span>
              <p className="text-[14px] font-semibold text-gray-900">
                You don't have access to this page.
              </p>
              <p className="text-[12.5px] text-gray-500">
                Marking attendance is available to teachers and school
                administrators only.
              </p>
            </div>
          </main>
        </div>
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
          dashboardType={dashboardType}
          activeItem="Attendance"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-5 sm:p-8">
          <div className="text-[13px] text-gray-500 flex items-center gap-1.5 mb-2">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-semibold">Attendance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Mark Attendance
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isAdmin
              ? "Mark or correct attendance for any class, on today or a past date."
              : "Mark attendance for your assigned classes — today only."}
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                  Class
                </label>
                {loadingMappings ? (
                  <div className="w-full h-[42px] rounded-xl bg-gray-100 animate-pulse" />
                ) : (
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
                  >
                    <option value="">Select class</option>
                    {(isAdmin ? CLASS_OPTIONS : classOptionsForTeacher).map(
                      (c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                  Subject {isAdmin && "(optional)"}
                </label>
                {isAdmin ? (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. General"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />
                ) : (
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!className}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">General</option>
                    {subjectOptionsForClass.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  max={todayDateString()}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-70"
                />
                {!isAdmin && (
                  <p className="text-[10.5px] text-gray-400 mt-1">
                    Teachers can only mark today's attendance.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleLoadClass}
              disabled={!className || loadingStudents}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#ff5722] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#f4511e] transition-colors cursor-pointer shadow-sm disabled:opacity-60"
            >
              {loadingStudents && (
                <Loader2 size={15} className="animate-spin" />
              )}
              {loadingStudents ? "Loading..." : "Load Class"}
            </button>

            {saveError && (
              <p className="text-[12.5px] font-semibold text-red-600 mt-3">
                {saveError}
              </p>
            )}
          </div>

          {students.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <StatCard
                  icon={Users}
                  label="Total Students"
                  value={students.length}
                  bg="bg-violet-50"
                  fg="text-violet-600"
                />
                <StatCard
                  icon={UserCheck}
                  label="Present"
                  value={summary.present}
                  pct={
                    students.length
                      ? Math.round((summary.present / students.length) * 100)
                      : 0
                  }
                  bg={STATUS_CONFIG.Present.bg}
                  fg={STATUS_CONFIG.Present.text}
                />
                <StatCard
                  icon={UserX}
                  label="Absent"
                  value={summary.absent}
                  pct={
                    students.length
                      ? Math.round((summary.absent / students.length) * 100)
                      : 0
                  }
                  bg={STATUS_CONFIG.Absent.bg}
                  fg={STATUS_CONFIG.Absent.text}
                />
                <StatCard
                  icon={Clock3}
                  label="Leave"
                  value={summary.leave}
                  pct={
                    students.length
                      ? Math.round((summary.leave / students.length) * 100)
                      : 0
                  }
                  bg={STATUS_CONFIG.Leave.bg}
                  fg={STATUS_CONFIG.Leave.text}
                />
              </div>

              {unmarkedCount > 0 && (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-[12.5px] font-semibold rounded-xl px-4 py-2.5 mb-5">
                  {unmarkedCount} student{unmarkedCount > 1 ? "s" : ""} not
                  marked yet — select Present, Absent, or Leave for everyone
                  before saving.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-bold text-gray-900">
                        Class {className} · {subject || "General"}
                      </span>
                      <span className="text-[11.5px] text-gray-400 flex items-center gap-1">
                        <CalendarDays size={12} /> {date}
                      </span>
                      {isEditingExisting && (
                        <span className="text-[10.5px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Editing existing record
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-[11.5px] font-semibold text-gray-500 mr-1">
                      Quick Mark All:
                    </span>
                    <button
                      onClick={() => markAllAs("Present")}
                      className="flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={13} /> All Present
                    </button>
                    <button
                      onClick={() => markAllAs("Absent")}
                      className="flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <UserX size={13} /> All Absent
                    </button>
                    <button
                      onClick={() => markAllAs("Leave")}
                      className="flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <Clock3 size={13} /> All Leave
                    </button>
                  </div>

                  <div className="flex flex-col divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                    {students.map((s, idx) => (
                      <div
                        key={s.docId}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] text-gray-400 font-semibold w-5 shrink-0 text-right">
                            {idx + 1}
                          </span>
                          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-[12px] font-bold shrink-0">
                            {initials(s.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-gray-900 truncate">
                              {s.fullName}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Admission No: {s.admissionNumber || "-"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ATTENDANCE_STATUSES.map((status) => (
                            <button
                              key={status}
                              onClick={() => setStudentStatus(s.docId, status)}
                              className={`text-[11.5px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                statusMap[s.docId] === status
                                  ? STATUS_CONFIG[status].activeBtn
                                  : INACTIVE_BTN
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                    {saveSuccess && (
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
                        <Check size={15} /> Attendance saved
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-[#ff5722] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#f4511e] transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                    >
                      {saving && <Loader2 size={15} className="animate-spin" />}
                      {saving ? "Saving..." : "Save Attendance"}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 h-fit">
                  <h2 className="font-bold text-gray-900 text-[14px] mb-4">
                    Attendance Summary
                  </h2>
                  {donutData.length ? (
                    <div className="flex items-center gap-5">
                      <div className="w-32 h-32 shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              dataKey="value"
                              innerRadius={38}
                              outerRadius={62}
                              paddingAngle={2}
                            >
                              {donutData.map((d) => (
                                <Cell key={d.name} fill={d.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="text-[16px] font-bold text-gray-900">
                            {summary.total}
                          </div>
                          <div className="text-[9px] text-gray-500">Total</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-[12px]">
                        {donutData.map((d) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: d.color }}
                            />
                            <span className="text-gray-500">{d.name}</span>
                            <span className="font-bold text-gray-900 ml-1">
                              {d.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-gray-400">
                      Mark some students to see the summary.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {!loadingStudents && students.length === 0 && className && (
            <p className="text-[12.5px] text-gray-400 mt-4">
              Click "Load Class" to fetch students for this class.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, pct, bg, fg }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-gray-500">{label}</span>
        <span
          className={`w-8 h-8 rounded-lg ${bg} ${fg} flex items-center justify-center shrink-0`}
        >
          <Icon size={15} />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {pct !== undefined && (
          <span className="text-[11px] text-gray-400 font-medium">{pct}%</span>
        )}
      </div>
    </div>
  );
}
