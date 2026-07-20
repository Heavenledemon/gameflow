import * as React from "react"
import { 
  Gamepad2, Box, Play, Sparkles, Activity, 
  Paintbrush, BookOpen, Camera, Music, Cpu 
} from "lucide-react"
import { categories } from "../../data/landingData"

const iconMap = {
  Gamepad2: Gamepad2,
  Box: Box,
  Play: Play,
  Sparkles: Sparkles,
  Activity: Activity,
  Paintbrush: Paintbrush,
  BookOpen: BookOpen,
  Camera: Camera,
  Music: Music,
  Cpu: Cpu
}

export function CategoriesSection() {
  return (
    <section id="categories" className="p-5 relative z-10">
      
      {/* Section Heading */}
      <div className="mb-5">
        <h2 className="font-space text-xl font-extrabold text-white mb-1 leading-tight">
          Everything Creative.
          <br />
          <span className="text-[#FF6A00]">One Platform.</span>
        </h2>
      </div>

      {/* Categories Grid — 2 rows of 5 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {categories.map((cat) => {
          const Icon = iconMap[cat.iconName]
          return (
            <div
              key={cat.id}
              className="group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(255,106,0,0.5)]"
              style={{
                height: 60,
                background: "rgba(17,17,17,0.9)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={cat.imageUrl}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-30 group-hover:opacity-50"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Card Contents */}
              <div className="absolute inset-0 p-2 flex flex-col justify-between items-start">
                <div
                  className="h-5 w-5 rounded flex items-center justify-center"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#FF6A00"
                  }}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                </div>
                
                <h3 className="font-space text-[10px] font-bold text-white tracking-tight leading-tight">
                  {cat.title}
                </h3>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
