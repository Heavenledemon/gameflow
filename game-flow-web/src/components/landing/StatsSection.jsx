import * as React from "react"
import { Users, Briefcase, Layers, Gamepad2, Eye } from "lucide-react"
import { statistics } from "../../data/landingData"

const iconMap = {
  Users: Users,
  Briefcase: Briefcase,
  Layers: Layers,
  Gamepad2: Gamepad2,
  Eye: Eye
}

export function StatsSection() {
  return (
    <section className="w-full relative z-10">
      <div
        className="w-full"
        style={{
          background: "linear-gradient(90deg, #0d0d0d 0%, #111111 50%, #0d0d0d 100%)",
          borderTop: "1px solid rgba(255,106,0,0.12)",
          borderBottom: "1px solid rgba(255,106,0,0.12)",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between py-5 gap-6 md:gap-0">
            {statistics.map((stat, index) => {
              const Icon = iconMap[stat.iconName]
              return (
                <React.Fragment key={stat.id}>
                  {/* Stat Item */}
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(255,106,0,0.08)",
                        border: "1px solid rgba(255,106,0,0.2)",
                        color: "#FF6A00"
                      }}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-space text-2xl font-extrabold text-white tracking-tight leading-none">
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-[#A3A3A3] font-medium mt-0.5 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  {index < statistics.length - 1 && (
                    <div className="hidden md:block w-px h-8 bg-white/8" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
