"use client";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AuthGate({ children }) {
  const router = useRouter();
  const { profile, loading, error } = useAuth();

  if (loading && !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf1ea]">
        <p className="text-[#6b5d56] font-medium">Loading your dashboard...</p>
      </main>
    );
  }

  if (!loading && !profile && !error) {
    router.replace("/");
    return null;
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf1ea] p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
          <p className="text-[#ed1c24] font-semibold mb-4">{error}</p>
          <button
            onClick={() => router.replace("/")}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white cursor-pointer
                       bg-linear-to-br from-[#f7941d] to-[#ed1c24]"
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  return children;
}

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}