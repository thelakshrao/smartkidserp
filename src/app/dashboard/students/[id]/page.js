"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { useAuth } from "@/context/AuthContext";
import { db, getClassTeacher } from "@/lib/firebase";
import { logActivity } from "@/lib/activityLog";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Mail,
  Phone,
  Badge,
  CalendarDays,
  MapPin,
  Droplet,
  ShieldAlert,
  Loader2,
  Pencil,
  Power,
  GraduationCap,
  ClipboardCheck,
  Star,
  FileCheck2,
  IndianRupee,
  HeartHandshake,
  User,
  X,
  Info,
  Clock,
  Megaphone,
  Wallet,
  BadgeCheck,
} from "lucide-react";

const TABS_ADMIN = [
  "Overview",
  "Attendance",
  "Timetable",
  "Exams",
  "Homework",
  "Fees",
  "Documents",
  "Activity Log",
];
const TABS_TEACHER = [
  "Overview",
  "Attendance",
  "Timetable",
  "Exams",
  "Homework",
  "Documents",
  "Activity Log",
];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function formatDate(value) {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function calcAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const { profile } = useAuth?.() || {};
  const isAdmin = profile?.role !== "teacher";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [classTeacherName, setClassTeacherName] = useState(null);

  useEffect(() => {
    if (student?.className) {
      getClassTeacher(student.className).then((data) => {
        setClassTeacherName(data?.teacherName || null);
      });
    }
  }, [student]);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const snap = await getDoc(doc(db, "students", id));
        if (!snap.exists()) {
          setError("Student not found.");
        } else {
          setStudent({ docId: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this student.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchStudent();
  }, [id]);

  async function handleToggleStatus() {
    if (!student) return;
    const nextStatus = student.status === "active" ? "inactive" : "active";
    setTogglingStatus(true);
    try {
      await updateDoc(doc(db, "students", student.docId), {
        status: nextStatus,
      });
      await logActivity("student_status_changed", {
        actorName: profile?.name,
        targetName: student.fullName,
        meta: { newStatus: nextStatus },
      });
      setStudent((s) => ({ ...s, status: nextStatus }));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingStatus(false);
    }
  }

  const tabs = isAdmin ? TABS_ADMIN : TABS_TEACHER;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <DashboardTopbar
        profile={profile}
        notificationCount={5}
        onMenuClick={() => setMobileNavOpen((o) => !o)}
      />
      <div className="flex flex-1 min-w-0">
        <Sidebar
          dashboardType={isAdmin ? "admin" : "teacher"}
          activeItem="Students"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Students</span>
                <span>&gt;</span>
                <span className="text-gray-900 font-semibold">
                  Student Profile
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/students"
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back to Students
                </Link>
                {student && (
                  <Link
                    href={`/dashboard/students/${student.docId}/edit`}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#ff5722] hover:bg-[#f4511e] rounded-xl px-4 py-2 transition-colors shadow-sm"
                  >
                    <Pencil size={15} />
                    Edit Student
                  </Link>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading student profile...
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-rose-600 text-sm">
                {error}
              </div>
            ) : (
              <>
                {/* Header card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5 flex flex-col xl:flex-row xl:items-center gap-6">
                  <div className="flex items-start gap-4 shrink-0">
                    <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xl font-bold shrink-0">
                      {initials(student.fullName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-[#ff5722]">
                          {student.fullName || "-"}
                        </h1>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            student.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {student.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-gray-500 mb-2">
                        Class {student.className || "-"} · Admission No:{" "}
                        {student.admissionNumber || "-"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-gray-400" />{" "}
                          {student.email || "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" />
                          {student.phone ? `+91 ${student.phone}` : "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-gray-400" />
                          DOB: {formatDate(student.dob)}
                          {calcAge(student.dob) !== null
                            ? ` (${calcAge(student.dob)} yrs)`
                            : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Droplet size={13} className="text-gray-400" />
                          Blood Group: {student.bloodGroup || "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-gray-400" />
                          {[student.city, student.state]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BadgeCheck size={13} className="text-gray-400" />
                          Gender: {student.gender || "-"}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowDetailsModal(true)}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#ff5722] hover:underline mt-3 cursor-pointer"
                      >
                        <Info size={13} />
                        View full personal details
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 grid-rows-2 gap-3 flex-1">
                    <MiniStat
                      icon={ClipboardCheck}
                      label="Attendance"
                      value="-"
                      bg="bg-emerald-50"
                      fg="text-emerald-600"
                    />
                    <MiniStat
                      icon={Star}
                      label="Overall Grade"
                      value="-"
                      bg="bg-violet-50"
                      fg="text-violet-600"
                    />
                    <MiniStat
                      icon={FileCheck2}
                      label="Assignments"
                      value="-"
                      bg="bg-amber-50"
                      fg="text-amber-600"
                    />
                    <MiniStat
                      icon={GraduationCap}
                      label="Exams"
                      value="-"
                      bg="bg-blue-50"
                      fg="text-blue-600"
                    />
                    {isAdmin && (
                      <MiniStat
                        icon={IndianRupee}
                        label="Fee Status"
                        value={student.feeStatus || "-"}
                        bg="bg-rose-50"
                        fg="text-rose-600"
                      />
                    )}
                    <MiniStat
                      icon={HeartHandshake}
                      label="Behavior"
                      value="-"
                      bg="bg-sky-50"
                      fg="text-sky-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-5 overflow-x-auto border-b border-gray-100">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                        activeTab === tab
                          ? "border-[#ff5722] text-[#ff5722]"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab !== "Overview" ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
                    {tab_placeholder(activeTab)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                      <h2 className="font-bold text-gray-900 mb-4">Class</h2>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                          <GraduationCap size={16} />
                        </span>
                        <div>
                          <div className="text-[13.5px] font-bold text-gray-900">
                            Class {student.className || "-"}
                          </div>
                          <div className="text-[11.5px] text-gray-500">
                            Class Incharge: {classTeacherName || "Not assigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <NotBuiltCard
                      icon={Clock}
                      title="Today's Timetable"
                      note="Timetable module isn't live yet — this will show the student's real daily schedule once Phase 5 is built."
                    />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                      <h2 className="font-bold text-gray-900 mb-4">
                        Parents / Guardians
                      </h2>
                      <div className="flex flex-col gap-3">
                        <ParentRow
                          name={student.guardianName}
                          relation={student.guardianRelation || "Guardian"}
                          phone={student.guardianPhone}
                          email={student.guardianEmail}
                          bg="bg-emerald-50"
                          fg="text-emerald-600"
                        />
                        {student.motherName ? (
                          <ParentRow
                            name={student.motherName}
                            relation="Mother"
                            phone={student.motherPhone}
                            email={student.motherEmail}
                            bg="bg-rose-50"
                            fg="text-rose-600"
                          />
                        ) : (
                          <p className="text-[12px] text-gray-400 italic">
                            Mother's details not added.
                          </p>
                        )}
                      </div>
                    </div>

                    <NotBuiltCard
                      icon={FileCheck2}
                      title="Recent Assignments"
                      note="Once the Assignments module exists, this student's submissions and due dates will show up here."
                    />

                    <NotBuiltCard
                      icon={GraduationCap}
                      title="Latest Exam Results"
                      note="Once the Exams module exists, recent test scores and grades will show up here."
                    />

                    {isAdmin ? (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-gray-900">
                            Fee Status
                          </h2>
                          <button
                            onClick={() => setActiveTab("Fees")}
                            className="text-[12px] font-semibold text-[#ff5722] hover:underline"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <FeeStat
                            label="Total Fees"
                            value={
                              student.feeTotal ? `₹${student.feeTotal}` : "-"
                            }
                          />
                          <FeeStat
                            label="Paid"
                            value={
                              student.feePaid ? `₹${student.feePaid}` : "-"
                            }
                            color="text-emerald-600"
                          />
                          <FeeStat
                            label="Due"
                            value={
                              student.feeStatus === "Paid"
                                ? "₹0"
                                : student.feePending
                                  ? `₹${student.feePending}`
                                  : "-"
                            }
                            color="text-rose-600"
                          />
                        </div>
                        <div
                          className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${
                            student.feeStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {student.feeStatus === "Paid"
                            ? "All fees paid. Thank you!"
                            : `Fee status: ${student.feeStatus || "Not set"}`}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <h2 className="font-bold text-gray-900 mb-4">
                          Emergency Contact
                        </h2>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <ShieldAlert size={16} />
                          </span>
                          <div>
                            <div className="text-[13.5px] font-bold text-gray-900">
                              {student.emergencyName || "-"}
                            </div>
                            <div className="text-[11.5px] text-gray-500">
                              {student.emergencyPhone || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <NotBuiltCard
                      icon={Megaphone}
                      title="Recent Notices"
                      note="School announcements relevant to this student will appear here once that module exists."
                    />

                    <NotBuiltCard
                      icon={Wallet}
                      title="Quick Actions"
                      note="Shortcuts like View Report Card, Download ID Card, and Apply Leave will live here once those modules exist."
                    />
                  </div>
                )}

                <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleToggleStatus}
                    disabled={togglingStatus}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                      student.status === "active"
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    <Power size={14} />
                    {togglingStatus
                      ? "Updating..."
                      : student.status === "active"
                        ? "Deactivate Account"
                        : "Activate Account"}
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {showDetailsModal && student && (
        <PersonalDetailsModal
          student={student}
          isAdmin={isAdmin}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}

function tab_placeholder(tab) {
  return `${tab} isn't tracked yet — this section will show real data once the ${tab} module is built.`;
}

function MiniStat({ icon: Icon, label, value, bg, fg }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-3">
      <span
        className={`w-9 h-9 rounded-lg ${bg} ${fg} flex items-center justify-center shrink-0`}
      >
        <Icon size={16} />
      </span>
      <div>
        <div className="text-[15px] font-bold text-gray-900 leading-tight">
          {value}
        </div>
        <div className="text-[11px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function NotBuiltCard({ icon: Icon, title, note }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-[14px] flex items-center gap-1.5">
          <Icon size={14} className="text-gray-400" />
          {title}
        </h2>
        <span className="text-[11px] text-gray-300 font-semibold">
          Not built yet
        </span>
      </div>
      <p className="text-[12.5px] text-gray-400">{note}</p>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[12.5px] py-1">
      <span className="text-gray-900 font-semibold flex items-center gap-1.5 shrink-0">
        {Icon && <Icon size={13} className="text-gray-400" />}
        {label}
      </span>
      <span className="text-gray-500 text-right wrap-break-words">
        {value || "-"}
      </span>
    </div>
  );
}

function ParentRow({ name, relation, phone, email, bg, fg }) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-9 h-9 rounded-full ${bg} ${fg} flex items-center justify-center shrink-0`}
      >
        <User size={16} />
      </span>
      <div>
        <div className="text-[13px] font-bold text-gray-900">
          {name} <span className="text-gray-400 font-normal">({relation})</span>
        </div>
        <div className="text-[11.5px] text-gray-500">
          {phone ? `+91 ${phone}` : "-"} {email ? `· ${email}` : ""}
        </div>
      </div>
    </div>
  );
}

function FeeStat({ label, value, color = "text-gray-900" }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <div className={`text-[15px] font-bold ${color}`}>{value}</div>
    </div>
  );
}

function PersonalDetailsModal({ student, isAdmin, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-[16px]">
            Personal Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <DetailRow label="Gender" value={student.gender} />
          <DetailRow label="Date of Birth" value={formatDate(student.dob)} />
          <DetailRow
            label="Blood Group"
            value={student.bloodGroup}
            icon={Droplet}
          />
          <DetailRow
            label="Admission Number"
            value={student.admissionNumber}
            icon={Badge}
          />
          <DetailRow
            label="Address"
            value={[
              student.address,
              student.city,
              student.state,
              student.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
            icon={MapPin}
          />
          {isAdmin && (
            <DetailRow
              label="Emergency Contact"
              value={
                student.emergencyName
                  ? `${student.emergencyName} (${student.emergencyPhone || "-"})`
                  : "-"
              }
              icon={ShieldAlert}
            />
          )}
        </div>
      </div>
    </div>
  );
}
