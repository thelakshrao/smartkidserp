"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  onAuthStateChanged,
  updatePassword,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import logo from "@/images/logo.png";

const EASE = [0.22, 1, 0.36, 1];

function EyeToggle({ shown, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7d78] p-1 cursor-pointer
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f7941d] rounded-md"
    >
      {shown ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.68 3.9M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function Shell({ children }) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#faf1ea] p-4 sm:p-7">
      <div
        className="relative w-full max-w-295 min-h-170 rounded-4xl overflow-hidden
                   shadow-[0_50px_90px_-30px_rgba(0,0,0,0.2)]
                   bg-[#fdf9f6]
                   grid grid-cols-1 md:grid-cols-[1.15fr_1fr]"
      >
        <div className="absolute -bottom-24 -right-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#fbd7cf] pointer-events-none z-0" />
        <div className="relative flex flex-col p-8 sm:p-12 md:pb-10 overflow-hidden">
          <div className="absolute -top-24 right-[10%] w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#cfe0f0] pointer-events-none" />
          <div className="absolute -bottom-20 -left-16 w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-[#fbe3cd] pointer-events-none" />
          <div className="absolute top-[26%] right-[16%] grid grid-cols-4 gap-2 pointer-events-none">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-[#b9c6e0]" />
            ))}
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3.5 mb-10 md:mb-12">
              <div className="w-14 h-14 rounded-full bg-white border border-[#eee2da] flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                <Image src={logo} alt="Smart Kids Convent School logo" width={42} height={42} className="object-contain" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-[15px] sm:text-[19px] text-[#241a1a]">Smart Kids Convent School</div>
                <div className="text-[10.5px] sm:text-[12.5px] text-[#8a7d78] font-medium">Heera Nagar, Gurugram</div>
              </div>
            </div>
            <h1 className="font-extrabold text-[26px] sm:text-[46px] leading-[1.08] mb-3.5">
              <span className="text-[#241a1a]">Almost </span>
              <span className="bg-linear-to-br from-[#f7941d] to-[#ed1c24] bg-clip-text text-transparent">there!</span>
            </h1>
            <p className="text-[12.5px] sm:text-[15.5px] max-w-105 text-[#6b5d56] font-medium mb-auto">
              Set a new password to secure your account and get back into the
              Student ERP Portal.
            </p>
          </div>
        </div>
        <div className="relative flex items-end justify-center px-6 sm:px-9 pt-6 sm:pt-9 pb-0">
          <motion.div
            initial={{ y: "140%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-100 bg-white rounded-t-[26px] rounded-b-none p-8 sm:p-10 pt-9 sm:pt-10
                       shadow-[0_30px_60px_-20px_rgba(150,20,20,0.35)]"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <Shell>
      <div className="w-16 h-16 rounded-full border border-[#eee2da] flex items-center justify-center mx-auto mb-4">
        <Image src={logo} alt="" width={48} height={48} className="object-contain" />
      </div>
      <p className="text-center text-[12.5px] sm:text-sm text-[#8a7d78] font-medium">
        Checking your link…
      </p>
    </Shell>
  );
}

