"use client";
import React, { useState, useEffect, useMemo } from "react";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  Search,
  Filter,
  Plus,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutGrid,
  BookOpenCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Canonical class order — used both to sort the list and to order the
// class filter dropdown ("increasing" order as requested).
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
  "11-Science",
  "11-Commerce",
  "11-Arts",
  "12-Science",
  "12-Commerce",
  "12-Arts",
];

function classRank(cls) {
  const idx = CLASS_OPTIONS.indexOf(cls);
  return idx === -1 ? CLASS_OPTIONS.length : idx;
}

function formatJoinedDate(ts) {
  if (!ts) return "-";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function StudentsPage() {
  const { profile } = useAuth?.() || {};
  const isTeacher = profile?.role === "teacher";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");

  // "mine" = only the classes this teacher teaches, "all" = every class.
  // Admins always effectively see "all" (no toggle shown to them).
  const [viewMode, setViewMode] = useState("mine");
  const [teacherClasses, setTeacherClasses] = useState([]);
  const effectiveViewMode = isTeacher ? viewMode : "all";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            docId: doc.id,
            id: data.admissionNumber || doc.id,
            name: data.fullName || "—",
            className: data.className || "-",
            section: data.section || "",
            email: data.email || "-",
            phone: data.phone ? `+91 ${data.phone}` : "-",
            guardianName: data.guardianName || "-",
            guardianPhone: data.guardianPhone || "-",
            feeStatus: data.feeStatus || "-",
            status: data.status === "active" ? "Active" : "Inactive",
            joined: formatJoinedDate(data.createdAt),
            gender: data.gender || "",
          };
        });
        setStudents(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load students:", err);
        setError("Couldn't load students. Please try again.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Load which classes this teacher should see under "My Classes".
  // Two sources feed this, matching how the app actually assigns classes:
  //   1) profile.classIds — classes the teacher was directly assigned to
  //      teach when their account was created (users/{authUid}.classIds).
  //   2) classTeachers docs where teacherId === profile.userId — classes
  //      where this teacher has been made the Class Incharge. Note:
  //      profile.userId (stored as users/{authUid}.userId) is the same id
  //      as the teacher's doc in the "teachers" collection, which is what
  //      setClassTeacher() writes into classTeachers.teacherId.
  useEffect(() => {
    async function loadTeacherClasses() {
      if (!isTeacher) return;
      try {
        const classesSet = new Set();

        if (Array.isArray(profile?.classIds)) {
          profile.classIds.forEach((c) => classesSet.add(c));
        }

        if (profile?.userId) {
          const snap = await getDocs(collection(db, "classTeachers"));
          snap.docs.forEach((d) => {
            const data = d.data();
            if (data.teacherId === profile.userId && data.className) {
              classesSet.add(data.className);
            }
          });
        }

        setTeacherClasses(Array.from(classesSet));
      } catch (err) {
        console.error("Failed to load this teacher's assigned classes:", err);
        setTeacherClasses([]);
      }
    }
    loadTeacherClasses();
  }, [isTeacher, profile]);

  // Reset the class filter whenever the scope (mine vs all) changes, so a
  // stale selection from one scope doesn't silently apply to the other.
  useEffect(() => {
    setClassFilter("All");
  }, [viewMode]);

  const hasAssignedClasses = teacherClasses.length > 0;

  // Students within the current scope (before search/status/class filters).
  const scopedStudents = useMemo(() => {
    if (isTeacher && effectiveViewMode === "mine" && hasAssignedClasses) {
      return students.filter((s) => teacherClasses.includes(s.className));
    }
    return students;
  }, [
    students,
    isTeacher,
    effectiveViewMode,
    teacherClasses,
    hasAssignedClasses,
  ]);

  const classOptions = useMemo(() => {
    const set = new Set(scopedStudents.map((s) => s.className).filter(Boolean));
    if (isTeacher && effectiveViewMode === "mine") {
      // Make sure every class the teacher teaches shows up in the filter,
      // even if that class currently has zero students.
      teacherClasses.forEach((c) => set.add(c));
    }
    return [
      "All",
      ...Array.from(set).sort((a, b) => classRank(a) - classRank(b)),
    ];
  }, [scopedStudents, isTeacher, effectiveViewMode, teacherClasses]);

  const filteredStudents = useMemo(() => {
    const result = scopedStudents.filter((s) => {
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      const matchesClass = classFilter === "All" || s.className === classFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q);
      return matchesStatus && matchesClass && matchesSearch;
    });

    // "My Classes" view: show classes in increasing order, as requested.
    if (isTeacher && effectiveViewMode === "mine") {
      result.sort((a, b) => classRank(a.className) - classRank(b.className));
    }
    return result;
  }, [
    scopedStudents,
    searchQuery,
    statusFilter,
    classFilter,
    isTeacher,
    effectiveViewMode,
  ]);

  const stats = useMemo(() => {
    const total = scopedStudents.length;
    const active = scopedStudents.filter((s) => s.status === "Active").length;
    const inactive = total - active;
    const feePending = scopedStudents.filter(
      (s) => s.feeStatus === "Pending" || s.feeStatus === "Partial",
    ).length;
    return { total, active, inactive, feePending };
  }, [scopedStudents]);

  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState(null);

  async function handleToggleStatus(student) {
    const nextStatus = student.status === "Active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "students", student.docId), {
        status: nextStatus,
      });
    } catch (err) {
      console.error(err);
    }
    setOpenMenuId(null);
  }

  async function handleDeleteStudent(student) {
    const confirmed = window.confirm(
      `Delete ${student.name}? This cannot be undone.`,
    );
    if (!confirmed) {
      setOpenMenuId(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "students", student.docId));
    } catch (err) {
      console.error(err);
    }
    setOpenMenuId(null);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <DashboardTopbar
        profile={profile}
        notificationCount={5}
        onMenuClick={() => setMobileNavOpen((o) => !o)}
      />
      <div className="flex flex-1">
        <Sidebar
          dashboardType={isTeacher ? "teacher" : "admin"}
          activeItem="Students"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Students
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage all students in the school.
              </p>
            </div>
            <Link
              href="/dashboard/addstudents"
              className="inline-flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Link>
          </div>

          {isTeacher && (
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setViewMode("mine")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    viewMode === "mine"
                      ? "bg-[#ff5722] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  My Classes
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    viewMode === "all"
                      ? "bg-[#ff5722] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  All Students
                </button>
              </div>
              <span className="text-[11.5px] text-gray-500">
                {viewMode === "mine"
                  ? hasAssignedClasses
                    ? `Showing students of Class ${[...teacherClasses]
                        .sort((a, b) => classRank(a) - classRank(b))
                        .join(", ")}.`
                    : "No classes are assigned to you yet — showing all students. Contact admin to get your classes assigned."
                  : "Showing students from every class (Nursery to 12th)."}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Students"
              value={stats.total}
              icon={Users}
              bg="bg-purple-50"
              fg="text-purple-600"
            />
            <StatCard
              label="Active Students"
              value={stats.active}
              icon={UserCheck}
              bg="bg-emerald-50"
              fg="text-emerald-600"
            />
            <StatCard
              label="Inactive Students"
              value={stats.inactive}
              icon={UserX}
              bg="bg-rose-50"
              fg="text-rose-600"
            />
            <StatCard
              label="Fee Pending"
              value={stats.feePending}
              icon={IndianRupee}
              bg="bg-amber-50"
              fg="text-amber-600"
            />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-700">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">
                  Class:
                </span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer"
                >
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c === "All" ? "All" : `Class ${c}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-700">
                <span className="text-xs font-medium text-gray-500">
                  Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading students...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-sm text-rose-600">
                {error}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">
                {students.length === 0
                  ? 'No students added yet. Click "Add Student" to create the first one.'
                  : "No students match your search/filter."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Admission No.</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Class</th>
                        <th className="py-3.5 px-4">Guardian</th>
                        <th className="py-3.5 px-4">Guardian Phone</th>
                        <th className="py-3.5 px-4">Fee Status</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Joined On</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.docId}
                          className="hover:bg-gray-50/50 transition"
                        >
                          <td className="py-3.5 px-4 font-medium text-gray-900 text-xs">
                            {student.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {initials(student.name)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-xs leading-tight">
                                  {student.name}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {student.gender || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 text-xs font-medium">
                            Class {student.className}
                            {student.section ? ` - ${student.section}` : ""}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {student.guardianName}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {student.guardianPhone}
                          </td>
                          <td className="py-3.5 px-4">
                            <FeeStatusBadge status={student.feeStatus} />
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                student.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  student.status === "Active"
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                                }`}
                              />
                              {student.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {student.joined}
                          </td>
                          <td className="py-3.5 px-4 text-right relative">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/students/${student.docId}`,
                                  )
                                }
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                title="View profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === student.docId
                                      ? null
                                      : student.docId,
                                  )
                                }
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>

                            {openMenuId === student.docId && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-4 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 w-40 text-left">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/students/${student.docId}/edit`,
                                      )
                                    }
                                    className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left cursor-pointer"
                                  >
                                    Edit Student
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(student)}
                                    className={`w-full px-3.5 py-2 text-xs font-medium text-left hover:bg-gray-50 cursor-pointer ${
                                      student.status === "Active"
                                        ? "text-rose-600"
                                        : "text-emerald-600"
                                    }`}
                                  >
                                    {student.status === "Active"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student)}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-left text-rose-700 hover:bg-rose-50 cursor-pointer border-t border-gray-100"
                                  >
                                    Delete Student
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-gray-500">
                    Showing {filteredStudents.length} of {scopedStudents.length}{" "}
                    students
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">10 per page</span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled
                        className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-orange-600 text-white font-medium text-xs flex items-center justify-center shadow-sm">
                        1
                      </button>
                      <button
                        disabled
                        className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, bg, fg }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div
          className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${fg}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}

function FeeStatusBadge({ status }) {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700",
    Pending: "bg-rose-50 text-rose-700",
    Partial: "bg-amber-50 text-amber-700",
  };
  if (!status || status === "-") {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-50 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
