import * as React from "react"
import { Sparkles, Send, Compass, Users, DollarSign } from "lucide-react"
import { journeySteps } from "../../data/landingData"

const iconMap = {
  Sparkles: Sparkles,
  Send: Send,
  Compass: Compass,
  Users: Users,
  DollarSign: DollarSign
}

export function JourneySection() {
  return (
    <section className="p-4 relative z-10">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-space text-sm font-bold text-white tracking-tight">
          Your Creative Journey
        </h2>
        <a
          href="#"
          className="text-[10px] font-semibold flex items-center gap-1 group shrink-0"
          style={{ color: "#FF6A00" }}
        >
          View all <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>

      {/* Journey Steps - Horizontal connector with 5 steps */}
      <div className="relative">
        {/* Horizontal connecting line */}
        <div
          className="absolute top-[22px] left-[20px] right-[20px] h-px z-0"
          style={{ background: "linear-gradient(90deg, rgba(255,106,0,0.1), rgba(255,106,0,0.4), rgba(255,106,0,0.1))" }}
        />
        
        <div className="grid grid-cols-5 gap-2 relative z-10">
          {journeySteps.map((step, index) => {
            const Icon = iconMap[step.iconName]
            return (
              <div
                key={step.step}
                className="flex flex-col items-center text-center gap-2"
              >
                {/* Step icon circle */}
                <div className="relative">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: "#0d0d0d",
                      border: "2px solid rgba(255,106,0,0.5)",
                      color: "#FF6A00",
                      boxShadow: "0 0 12px rgba(255,106,0,0.15)"
                    }}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                  </div>
                  {/* Step number */}
                  <span
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{
                      background: "#0d0d0d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#A3A3A3"
                    }}
                  >
                    {step.step}
                  </span>
                </div>

                {/* Step Text */}
                <div>
                  <h3 className="font-space text-[11px] font-bold text-white mb-0.5">
                    {step.title}
                  </h3>
                  <p className="text-[9px] text-[#A3A3A3] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
