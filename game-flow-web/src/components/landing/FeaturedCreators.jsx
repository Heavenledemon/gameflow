import * as React from "react"
import { useState } from "react"
import { Check } from "lucide-react"
import { creators } from "../../data/landingData"

export function FeaturedCreators() {
  const [following, setFollowing] = useState({})

  const toggleFollow = (id) => {
    setFollowing((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <section id="creators" className="p-4 relative z-10">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-space text-sm font-bold text-white tracking-tight">
          Featured Creators
        </h2>
        <a
          href="#"
          className="text-[10px] font-semibold flex items-center gap-1 group"
          style={{ color: "#FF6A00" }}
        >
          View all <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {creators.map((creator) => {
          const isFollowing = following[creator.id]

          return (
            <div
              key={creator.id}
              className="group relative flex flex-col justify-between items-center text-center p-3 rounded-xl transition-all duration-300 hover:border-[rgba(255,106,0,0.4)]"
              style={{
                background: "rgba(17,17,17,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Verified badge dot */}
              {creator.verified && (
                <div
                  className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center"
                  style={{
                    background: "#FF6A00",
                    fontSize: "8px",
                    color: "white"
                  }}
                >
                  ✓
                </div>
              )}
              
              {/* Profile Wrapper */}
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div
                  className="h-14 w-14 rounded-full overflow-hidden mb-2 border-2 transition-colors duration-300 group-hover:border-[#FF6A00]"
                  style={{ borderColor: "rgba(255,106,0,0.25)" }}
                >
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Name */}
                <h3 className="font-space text-[11px] font-bold text-white tracking-tight mb-0.5 leading-tight">
                  {creator.name}
                </h3>

                {/* Role */}
                <span className="text-[10px] font-medium mb-1" style={{ color: "#FF6A00" }}>
                  {creator.role}
                </span>

                {/* Follower Count */}
                <span className="text-[9px] text-[#A3A3A3]">
                  {creator.followers}
                </span>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => toggleFollow(creator.id)}
                className="w-full mt-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200"
                style={
                  isFollowing
                    ? {
                        background: "transparent",
                        border: "1px solid rgba(255,106,0,0.4)",
                        color: "#A3A3A3"
                      }
                    : {
                        background: "#FF6A00",
                        border: "1px solid #FF6A00",
                        color: "white"
                      }
                }
                onMouseEnter={e => {
                  if (!isFollowing) {
                    e.currentTarget.style.background = "#FF7A1A"
                  }
                }}
                onMouseLeave={e => {
                  if (!isFollowing) {
                    e.currentTarget.style.background = "#FF6A00"
                  }
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
