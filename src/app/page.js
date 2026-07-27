"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import logo from "../images/logo.png";
import hero1 from "../images/hero1.png";
import hero2 from "../images/hero2.png";
import hero3 from "../images/hero3.png";
import hero4 from "../images/hero4.png";

const SLIDES = [
  {
    img: hero1,
    eyebrow: "Every day at Smart Kids",
    title: "Building strong foundations, together",
  },
  {
    img: hero3,
    eyebrow: "In the classroom",
    title: "Smart classrooms for curious minds",
  },
  {
    img: hero2,
    eyebrow: "Beyond the classroom",
    title: "Learning that grows with every question",
  },
  {
    img: hero4,
    eyebrow: "Anywhere, anytime",
    title: "A campus that travels home with you",
  },
];

const SLIDE_DURATION = 4000; 
const EASE = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const [current, setCurrent] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ userid: "", password: "" });

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("login submit", form);
  }

  const slide = SLIDES[current];

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#2a1810] p-4 sm:p-7">
      <div
        className="relative w-full max-w-295 min-h-170 rounded-4xl overflow-hidden
                   shadow-[0_50px_90px_-30px_rgba(0,0,0,0.55)]
                   bg-[radial-gradient(1100px_500px_at_15%_-10%,rgba(255,255,255,0.14),transparent_60%),linear-gradient(135deg,#f7941d_0%,#f15a24_42%,#ed1c24_100%)]
                   grid grid-cols-1 md:grid-cols-[1.15fr_1fr]"
      >
        <div className="relative flex flex-col text-white p-8 sm:p-12 md:pb-10 overflow-hidden">
          <div className="flex items-center gap-3.5 mb-10 md:mb-12">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(0,0,0,0.25)]">
              <Image
                src={logo}
                alt="Smart Kids Convent School logo"
                width={42}
                height={42}
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[19px]">
                Smart Kids Convent School
              </div>
              <div className="text-[12.5px] opacity-85 font-medium">
                Heera Nagar, Gurugram
              </div>
            </div>
          </div>

          <h1 className="font-extrabold text-[34px] sm:text-[46px] leading-[1.08] mb-3.5 drop-shadow-[0_6px_22px_rgba(0,0,0,0.15)]">
            Hey, Hello!
          </h1>
          <p className="text-[15.5px] max-w-105 opacity-90 font-medium mb-auto">
            Sign in to the Student ERP Portal to track attendance, homework,
            exams and school updates — all in one place.
          </p>

          <div className="relative mt-6 flex-1 flex items-end min-h-47.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-end gap-5 w-full"
              >
                <motion.div
                  initial={{ opacity: 0, x: -80 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
                  className="w-32.5 h-32.5 sm:w-52.5 sm:h-52.5 shrink-0 flex items-end justify-center drop-shadow-[0_18px_20px_rgba(0,0,0,0.25)]"
                >
                  <Image
                    src={slide.img}
                    alt=""
                    width={210}
                    height={210}
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
                  className="pb-4"
                >
                  <div className="text-[11.5px] font-bold tracking-[1.6px] uppercase opacity-80 mb-1.5">
                    {slide.eyebrow}
                  </div>
                  <div className="font-bold text-[18px] sm:text-[22px] leading-snug max-w-[320px]">
                    {slide.title}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mt-6">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="w-6.5 h-1.25 rounded-full bg-white/35 overflow-hidden relative"
              >
                {i < current && <span className="absolute inset-0 bg-white" />}
                {i === current && (
                  <motion.span
                    key={current}
                    className="absolute inset-0 bg-white origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: SLIDE_DURATION / 1000,
                      ease: "linear",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-end justify-center px-6 sm:px-9 pt-6 sm:pt-9 pb-0">
          <motion.div
            initial={{ y: "140%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-100 bg-white rounded-t-[26px] rounded-b-none p-8 sm:p-10 pt-9 sm:pt-10
                       shadow-[0_30px_60px_-20px_rgba(150,20,20,0.35)]"
          >
            <div className="w-16 h-16 rounded-full border border-[#eee2da] flex items-center justify-center mx-auto mb-4">
              <Image
                src={logo}
                alt=""
                width={48}
                height={48}
                className="object-contain"
              />
            </div>

            <h1 className="font-bold text-[25px] text-[#241a1a] text-center mb-1.5">
              Welcome!
            </h1>
            <p className="text-center text-[13.5px] font-semibold text-[#ed1c24] mb-1">
              Smart Kids Convent School
            </p>
            <p className="text-center text-xs text-[#8a7d78] mb-6">
              Heera Nagar, Gurugram
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="userid"
                  className="block text-xs font-semibold text-[#241a1a] mb-1.5"
                >
                  User ID
                </label>
                <input
                  type="text"
                  id="userid"
                  name="userid"
                  value={form.userid}
                  onChange={handleChange}
                  placeholder="Enter your User ID"
                  autoComplete="username"
                  required
                  className="w-full px-3.5 py-3 rounded-xl border-[1.5px] border-[#eee2da] text-sm bg-[#fff8f1]
                             outline-none transition-colors focus:border-[#f7941d]
                             focus:ring-4 focus:ring-[#f7941d]/20"
                />
              </div>

              <div className="mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#241a1a] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full px-3.5 py-3 rounded-xl border-[1.5px] border-[#eee2da] text-sm bg-[#fff8f1]
                               outline-none transition-colors focus:border-[#f7941d]
                               focus:ring-4 focus:ring-[#f7941d]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7d78] p-1
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f7941d] rounded-md"
                  >
                    {showPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.68 3.9M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end my-3">
                <a
                  href="#"
                  className="text-[12.5px] font-semibold text-[#ed1c24] hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3.5 text-[15px] font-bold tracking-wide text-white
                           bg-linear-to-br from-[#f7941d] to-[#ed1c24]
                           shadow-[0_12px_20px_-8px_rgba(237,28,36,0.55)]
                           transition-transform hover:-translate-y-0.5 active:translate-y-0
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#241a1a] focus-visible:outline-offset-2"
              >
                Login
              </button>
            </form>

            <div className="text-center mt-5 text-xs text-[#8a7d78]">
              Having trouble signing in? <br />
              <strong className="text-[#241a1a]">
                Contact the school office
              </strong>{" "}
              for support.
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
