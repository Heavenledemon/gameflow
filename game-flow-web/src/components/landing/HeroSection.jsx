import * as React from "react"
import { motion } from "framer-motion"
import { Gamepad2, Box, Play, Sparkles, Music, Paintbrush, ArrowRight, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import heroCharacterImg from "../../assets/hero-character-transparent.png"

/* ─── Category pills that float around the character ─── */
const floatingPills = [
  {
    title: "Game Design",
    Icon: Gamepad2,
    delay: 0,
    style: { top: "15%", left: "-2%" },
    imgUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=100&auto=format&fit=crop",
  },
  {
    title: "3D Art",
    Icon: Box,
    delay: 0.5,
    style: { top: "48%", left: "0%" },
    imgUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100&auto=format&fit=crop",
  },
  {
    title: "Animation",
    Icon: Play,
    delay: 0.2,
    style: { top: "15%", right: "-2%" },
    imgUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=100&auto=format&fit=crop",
  },
  {
    title: "VFX",
    Icon: Sparkles,
    delay: 0.7,
    style: { bottom: "22%", left: "0%" },
    imgUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=100&auto=format&fit=crop",
  },
  {
    title: "Music",
    Icon: Music,
    delay: 0.35,
    style: { top: "48%", right: "0%" },
    imgUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=100&auto=format&fit=crop",
  },
  {
    title: "Concept Art",
    Icon: Paintbrush,
    delay: 0.6,
    style: { bottom: "22%", right: "0%" },
    imgUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=100&auto=format&fit=crop",
  },
]

const avatarUrls = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=80&auto=format&fit=crop",
]

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "radial-gradient(ellipse at 60% 50%, rgba(255,106,0,0.07) 0%, transparent 70%), #050505",
      }}
    >
      {/* ══════════ BACKGROUND LAYER ══════════ */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Left orange bloom */}
        <div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: "5%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(255,106,0,0.12) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Right bloom */}
        <div
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: "-5%",
            right: "-10%",
            background: "radial-gradient(circle, rgba(255,106,0,0.09) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* ══════════ CONTENT ══════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 py-10 lg:py-16">
          {/* On large screens - show as 2 cols */}

          {/* ─────────── LEFT COLUMN ─────────── */}
          <div className="flex flex-col items-start text-left pr-0 lg:pr-8">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "#FF6A00" }}
              >
                Showcase · Create · Inspire
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-5 font-space font-extrabold uppercase tracking-tight text-white"
              style={{
                fontSize: "clamp(2.6rem, 5vw, 4.5rem)",
                lineHeight: 1.05,
              }}
            >
              Where<br />
              Creativity<br />
              Meets<br />
              <span style={{ color: "#FF6A00", fontStyle: "italic" }}>Inspiration</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-7 text-[#A3A3A3] leading-relaxed"
              style={{ maxWidth: 420, fontSize: "clamp(0.82rem, 1.2vw, 0.95rem)" }}
            >
              CreativeVerse is the ultimate destination for creators. Showcase games,
              3D art, animation, VFX, comics, music, and interactive experiences
              while building your creative community.
            </motion.p>

            {/* CTA Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-7 flex flex-wrap gap-3"
            >
              <Link to="/signup">
                <button
                  type="button"
                  className="group inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-all duration-200"
                  style={{
                    background: "#FF6A00",
                    boxShadow: "0 4px 24px rgba(255,106,0,0.35)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#FF7A1A"
                    e.currentTarget.style.boxShadow = "0 6px 32px rgba(255,106,0,0.5)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#FF6A00"
                    e.currentTarget.style.boxShadow = "0 4px 24px rgba(255,106,0,0.35)"
                  }}
                >
                  Join CreativeVerse
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>

              <a href="#creators">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold text-white/90 transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,106,0,0.1)"
                    e.currentTarget.style.borderColor = "rgba(255,106,0,0.4)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"
                  }}
                >
                  Explore Creators
                  <ChevronRight className="h-4 w-4" />
                </button>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2.5">
                {avatarUrls.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Creator ${i + 1}`}
                    className="h-8 w-8 rounded-full object-cover"
                    style={{ border: "2px solid #050505" }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: "#A3A3A3" }}>
                Trusted by thousands<br />
                <span className="font-semibold text-white">of creators worldwide.</span>
              </p>
            </motion.div>
          </div>

          {/* ─────────── RIGHT COLUMN — Character ─────────── */}
          <div
            className="relative flex justify-center items-end"
            style={{ height: "clamp(380px, 58vh, 620px)" }}
          >
            {/* Orange ground glow */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: "60%",
                height: 80,
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                background: "radial-gradient(ellipse, rgba(255,106,0,0.45) 0%, transparent 75%)",
                filter: "blur(20px)",
              }}
            />
            {/* Halo ring */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute pointer-events-none rounded-full"
              style={{
                width: "50%",
                height: "50%",
                bottom: "8%",
                left: "50%",
                transform: "translateX(-50%)",
                border: "1px solid rgba(255,106,0,0.2)",
                boxShadow: "inset 0 0 40px rgba(255,106,0,0.05), 0 0 40px rgba(255,106,0,0.05)",
              }}
            />

            {/* Character image */}
            <motion.img
              src={heroCharacterImg}
              alt="3D Creator Character"
              className="relative z-10 select-none pointer-events-none"
              style={{
                height: "100%",
                width: "auto",
                objectFit: "contain",
                objectPosition: "bottom",
                filter: "drop-shadow(0 0 40px rgba(255,106,0,0.5)) drop-shadow(0 0 100px rgba(255,106,0,0.2))",
                mixBlendMode: "screen",
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -12, 0] }}
              transition={{
                opacity: { duration: 0.9, ease: "easeOut", delay: 0.2 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
              }}
            />

            {/* Floating category pills */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              {floatingPills.map((pill) => (
                <motion.div
                  key={pill.title}
                  className="absolute hidden sm:flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-default select-none"
                  style={{
                    ...pill.style,
                    background: "rgba(17,17,17,0.88)",
                    border: "1px solid rgba(255,106,0,0.22)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    minWidth: 110,
                  }}
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + pill.delay, duration: 0.4, ease: "backOut" }}
                  whileHover={{
                    scale: 1.08,
                    borderColor: "rgba(255,106,0,0.5)",
                    transition: { duration: 0.18 },
                  }}
                >
                  <div
                    className="relative h-7 w-7 shrink-0 rounded-lg overflow-hidden"
                    style={{ border: "1px solid rgba(255,106,0,0.2)" }}
                  >
                    <img
                      src={pill.imgUrl}
                      alt={pill.title}
                      className="h-full w-full object-cover opacity-60"
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <pill.Icon className="h-3 w-3" style={{ color: "#FF6A00" }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-white/90 leading-tight">
                    {pill.title}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
