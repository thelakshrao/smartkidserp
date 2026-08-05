"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/activityLog";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Mail,
  Phone,
  Badge,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Briefcase,
  MapPin,
  Droplet,
  ShieldAlert,
  Loader2,
  Pencil,
  Power,
  Users,
  ClipboardCheck,
  FileText,
  Star,
  Award,
  Clock,
  MessageSquare,
  UploadCloud,
  BarChart3,
  Send,
  CalendarClock,
  CheckSquare,
  PlusSquare,
  X,
} from "lucide-react";

const TABS = [
  "Overview",
  "Classes",
  "Timetable",
  "Attendance",
  "Assignments",
  "Exams",
  "Performance",
  "Documents",
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

export default function TeacherProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth?.() || {};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const snap = await getDoc(doc(db, "teachers", id));
        if (!snap.exists()) {
          setError("Teacher not found.");
        } else {
          setTeacher({ docId: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this teacher.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTeacher();
  }, [id]);

  async function handleToggleStatus() {
    if (!teacher) return;
    const nextStatus = teacher.status === "active" ? "inactive" : "active";
    setTogglingStatus(true);
    try {
      await updateDoc(doc(db, "teachers", teacher.docId), {
        status: nextStatus,
      });

      await logActivity("teacher_status_changed", {
        actorName: profile?.name,
        targetName: teacher.fullName,
        meta: { newStatus: nextStatus },
      });

      setTeacher((t) => ({ ...t, status: nextStatus }));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingStatus(false);
    }
  }

  const mappingsList = teacher?.classSubjectMappings || [];

  const subjectSummary = useMemo(() => {
    const map = {};
    mappingsList.forEach((m) => {
      (m.subjects || []).forEach((s) => {
        map[s] = (map[s] || 0) + 1;
      });
    });
    return Object.entries(map).map(([subject, classCount]) => ({
      subject,
      classCount,
    }));
  }, [mappingsList]);

  const statCards = teacher
    ? [
        {
          icon: Users,
          label: "Classes Assigned",
          value: mappingsList.length || "-",
          bg: "bg-purple-50",
          fg: "text-purple-600",
        },
        {
          icon: BookOpen,
          label: "Total Students",
          value: teacher.totalStudents ?? "-",
          bg: "bg-emerald-50",
          fg: "text-emerald-600",
        },
        {
          icon: ClipboardCheck,
          label: "Average Attendance",
          value: teacher.averageAttendance
            ? `${teacher.averageAttendance}%`
            : "-",
          bg: "bg-amber-50",
          fg: "text-amber-600",
        },
        {
          icon: FileText,
          label: "Assignments Given",
          value: teacher.assignmentsGiven ?? "-",
          bg: "bg-blue-50",
          fg: "text-blue-600",
        },
        {
          icon: Star,
          label: "Average Rating",
          value: teacher.averageRating ? `${teacher.averageRating}/5` : "-",
          bg: "bg-rose-50",
          fg: "text-rose-600",
        },
        {
          icon: Award,
          label: "Awards Received",
          value: teacher.awardsReceived ?? "-",
          bg: "bg-yellow-50",
          fg: "text-yellow-600",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <DashboardTopbar
        profile={profile}
        notificationCount={5}
        onMenuClick={() => setMobileNavOpen((o) => !o)}
      />
      <div className="flex flex-1 min-w-0">
        <Sidebar
          dashboardType="admin"
          activeItem="Teachers"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Teachers</span>
                <span>&gt;</span>
                <span className="text-gray-900 font-semibold">
                  Teacher Profile
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/teachers"
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back to Teachers
                </Link>
                {teacher && (
                  <Link
                    href={`/dashboard/teachers/${teacher.docId}/edit`}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#ff5722] hover:bg-[#f4511e] rounded-xl px-4 py-2 transition-colors shadow-sm"
                  >
                    <Pencil size={15} />
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading teacher profile...
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-rose-600 text-sm">
                {error}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5 flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xl font-bold shrink-0">
                      {initials(teacher.fullName)}
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-[#ff5722]">
                        {teacher.fullName || "-"}
                      </h1>
                      <p className="text-[13px] font-semibold text-[#ff5722]/80 mb-2">
                        {teacher.subject
                          ? `${teacher.subject} Specialist`
                          : "Teacher"}
                      </p>
                      <div className="flex flex-col gap-1 text-[12.5px] text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-gray-400" />{" "}
                          {teacher.email || "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" />
                          {teacher.phone ? `+91 ${teacher.phone}` : "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Badge size={13} className="text-gray-400" />{" "}
                          {teacher.teacherId || "-"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-gray-400" />
                          Joined on {formatDate(teacher.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                    {statCards.map((s) => (
                      <MiniStat
                        key={s.label}
                        icon={s.icon}
                        label={s.label}
                        value={s.value}
                        bg={s.bg}
                        fg={s.fg}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-5 overflow-x-auto border-b border-gray-100">
                  {TABS.map((tab) => (
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-3 gap-5">
                    <div className="lg:col-start-1 lg:row-start-1">
                      <AssignedClassesCard
                        mappingsList={mappingsList}
                        onViewAll={() => setActiveTab("Classes")}
                      />
                    </div>
                    <div className="lg:col-start-2 lg:row-start-1">
                      <TimetableCard
                        timetable={teacher.timetable}
                        onViewAll={() => setActiveTab("Timetable")}
                      />
                    </div>
                    <div className="lg:col-start-3 lg:row-start-1">
                      <AttendanceSummaryCard
                        averageAttendance={teacher.averageAttendance}
                        breakdown={teacher.attendanceBreakdown}
                      />
                    </div>

                    <div className="lg:col-start-1 lg:row-start-2">
                      <SubjectsHandledCard
                        subjectSummary={subjectSummary}
                        onViewAll={() => setActiveTab("Classes")}
                      />
                    </div>
                    <div className="lg:col-start-2 lg:row-start-2">
                      <ProfessionalDetailsSummaryCard
                        teacher={teacher}
                        onViewAll={() => setShowDetailsModal(true)}
                      />
                    </div>
                    <div className="lg:col-start-3 lg:row-start-2 lg:row-span-2">
                      <QuickActionsCard />
                    </div>

                    <div className="lg:col-start-1 lg:row-start-3">
                      <StudentFeedbackCard feedback={teacher.studentFeedback} />
                    </div>
                    <div className="lg:col-start-2 lg:row-start-3">
                      <RecentActivitiesCard
                        activities={teacher.recentActivities}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleToggleStatus}
                    disabled={togglingStatus}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                      teacher.status === "active"
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    <Power size={14} />
                    {togglingStatus
                      ? "Updating..."
                      : teacher.status === "active"
                        ? "Deactivate Account"
                        : "Activate Account"}
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {showDetailsModal && teacher && (
        <ProfessionalDetailsModal
          teacher={teacher}
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

function CardShell({ title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-[14px]">{title}</h2>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ViewAllLink({ onClick, label = "View All" }) {
  return (
    <button
      onClick={onClick}
      className="text-[12px] font-semibold text-[#ff5722] hover:underline cursor-pointer shrink-0"
    >
      {label}
    </button>
  );
}

function AssignedClassesCard({ mappingsList, onViewAll }) {
  return (
    <CardShell
      title="Assigned Classes"
      action={<ViewAllLink onClick={onViewAll} />}
    >
      {mappingsList.length ? (
        <div className="flex flex-col gap-2.5">
          {mappingsList.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <BookOpen size={14} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-gray-900">
                  Class {m.className || "-"}
                </div>
                <div className="text-[11.5px] text-gray-500">
                  {m.subjects?.length
                    ? `${m.subjects.length} subject${m.subjects.length > 1 ? "s" : ""}`
                    : "No subjects set"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-gray-400">No classes assigned yet.</p>
      )}
    </CardShell>
  );
}

function TimetableCard({ timetable, onViewAll }) {
  return (
    <CardShell
      title="Today's Timetable"
      action={<ViewAllLink onClick={onViewAll} label="View Full Timetable" />}
    >
      {timetable?.length ? (
        <div className="flex flex-col gap-3">
          {timetable.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-gray-900">
                  {slot.time || "-"}
                </div>
                <div className="text-[11.5px] text-gray-500">
                  {slot.className} {slot.subject ? `· ${slot.subject}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-gray-400">
          Timetable not added yet for this teacher.
        </p>
      )}
    </CardShell>
  );
}

function AttendanceSummaryCard({ averageAttendance, breakdown }) {
  const pct = averageAttendance || 0;
  return (
    <CardShell
      title="Attendance Summary"
      action={
        <span className="text-[11.5px] text-gray-400 font-medium">
          This Month
        </span>
      }
    >
      {averageAttendance ? (
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(#10b981 ${pct}%, #e5e7eb ${pct}% 100%)`,
            }}
          >
            <div className="absolute w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-[16px] font-bold text-gray-900">
                {pct}%
              </span>
              <span className="text-[10px] text-gray-400">Average</span>
            </div>
          </div>
          <div className="w-full flex flex-col gap-1.5 text-[11.5px]">
            <AttendanceLegendRow
              color="bg-emerald-500"
              label="Present"
              value={breakdown?.present}
            />
            <AttendanceLegendRow
              color="bg-amber-500"
              label="Late"
              value={breakdown?.late}
            />
            <AttendanceLegendRow
              color="bg-rose-500"
              label="Absent"
              value={breakdown?.absent}
            />
            <AttendanceLegendRow
              color="bg-gray-400"
              label="Leave"
              value={breakdown?.leave}
            />
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-gray-400">
          Attendance data not available yet.
        </p>
      )}
    </CardShell>
  );
}

function AttendanceLegendRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-gray-500">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-semibold text-gray-900">{value ?? "-"}</span>
    </div>
  );
}

function SubjectsHandledCard({ subjectSummary, onViewAll }) {
  return (
    <CardShell
      title="Subjects Handled"
      action={<ViewAllLink onClick={onViewAll} />}
    >
      {subjectSummary.length ? (
        <div className="flex flex-col gap-2.5">
          {subjectSummary.map((s) => (
            <div key={s.subject} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <BookOpen size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900">
                  {s.subject}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-bold text-gray-900">
                  {s.classCount}
                </div>
                <div className="text-[10.5px] text-gray-400">Classes</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-gray-400">No subjects assigned yet.</p>
      )}
    </CardShell>
  );
}

function ProfessionalDetailsSummaryCard({ teacher, onViewAll }) {
  return (
    <CardShell
      title="Professional & Personal Details"
      action={<ViewAllLink onClick={onViewAll} />}
    >
      <div className="flex flex-col gap-2.5">
        <DetailRow label="Qualification" value={teacher.qualification} />
        <DetailRow label="Department" value={teacher.department} />
        <DetailRow label="Employment Type" value={teacher.employmentType} />
      </div>
      <p className="text-[11px] text-gray-400 mt-3">
        Click "View All" for full profile & emergency contact info.
      </p>
    </CardShell>
  );
}

function QuickActionsCard() {
  const actions = [
    { icon: CheckSquare, label: "Mark Attendance", bg: "bg-emerald-500" },
    { icon: PlusSquare, label: "Add Assignment", bg: "bg-violet-500" },
    { icon: UploadCloud, label: "Upload Material", bg: "bg-amber-500" },
    { icon: BarChart3, label: "View Class Performance", bg: "bg-blue-500" },
    { icon: Send, label: "Send Message", bg: "bg-rose-500" },
    { icon: CalendarClock, label: "Schedule Meeting", bg: "bg-sky-500" },
  ];
  return (
    <CardShell title="Quick Actions">
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <button
            key={a.label}
            title="Coming soon"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-4 px-2 text-center hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span
              className={`w-9 h-9 rounded-lg ${a.bg} text-white flex items-center justify-center`}
            >
              <a.icon size={16} />
            </span>
            <span className="text-[11px] font-semibold text-gray-700 leading-tight">
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </CardShell>
  );
}

function StudentFeedbackCard({ feedback }) {
  return (
    <CardShell title="Student Feedback">
      {feedback?.rating ? (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[20px] font-bold text-gray-900">
              {feedback.rating} / 5
            </div>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.round(feedback.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200 fill-gray-200"
                  }
                />
              ))}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Based on {feedback.count || 0} feedbacks
            </div>
          </div>
          {feedback.quote && (
            <div className="bg-gray-50 rounded-xl p-3 text-[12px] text-gray-600 italic">
              "{feedback.quote}"
              {feedback.author && (
                <div className="text-[11px] text-gray-400 mt-1 not-italic">
                  — {feedback.author}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[12.5px] text-gray-400">
          No student feedback recorded yet.
        </p>
      )}
    </CardShell>
  );
}

function RecentActivitiesCard({ activities }) {
  return (
    <CardShell title="Recent Activities">
      {activities?.length ? (
        <div className="flex flex-col gap-3">
          {activities.map((act, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                <MessageSquare size={13} />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-gray-900">
                  {act.title}
                </div>
                <div className="text-[11px] text-gray-400">{act.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-gray-400">No recent activity yet.</p>
      )}
    </CardShell>
  );
}

function ProfessionalDetailsModal({ teacher, onClose }) {
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
            Professional & Personal Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <DetailRow label="Qualification" value={teacher.qualification} />
          <DetailRow label="Employment Type" value={teacher.employmentType} />
          <DetailRow label="Department" value={teacher.department} />
          <DetailRow
            label="Joining Date"
            value={formatDate(teacher.joiningDate)}
          />
          <DetailRow label="Previous School" value={teacher.previousSchool} />
          <DetailRow label="Gender" value={teacher.gender} />
          <DetailRow label="Date of Birth" value={formatDate(teacher.dob)} />
          <DetailRow label="Marital Status" value={teacher.maritalStatus} />
          <DetailRow
            label="Blood Group"
            value={teacher.bloodGroup}
            icon={Droplet}
          />
          <DetailRow
            label="Address"
            value={[
              teacher.address,
              teacher.city,
              teacher.state,
              teacher.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
            icon={MapPin}
          />
          <DetailRow
            label="Emergency Contact"
            value={
              teacher.emergencyName
                ? `${teacher.emergencyName} (${teacher.emergencyPhone || "-"})`
                : "-"
            }
            icon={ShieldAlert}
          />
        </div>
      </div>
    </div>
  );
}
