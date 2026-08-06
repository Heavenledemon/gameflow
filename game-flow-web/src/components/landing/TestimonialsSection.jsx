import * as React from "react"
import { Star } from "lucide-react"
import { testimonials } from "../../data/landingData"

export function TestimonialsSection() {
  return (
    <section className="p-4 relative z-10">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-space text-sm font-bold text-white tracking-tight leading-tight">
          Why Creators Love ScopeCanvas
        </h2>
        <a
          href="#"
          className="text-[10px] font-semibold flex items-center gap-1 group shrink-0 ml-2"
          style={{ color: "#FF6A00" }}
        >
          View all <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {testimonials.map((test) => {
          const initials = test.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)

          return (
            <div
              key={test.id}
              className="flex flex-col justify-between p-3 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-[rgba(255,106,0,0.35)]"
              style={{
                background: "rgba(17,17,17,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Quote Content */}
              <div className="flex-1 text-left">
                <span className="text-lg font-serif leading-none select-none" style={{ color: "rgba(255,106,0,0.3)" }}>"</span>
                <p className="text-[10px] text-white leading-relaxed italic -mt-1">
                  {test.quote}
                </p>
              </div>

              {/* Author & Stars */}
              <div className="flex flex-col gap-2 mt-3">
                {/* Star rating */}
                <div className="flex items-center gap-0.5">
                  {[...Array(test.stars)].map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 shrink-0" style={{ fill: "#FF6A00", color: "#FF6A00" }} />
                  ))}
                </div>

                {/* Profile info */}
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-white/10">
                    <img src={test.avatarUrl} alt={test.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-space text-[10px] font-bold text-white leading-tight">
                      {test.name}
                    </h4>
                    <span className="text-[9px] text-[#A3A3A3]">
                      {test.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
