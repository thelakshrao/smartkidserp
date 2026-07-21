'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Luckiest_Guy, Baloo_2 } from 'next/font/google'
import hero1 from '@/images/hero1.jpg'
import hero2 from '@/images/hero2.jpg'
import hero3 from '@/images/hero3.jpg'
import hero4 from '@/images/hero4.jpg'
import lineart1 from '@/images/lineart1.png'
import lineart2 from '@/images/lineart2.png'
import lineart3 from '@/images/lineart3.png'
import lineart4 from '@/images/lineart4.png'
import lineart5 from '@/images/lineart5.png'
import lineart6 from '@/images/lineart6.png'
import lineart7 from '@/images/lineart7.png'
import lineart8 from '@/images/lineart8.png'
import lineart9 from '@/images/lineart9.png'
import logo from '@/images/logo.png'

const heroImages = [hero1, hero2, hero3, hero4]

const luckiestGuy = Luckiest_Guy({ subsets: ['latin'], weight: '400' })
const baloo = Baloo_2({ subsets: ['latin'], weight: ['500', '600', '700', '800'] })

const letterColors = ['#EF6C5C', '#3FA9D8', '#F5B93F', '#5FBF7A', '#E85D9C', '#F08C3A']

const smartKidzLetters = 'SMART KIDS'.split('')

const letterVariants = {
  hidden: { y: -120, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.07,
      type: 'spring',
      stiffness: 480,
      damping: 12,
    },
  }),
}

const entranceDelay = smartKidzLetters.length * 0.07 + 0.55

export default function LoginPage() {
  const [heroIndex, setHeroIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
  }

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

      <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-sky-200/60 blur-2xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-rose-200/50 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-amber-100/60 blur-2xl" />

      <Image
        src={lineart1}
        alt=""
        className="pointer-events-none absolute left-[6%] top-[10%] w-24 -rotate[-8deg] opacity-70 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart2}
        alt=""
        className="pointer-events-none absolute right-[10%] top-[6%] w-12 -rotate[10deg] opacity-70 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart3}
        alt=""
        className="pointer-events-none absolute left-[4%] bottom-[8%] w-36 -rotate[6deg] opacity-70 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(300deg)]"
      />
      <Image
        src={lineart4}
        alt=""
        className="pointer-events-none absolute right-[6%] bottom-[12%] w-20 -rotate[-6deg] opacity-60 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart5}
        alt=""
        className="pointer-events-none absolute right-[22%] top-[38%] w-10 -rotate[12deg] opacity-60 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart2}
        alt=""
        className="pointer-events-none absolute left-[18%] top-[46%] w-8 rotate-[-14deg] opacity-50 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart4}
        alt=""
        className="pointer-events-none absolute left-[42%] bottom-[4%] w-14 rotate-[4deg] opacity-50 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart6}
        alt=""
        className="pointer-events-none absolute right-[2%] top-[42%] w-44 rotate-[-10deg] opacity-60 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(300deg)]"
      />
      <Image
        src={lineart7}
        alt=""
        className="pointer-events-none absolute left-[30%] top-[4%] w-10 rotate-[8deg] opacity-60 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart8}
        alt=""
        className="pointer-events-none absolute right-[36%] bottom-[2%] w-40 rotate-[-4deg] opacity-60 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(325deg)]"
      />
      <Image
        src={lineart9}
        alt=""
        className="pointer-events-none absolute left-[2%] top-[52%] w-16 -rotate[10deg] opacity-50 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />
      <Image
        src={lineart5}
        alt=""
        className="pointer-events-none absolute left-[48%] top-[16%] w-12 -rotate[-6deg] opacity-40 [filter:invert(63%)_sepia(59%)_saturate(4995%)_hue-rotate(300deg)]"
      />
      <Image
        src={lineart7}
        alt=""
        className="pointer-events-none absolute left-[52%] bottom-[18%] w-14 -rotate[8deg] opacity-40 [filter:invert(24%)_sepia(94%)_saturate(1352%)_hue-rotate(198deg)]"
      />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-between gap-10 px-8 py-10 lg:px-20">
        <div className="hidden max-w-lg flex-col lg:flex">
          <div className="flex flex-wrap">
            {smartKidzLetters.map((letter, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className={luckiestGuy.className}
                style={{
                  color: letter === ' ' ? 'transparent' : letterColors[i % letterColors.length],
                  fontSize: '4.5rem',
                  lineHeight: 1,
                  textShadow: '3px 3px 0 rgba(74,46,41,0.25)',
                  marginRight: letter === ' ' ? '1rem' : '0.02em',
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: entranceDelay + 0.2, duration: 0.6, ease: 'easeOut' }}
            className={`${baloo.className} mt-2 text-3xl font-bold tracking-wide text-[#3D2C28]`}
          >
            Convent School
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: entranceDelay + 0.4, duration: 0.6, ease: 'easeOut' }}
            className={`${baloo.className} mt-5 max-w-md text-xl font-medium text-[#E8558B]`}
          >
            Where little hands learn, little hearts grow, and little minds shine bright!
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0, duration: 1, ease: 'easeOut' }}
          className={`${baloo.className} w-full max-w-sm rounded-3xl bg-white/90 p-8 shadow-xl backdrop-blur-md`}
        >
          <div className="mb-8 flex items-center gap-4">
            <Image src={logo} alt="Smart Kids School" className="h-16 w-16" />
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Smart Kids School</h1>
              <p className="text-sm text-slate-400">Heera Nagar, Gurugram</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Welcome!</h2>
          <p className="mt-1 text-sm text-slate-500">Access your account by entering your credentials.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm text-slate-500 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border-b border-slate-300 pb-2 text-slate-800 focus:border-[#EF6C5C] focus:outline-none"
              />
            </div>

            <div className="relative">
              <label className="block text-sm text-slate-500 mb-1">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-slate-300 pb-2 pr-8 text-slate-800 focus:border-[#EF6C5C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 bottom-2 text-slate-400"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M3 3l18 18" strokeLinecap="round" />
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
                    <path d="M9.5 5.4A9.6 9.6 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.3 3.5M6.1 6.6C4 8 2.6 10 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-slate-500 hover:text-[#EF6C5C]">Forgot Password?</a>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full rounded-xl bg-linear-to-r from-[#F5A24A] to-[#EF6C5C] py-3 font-bold text-white shadow-md"
            >
              LOGIN
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}