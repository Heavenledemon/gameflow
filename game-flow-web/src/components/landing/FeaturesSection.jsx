import * as React from "react"
import { CloudUpload, Compass, Users2, TrendingUp } from "lucide-react"
import { features } from "../../data/landingData"

const iconMap = {
  CloudUpload: CloudUpload,
  Compass: Compass,
  Users2: Users2,
  TrendingUp: TrendingUp
}

export function FeaturesSection() {
  return (
    <section className="p-5 relative z-10">
      
      {/* Section Header */}
      <div className="mb-5">
        <h2 className="font-space text-xl font-extrabold text-white mb-1 leading-tight">
          Built For
          <br />
          <span className="text-[#FF6A00]">Modern Creators</span>
        </h2>
      </div>

      {/* Features Grid — 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {features.map((feature) => {
          const Icon = iconMap[feature.iconName]
          return (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:border-[rgba(255,106,0,0.4)]"
              style={{
                background: "rgba(17,17,17,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Orange glow */}
              <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-[#FF6A00]/5 blur-[30px] pointer-events-none group-hover:bg-[#FF6A00]/10 transition-colors duration-300" />
              
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: "rgba(255,106,0,0.1)",
                  border: "1px solid rgba(255,106,0,0.25)",
                  color: "#FF6A00"
                }}
              >
                {Icon && <Icon className="h-4 w-4" />}
              </div>
              
              <h3 className="font-space text-sm font-bold text-white tracking-tight mb-1.5">
                {feature.title}
              </h3>
              <p className="text-[10px] text-[#A3A3A3] leading-relaxed">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
