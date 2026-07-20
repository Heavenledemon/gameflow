import * as React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Search, Menu, ArrowRight } from "lucide-react"
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet"
import { navLinks } from "../../data/landingData"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0a0a0a] border-b border-white/5">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <nav className="flex h-[56px] items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <a href="#" className="flex items-center gap-2 font-space text-xl font-bold tracking-tight text-white">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-black"
                style={{ background: "linear-gradient(135deg, #FF6A00, #FF9E00)" }}
              >
                ◆
              </span>
              Creative<span className="text-[#FF6A00]">Verse</span>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-[#A3A3A3] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              className="text-[#A3A3A3] hover:text-white transition-colors p-1.5"
              aria-label="Search platform"
            >
              <Search className="h-4 w-4" />
            </button>
            
            <Link
              to="/signin"
              className="text-[13px] font-medium text-[#A3A3A3] hover:text-white transition-colors"
            >
              Log in
            </Link>
            
            <Link to="/signup">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-white transition-all duration-200"
                style={{
                  background: "#FF6A00",
                  boxShadow: "0 0 20px rgba(255,106,0,0.3)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#FF7A1A"
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(255,106,0,0.5)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#FF6A00"
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(255,106,0,0.3)"
                }}
              >
                Join CreativeVerse <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          {/* Mobile Action Controls */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/signin">
              <button type="button" className="text-xs px-2.5 h-8 text-[#A3A3A3] hover:text-white">
                Log in
              </button>
            </Link>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="h-8 w-8 flex items-center justify-center rounded-md border border-white/10 bg-transparent hover:bg-white/5"
                >
                  <Menu className="h-4 w-4 text-white" />
                  <span className="sr-only">Toggle Menu</span>
                </button>
              </SheetTrigger>
              
              <SheetContent side="right" className="flex flex-col justify-between bg-[#0a0a0a] border-white/10">
                <div>
                  <div className="font-space text-lg font-bold tracking-tight mb-8">
                    Creative<span className="text-[#FF6A00]">Verse</span>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-base font-semibold text-[#A3A3A3] hover:text-white transition-colors py-2 border-b border-white/5"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <Link to="/signin" onClick={() => setIsOpen(false)}>
                    <button type="button" className="w-full py-2.5 rounded-full border border-white/15 text-sm font-semibold text-white">
                      Log in
                    </button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <button type="button" className="w-full py-2.5 rounded-full text-sm font-bold text-white" style={{ background: "#FF6A00" }}>
                      Join CreativeVerse
                    </button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  )
}
