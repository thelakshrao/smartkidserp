"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Luckiest_Guy, Baloo_2 } from "next/font/google";
import hero1 from "@/images/hero1.jpg";
import hero2 from "@/images/hero2.jpg";
import hero3 from "@/images/hero3.jpg";
import hero4 from "@/images/hero4.jpg";
import lineart1 from "@/images/lineart1.png";
import lineart2 from "@/images/lineart2.png";
import lineart3 from "@/images/lineart3.png";
import lineart4 from "@/images/lineart4.png";
import lineart5 from "@/images/lineart5.png";
import lineart6 from "@/images/lineart6.png";
import lineart7 from "@/images/lineart7.png";
import lineart8 from "@/images/lineart8.png";
import lineart9 from "@/images/lineart9.png";
import logo from "@/images/logo.png";

const heroImages = [hero1, hero2, hero3, hero4];

const luckiestGuy = Luckiest_Guy({ subsets: ["latin"], weight: "400" });
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const letterColors = [
  "#EF6C5C",
  "#3FA9D8",
  "#F5B93F",
  "#5FBF7A",
  "#E85D9C",
  "#F08C3A",
];

const smartKidzLetters = "SMART KIDS".split("");

const letterVariants = {
  hidden: { y: -120, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.07,
      type: "spring",
      stiffness: 480,
      damping: 12,
    },
  }),
};

const entranceDelay = smartKidzLetters.length * 0.07 + 0.55;

