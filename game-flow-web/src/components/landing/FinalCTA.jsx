import * as React from "react"
import { ArrowRight, Play } from "lucide-react"
import { Link } from "react-router-dom"
import ctaWarriorImg from "../../assets/cta-warrior.png"

export function FinalCTA() {
  return (
    <section className="px-5 pb-5 pt-3 relative z-10">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d0d0d 0%, #111111 100%)",
          border: "1px solid rgba(255,106,0,0.2)",
          boxShadow: "0 0 60px -15px rgba(255,106,0,0.2)"
        }}
      >
        {/* Orange glow right side */}
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full pointer-events-none z-0"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(255,106,0,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "linear-gradient(to right, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.3) 60%, transparent 100%)"
          }}
        />

        <div className="grid grid-cols-12 gap-6 items-center px-8 py-10 relative z-10">
          
          {/* Left Column Content */}
          <div className="col-span-12 md:col-span-7 flex flex-col items-start text-left">
            <h2
              className="font-space font-extrabold text-white tracking-tight leading-tight mb-3 uppercase"
              style={{ fontSize: "clamp(1.8rem, 3vw, 3rem)" }}
            >
              Your Creative Journey <br />
              <span style={{ color: "#FF6A00" }}>Starts Here.</span>
            </h2>
            <p className="text-[#A3A3A3] max-w-md mb-6 leading-relaxed" style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)" }}>
              Join thousands of creators and fans today. Showcase your work, connect with the community, and build your creative legacy.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link to="/signup">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-all duration-200"
                  style={{ background: "#FF6A00", boxShadow: "0 4px 24px rgba(255,106,0,0.35)" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#FF7A1A"
                    e.currentTarget.style.boxShadow = "0 6px 32px rgba(255,106,0,0.5)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#FF6A00"
                    e.currentTarget.style.boxShadow = "0 4px 24px rgba(255,106,0,0.35)"
                  }}
                >
                  Join For Free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <a href="#explore">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold text-white/80 transition-all duration-200"
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
                  Explore Platform <Play className="h-4 w-4" />
                </button>
              </a>
            </div>
          </div>

          {/* Right Column — Warrior image */}
          <div className="col-span-12 md:col-span-5 hidden md:flex justify-center items-center relative h-full min-h-[220px]">
            <img
              src={ctaWarriorImg}
              alt="Creative Journey"
              className="h-64 w-auto object-contain"
              style={{
                filter: "drop-shadow(0 0 30px rgba(255,106,0,0.4)) drop-shadow(0 0 60px rgba(255,106,0,0.15))",
              }}
            />
          </div>

        </div>
      </div>
    </section>
  )
}
