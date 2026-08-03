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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Users,
  UserCheck,
  UserX,
  User,
  Search,
  Filter,
  Plus,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function TeachersPage() {
  const { profile } = useAuth?.() || {};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "teachers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            docId: doc.id,
            id: data.teacherId || doc.id,
            name: data.fullName || "—",
            role: data.subject ? `${data.subject} Teacher` : "Teacher",
            email: data.email || "-",
            phone: data.phone ? `+91 ${data.phone}` : "-",
            subject: data.subject || "-",
            classes: data.classesAssigned || "-",
            status: data.status === "active" ? "Active" : "Inactive",
            joined: formatJoinedDate(data.createdAt),
            gender: data.gender || "",
          };
        });
        setTeachers(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load teachers:", err);
        setError("Couldn't load teachers. Please try again.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [teachers, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.status === "Active").length;
    const inactive = total - active;
    const male = teachers.filter((t) => t.gender === "Male").length;
    const female = teachers.filter((t) => t.gender === "Female").length;
    return { total, active, inactive, male, female };
  }, [teachers]);

  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState(null);

  async function handleDeleteTeacher(teacher) {
    const confirmed = window.confirm(
      `Delete ${teacher.name}? This cannot be undone.`,
    );
    if (!confirmed) {
      setOpenMenuId(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "teachers", teacher.docId));
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
          activeItem="Teachers"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Teachers
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage all teachers in the school.
              </p>
            </div>
            <Link
              href="/dashboard/addteachers"
              className="inline-flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Teacher
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Total Teachers"
              value={stats.total}
              icon={Users}
              bg="bg-purple-50"
              fg="text-purple-600"
            />
            <StatCard
              label="Active Teachers"
              value={stats.active}
              icon={UserCheck}
              bg="bg-emerald-50"
              fg="text-emerald-600"
            />
            <StatCard
              label="Inactive Teachers"
              value={stats.inactive}
              icon={UserX}
              bg="bg-rose-50"
              fg="text-rose-600"
            />
            <StatCard
              label="Male Teachers"
              value={stats.male}
              icon={User}
              bg="bg-blue-50"
              fg="text-blue-600"
            />
            <StatCard
              label="Female Teachers"
              value={stats.female}
              icon={User}
              bg="bg-orange-50"
              fg="text-orange-600"
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-700">
                <Filter className="w-4 h-4 text-gray-500" />
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

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading teachers...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-sm text-rose-600">
                {error}
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">
                {teachers.length === 0
                  ? 'No teachers added yet. Click "Add Teacher" to create the first one.'
                  : "No teachers match your search/filter."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Teacher ID</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Phone</th>
                        <th className="py-3.5 px-4">Subject</th>
                        <th className="py-3.5 px-4">Classes</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Joined On</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredTeachers.map((teacher) => (
                        <tr
                          key={teacher.docId}
                          className="hover:bg-gray-50/50 transition"
                        >
                          <td className="py-3.5 px-4 font-medium text-gray-900 text-xs">
                            {teacher.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {initials(teacher.name)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-xs leading-tight">
                                  {teacher.name}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {teacher.role}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {teacher.email}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {teacher.phone}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 text-xs font-medium">
                            {teacher.subject}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            <ClassesCell classes={teacher.classes} />
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                teacher.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  teacher.status === "Active"
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                                }`}
                              />
                              {teacher.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {teacher.joined}
                          </td>
                          <td className="py-3.5 px-4 text-right relative">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/teachers/${teacher.docId}`,
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
                                    openMenuId === teacher.docId
                                      ? null
                                      : teacher.docId,
                                  )
                                }
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>

                            {openMenuId === teacher.docId && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-4 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 w-40 text-left">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/teachers/${teacher.docId}/edit`,
                                      )
                                    }
                                    className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left cursor-pointer"
                                  >
                                    Edit Teacher
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(teacher)}
                                    className={`w-full px-3.5 py-2 text-xs font-medium text-left hover:bg-gray-50 cursor-pointer ${
                                      teacher.status === "Active"
                                        ? "text-rose-600"
                                        : "text-emerald-600"
                                    }`}
                                  >
                                    {teacher.status === "Active"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeacher(teacher)}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-left text-rose-700 hover:bg-rose-50 cursor-pointer border-t border-gray-100"
                                  >
                                    Delete Teacher
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
                    Showing {filteredTeachers.length} of {teachers.length}{" "}
                    teachers
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

function StatCard({ label, value, icon: Icon, bg, fg, className = "" }) {
  return (
    <div
      className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between ${className}`}
    >
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

function ClassesCell({ classes }) {
  if (!classes || classes === "-") {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  const list = classes
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="flex items-center gap-1.5 max-w-40 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
      {list.map((cls, i) => (
        <span
          key={i}
          className="shrink-0 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md"
        >
          {cls}
        </span>
      ))}
      {list.length > 2 && (
        <span className="shrink-0 text-gray-400 text-xs font-bold px-1">
          •••
        </span>
      )}
    </div>
  );
}