export default function LoginPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FBF3E7]">
      {heroImages.map((img, i) => (
        <Image
          key={i}
          src={img}
          alt=""
          fill
          priority={i === 0}
          className="object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === heroIndex ? 1 : 0 }}
        />
      ))}

      <div className="absolute inset-0 bg-[#FBF3E7]/70" />

      <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-sky-200/60 blur-2xl lg:h-80 lg:w-80" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-64 w-64 rounded-full bg-rose-200/50 blur-2xl lg:h-96 lg:w-96" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 h-52 w-52 rounded-full bg-amber-100/60 blur-2xl lg:h-72 lg:w-72" />

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -left-10 -top-10 w-40 text-rose-200/70 lg:w-64"
      >
        <path
          fill="currentColor"
          d="M48.8,-56.6C61.9,-45.2,70,-25.9,70.7,-6.6C71.4,12.7,64.7,32,52.1,45.9C39.5,59.8,21,68.3,1.2,66.7C-18.6,65.1,-37.2,53.4,-49.8,37.6C-62.4,21.8,-69,1.9,-65.3,-15.9C-61.6,-33.7,-47.6,-49.4,-31.4,-60.4C-15.2,-71.4,3.2,-77.7,20.1,-73.9C37,-70.1,52.4,-56.2,48.8,-56.6Z"
          transform="translate(100 100)"
        />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-12 top-[8%] w-32 text-sky-200/70 lg:w-52"
      >
        <path
          fill="currentColor"
          d="M42.6,-52.3C53.4,-42.1,58.7,-25.9,60.6,-9.3C62.5,7.3,61,24.4,52.2,36.8C43.4,49.2,27.3,56.9,10.1,60.5C-7.1,64.1,-25.4,63.6,-39.6,55.5C-53.8,47.4,-63.9,31.7,-67.4,14.2C-70.9,-3.3,-67.8,-22.6,-57.6,-36.9C-47.4,-51.2,-30.1,-60.5,-12.6,-62.7C4.9,-64.9,32,-62.5,42.6,-52.3Z"
          transform="translate(100 100)"
        />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -left-16 bottom-[6%] w-44 text-amber-200/60 lg:w-72"
      >
        <path
          fill="currentColor"
          d="M39.4,-49.9C50.4,-40.3,58.5,-27.4,62.1,-12.6C65.7,2.1,64.8,18.7,57.3,31.7C49.8,44.7,35.7,54.1,19.9,60.1C4.1,66.1,-13.4,68.7,-29.5,63.7C-45.6,58.7,-60.3,46.1,-67.1,29.9C-73.9,13.7,-72.8,-6.1,-65.1,-22.4C-57.4,-38.7,-43.1,-51.5,-28,-59.4C-12.9,-67.3,3,-70.3,17.4,-66.3C31.8,-62.3,44.7,-51.3,39.4,-49.9Z"
          transform="translate(100 100)"
        />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-14 bottom-[14%] w-36 text-rose-200/60 lg:w-60"
      >
        <path
          fill="currentColor"
          d="M44.7,-54.2C56.9,-45.1,64.9,-29.8,67.4,-13.4C69.9,3,66.9,20.5,58.1,34.5C49.3,48.5,34.7,58.9,18.2,64.3C1.7,69.7,-16.7,70.1,-32.9,63.9C-49.1,57.7,-63.1,45,-69.5,29C-75.9,13,-74.7,-6.3,-67.4,-22.3C-60.1,-38.3,-46.7,-51,-32,-58.9C-17.3,-66.8,-1.3,-69.9,13.5,-66.7C28.3,-63.5,32.5,-63.3,44.7,-54.2Z"
          transform="translate(100 100)"
        />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute left-[38%] top-[-4%] w-24 text-sky-100/70 lg:w-40"
      >
        <path
          fill="currentColor"
          d="M35.9,-45.1C46.4,-37.4,54.5,-24.9,57.8,-10.9C61.1,3.1,59.6,18.6,52.2,30.9C44.8,43.2,31.5,52.3,16.7,57.4C1.9,62.5,-14.4,63.6,-28.9,58.3C-43.4,53,-56.1,41.3,-62.4,26.7C-68.7,12.1,-68.6,-5.4,-62.1,-19.9C-55.6,-34.4,-42.7,-45.9,-29.1,-52.9C-15.5,-59.9,-1.2,-62.4,10.9,-59.5C23,-56.6,25.4,-52.8,35.9,-45.1Z"
          transform="translate(100 100)"
        />
      </svg>

      <Image
        src={lineart1}
        alt=""
        className="pointer-events-none absolute left-[6%] top-[10%] w-12 rotate-[-8deg] opacity-70 lg:w-24 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart2}
        alt=""
        className="pointer-events-none absolute right-[10%] top-[6%] w-7 -rotate[10deg] opacity-70 lg:w-12 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart3}
        alt=""
        className="pointer-events-none absolute left-[4%] bottom-[8%] w-16 -rotate[6deg] opacity-70 lg:w-36 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(300deg)]"
      />
      <Image
        src={lineart4}
        alt=""
        className="pointer-events-none absolute right-[6%] bottom-[12%] w-10 -rotate[-6deg] opacity-60 lg:w-20 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart5}
        alt=""
        className="pointer-events-none absolute right-[22%] top-[38%] w-6 -rotate[12deg] opacity-60 lg:w-10 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart2}
        alt=""
        className="pointer-events-none absolute left-[18%] top-[46%] w-5 rotate-[-14deg] opacity-50 lg:w-8 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart4}
        alt=""
        className="pointer-events-none absolute left-[42%] bottom-[4%] w-8 -rotate[4deg] opacity-50 lg:w-14 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart6}
        alt=""
        className="pointer-events-none absolute right-[2%] top-[42%] w-20 rotate-[-10deg] opacity-60 lg:w-44 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(300deg)]"
      />
      <Image
        src={lineart7}
        alt=""
        className="pointer-events-none absolute left-[30%] top-[4%] w-6 -rotate[8deg] opacity-60 lg:w-10 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart8}
        alt=""
        className="pointer-events-none absolute right-[36%] bottom-[2%] w-20 -rotate[-4deg] opacity-60 lg:w-40 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart9}
        alt=""
        className="pointer-events-none absolute left-[2%] top-[52%] w-8 -rotate[10deg] opacity-50 lg:w-16 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart5}
        alt=""
        className="pointer-events-none absolute left-[48%] top-[16%] w-6 -rotate[-6deg] opacity-40 lg:w-12 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(300deg)]"
      />
      <Image
        src={lineart7}
        alt=""
        className="pointer-events-none absolute left-[52%] bottom-[18%] w-7 -rotate[8deg] opacity-40 lg:w-14 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4 py-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:px-12 lg:py-10">
        <div className="flex w-full max-w-lg flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex flex-wrap justify-center lg:justify-start">
            {smartKidzLetters.map((letter, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className={luckiestGuy.className}
                style={{
                  color:
                    letter === " "
                      ? "transparent"
                      : letterColors[i % letterColors.length],
                  fontSize: "clamp(2rem, 6vw, 4.5rem)",
                  lineHeight: 1,
                  textShadow: "3px 3px 0 rgba(74,46,41,0.25)",
                  marginRight: letter === " " ? "0.6rem" : "0.02em",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: entranceDelay + 0.2,
              duration: 0.6,
              ease: "easeOut",
            }}
            className={`${baloo.className} mt-2 text-lg font-bold tracking-wide text-[#3D2C28] lg:text-3xl`}
          >
            Convent School
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: entranceDelay + 0.4,
              duration: 0.6,
              ease: "easeOut",
            }}
            className={`${baloo.className} mt-3 max-w-xs text-sm font-medium text-[#E8558B] lg:mt-5 lg:max-w-md lg:text-xl`}
          >
            Where little hands learn, little hearts grow, and little minds shine
            bright!
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0, duration: 1, ease: "easeOut" }}
          className={`${baloo.className} w-full max-w-xs rounded-2xl bg-white/90 p-5 shadow-xl backdrop-blur-md lg:max-w-sm lg:rounded-3xl lg:p-8`}
        >
          <div className="mb-6 flex items-center gap-3 lg:mb-8 lg:gap-4">
            <Image
              src={logo}
              alt="Smart Kids School"
              className="h-12 w-12 lg:h-16 lg:w-16"
            />
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight lg:text-xl">
                Smart Kids School
              </h1>
              <p className="text-xs text-slate-400 lg:text-sm">
                Heera Nagar, Gurugram
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 lg:text-2xl">
            Welcome!
          </h2>
          <p className="mt-1 text-xs text-slate-500 lg:text-sm">
            Access your account by entering your credentials.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 lg:mt-8 lg:space-y-6"
          >
            <div>
              <label className="block text-xs text-slate-500 mb-1 lg:text-sm">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border-b border-slate-300 pb-2 text-sm text-slate-800 focus:border-[#EF6C5C] focus:outline-none lg:text-base"
              />
            </div>

            <div className="relative">
              <label className="block text-xs text-slate-500 mb-1 lg:text-sm">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-slate-300 pb-2 pr-8 text-sm text-slate-800 focus:border-[#EF6C5C] focus:outline-none lg:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 bottom-2 text-slate-400"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4 lg:h-5 lg:w-5"
                  >
                    <path d="M3 3l18 18" strokeLinecap="round" />
                    <path
                      d="M10.6 10.6a2 2 0 002.8 2.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9.5 5.4A9.6 9.6 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.3 3.5M6.1 6.6C4 8 2.6 10 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4 lg:h-5 lg:w-5"
                  >
                    <path
                      d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs text-slate-500 hover:text-[#EF6C5C] lg:text-sm"
              >
                Forgot Password?
              </a>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full rounded-xl bg-linear-to-r from-[#F5A24A] to-[#EF6C5C] py-2.5 text-sm font-bold text-white shadow-md lg:py-3 lg:text-base cursor-pointer"
            >
              LOGIN
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
