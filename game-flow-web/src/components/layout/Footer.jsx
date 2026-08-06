import * as React from "react"
import { useState } from "react"
import { footerLinks } from "../../data/landingData"
import { Send } from "lucide-react"
import scopeCanvasLogo from "../../../../game-flow-ui/src/assets/scope-canvas-logo.png"

// Social icons as SVG
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.135 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

export function Footer() {
  const [email, setEmail] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubscribe = (e) => {
    e.preventDefault()
    setError("")
    if (!email) { setError("Please enter your email."); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { setError("Please enter a valid email address."); return }
    setSuccess(true)
    setEmail("")
  }

  return (
    <footer className="pt-12 pb-6" style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        
        {/* Main Footer Links & Newsletter */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-6 mb-10">
          
          {/* Brand Info */}
          <div className="col-span-2 flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2 font-space text-xl font-bold tracking-tight text-white">
              <img src={scopeCanvasLogo} alt="" className="h-8 w-8 rounded-full object-contain" />
              ScopeCanvas
            </a>
            <p className="text-xs text-[#A3A3A3] max-w-xs leading-relaxed">
              The ultimate hub for creators across games, art, 3D & more.
            </p>
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-2">
            <h4 className="font-space text-xs font-bold tracking-wide uppercase text-white mb-1">Platform</h4>
            {footerLinks.platform.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-[#A3A3A3] hover:text-white transition-colors duration-150">
                {link.label}
              </a>
            ))}
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-2">
            <h4 className="font-space text-xs font-bold tracking-wide uppercase text-white mb-1">Resources</h4>
            {footerLinks.resources.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-[#A3A3A3] hover:text-white transition-colors duration-150">
                {link.label}
              </a>
            ))}
          </div>

          {/* Company */}
          <div className="flex flex-col gap-2">
            <h4 className="font-space text-xs font-bold tracking-wide uppercase text-white mb-1">Company</h4>
            {footerLinks.company.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-[#A3A3A3] hover:text-white transition-colors duration-150">
                {link.label}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2">
            <h4 className="font-space text-xs font-bold tracking-wide uppercase text-white mb-1">Legal</h4>
            {footerLinks.legal.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-[#A3A3A3] hover:text-white transition-colors duration-150">
                {link.label}
              </a>
            ))}
          </div>

          {/* Stay Updated */}
          <div className="col-span-2 flex flex-col gap-2">
            <h4 className="font-space text-xs font-bold tracking-wide uppercase text-white mb-1">Stay Updated</h4>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Subscribe to our newsletter and never miss an update.
            </p>
            
            <form onSubmit={handleSubscribe} className="flex gap-0 mt-1 relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-9 px-3 text-xs rounded-l-lg text-white placeholder-[#555] focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRight: "none"
                }}
                disabled={success}
              />
              <button
                type="submit"
                className="h-9 w-9 rounded-r-lg flex items-center justify-center shrink-0 transition-colors"
                style={{ background: "#FF6A00", color: "white" }}
                disabled={success}
                onMouseEnter={e => { e.currentTarget.style.background = "#FF7A1A" }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FF6A00" }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
            {success && <span className="text-xs text-green-500 font-medium mt-1">Subscribed! Thank you.</span>}
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-white/5 my-6" />

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#666]">
            © {new Date().getFullYear()} ScopeCanvas. All rights reserved.
          </p>

          {/* Legal links */}
          <div className="flex items-center gap-5">
            {footerLinks.legal.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-[#666] hover:text-[#A3A3A3] transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          {/* Follow Us + Social Links */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-white">Follow Us</span>
            {[
              { Icon: DiscordIcon, label: "Discord" },
              { Icon: TwitterIcon, label: "Twitter" },
              { Icon: InstagramIcon, label: "Instagram" },
              { Icon: YouTubeIcon, label: "YouTube" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 text-[#A3A3A3] hover:text-white"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(255,106,0,0.4)"
                  e.currentTarget.style.background = "rgba(255,106,0,0.1)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
