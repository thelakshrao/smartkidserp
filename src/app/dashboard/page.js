"use client";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/dashboardcomponents/AdminDashboard";
import TeacherDashboard from "@/dashboardcomponents/TeacherDashboard";
import StudentDashboard from "@/dashboardcomponents/StudentDashboard";

const ADMIN_ROLES = ["developer", "owner", "principal", "admin", "clerk"];
const TEACHER_ROLES = ["teacher"];
const STUDENT_ROLES = ["student", "parent"];

export default function DashboardPage() {
  const { profile } = useAuth();
  const role = profile?.role;

  if (ADMIN_ROLES.includes(role)) return <AdminDashboard profile={profile} />;
  if (TEACHER_ROLES.includes(role)) return <TeacherDashboard profile={profile} />;
  if (STUDENT_ROLES.includes(role)) return <StudentDashboard profile={profile} />;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf1ea] p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
        <p className="text-[#ed1c24] font-semibold">
          Unrecognized role &quot;{role}&quot;. Contact the developer.
        </p>
      </div>
    </main>
  );
}