function mapAuthError(err) {
  const code = err?.code || "";
  if (code.includes("expired-action-code")) {
    return "This reset link has expired. Please request a new one from the login page.";
  }
  if (code.includes("invalid-action-code")) {
    return "This reset link is invalid or has already been used. Please request a new one.";
  }
  if (code.includes("weak-password")) {
    return "Please choose a stronger password (at least 6 characters).";
  }
  if (code.includes("requires-recent-login")) {
    return "For security, please log in again before changing your password.";
  }
  return err?.message || "Something went wrong. Please try again.";
}

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  // "checking" | "forced" | "resetLink" | "invalid"
  const [pageMode, setPageMode] = useState("checking");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let unsub = () => {};

    async function init() {
      if (oobCode) {
        // Came from the "forgot password" email link.
        try {
          const resetEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(resetEmail);
          setPageMode("resetLink");
        } catch (err) {
          setError(mapAuthError(err));
          setPageMode("invalid");
        }
        return;
      }

      // No oobCode -> this must be the forced first-login change,
      // which requires an active session.
      unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setEmail(user.email || "");
          setPageMode("forced");
        } else {
          setError("Please log in first, then you'll be brought here automatically.");
          setPageMode("invalid");
        }
      });
    }

    init();
    return () => unsub();
  }, [oobCode]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (pageMode === "resetLink") {
        await confirmPasswordReset(auth, oobCode, form.password);
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else if (pageMode === "forced") {
        const user = auth.currentUser;
        await updatePassword(user, form.password);
        await updateDoc(doc(db, "users", user.uid), {
          mustChangePassword: false,
        });
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (pageMode === "checking") return <LoadingScreen />;

  return (
    <Shell>
      <div className="w-16 h-16 rounded-full border border-[#eee2da] flex items-center justify-center mx-auto mb-4">
        <Image src={logo} alt="" width={48} height={48} className="object-contain" />
      </div>
      <h1 className="font-bold text-[20px] sm:text-[25px] text-[#241a1a] text-center mb-1.5">
        {pageMode === "invalid" ? "Link unavailable" : "Set a new password"}
      </h1>
      <p className="text-center text-[11.5px] sm:text-[13.5px] font-semibold text-[#ed1c24] mb-1">
        Smart Kids Convent School
      </p>
      {email && pageMode !== "invalid" && (
        <p className="text-center text-[10.5px] sm:text-xs text-[#8a7d78] mb-6">
          {email}
        </p>
      )}

      {pageMode === "invalid" ? (
        <div className="mt-4">
          <p className="text-center text-[12px] sm:text-[13.5px] text-[#6b5d56] font-medium mb-6">
            {error}
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl py-3.5 text-[13px] sm:text-[15px] font-bold tracking-wide text-white cursor-pointer
                       bg-linear-to-br from-[#f7941d] to-[#ed1c24]
                       shadow-[0_12px_20px_-8px_rgba(237,28,36,0.55)]
                       transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Back to Login
          </button>
        </div>
      ) : success ? (
        <p className="text-center text-[12px] sm:text-[13.5px] text-[#1a7a3c] font-semibold mt-6 mb-2">
          Password updated! Redirecting…
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-[10.5px] sm:text-xs font-semibold text-[#241a1a] mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your new password"
                autoComplete="new-password"
                required
                className="w-full px-3.5 py-3 rounded-xl border-[1.5px] border-[#eee2da] text-[12.5px] sm:text-sm bg-[#fff8f1] text-[#241a1a]
                           placeholder:text-[#6b5d56] placeholder:font-medium
                           outline-none transition-colors focus:border-[#f7941d]
                           focus:ring-4 focus:ring-[#f7941d]/20"
              />
              <EyeToggle shown={showPassword} onClick={() => setShowPassword((s) => !s)} />
            </div>
          </div>

          <div className="mb-1">
            <label htmlFor="confirmPassword" className="block text-[10.5px] sm:text-xs font-semibold text-[#241a1a] mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                required
                className="w-full px-3.5 py-3 rounded-xl border-[1.5px] border-[#eee2da] text-[12.5px] sm:text-sm bg-[#fff8f1] text-[#241a1a]
                           placeholder:text-[#6b5d56] placeholder:font-medium
                           outline-none transition-colors focus:border-[#f7941d]
                           focus:ring-4 focus:ring-[#f7941d]/20"
              />
              <EyeToggle shown={showConfirm} onClick={() => setShowConfirm((s) => !s)} />
            </div>
          </div>

          {error && (
            <p className="text-[11px] sm:text-[12.5px] text-[#ed1c24] font-medium mt-3 mb-1 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-xl py-3.5 text-[13px] sm:text-[15px] font-bold tracking-wide text-white cursor-pointer
                       bg-linear-to-br from-[#f7941d] to-[#ed1c24]
                       shadow-[0_12px_20px_-8px_rgba(237,28,36,0.55)]
                       transition-transform hover:-translate-y-0.5 active:translate-y-0
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#241a1a] focus-visible:outline-offset-2
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? "Please wait..." : "Update Password"}
          </button>
        </form>
      )}

      <div className="text-center mt-5 text-[10.5px] sm:text-xs text-[#8a7d78]">
        Having trouble? <br />
        <strong className="text-[#241a1a]">Contact the school office</strong> for support.
      </div>
    </Shell>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChangePasswordForm />
    </Suspense>
  );
}