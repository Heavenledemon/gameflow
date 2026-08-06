import { ArrowRight, Box, CheckCircle2, Compass, Gamepad2, Menu, Play, Sparkles, Star, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import scopeCanvasLogo from '../../../game-flow-ui/src/assets/scope-canvas-logo.png'
import heroCharacter from '../assets/hero-character-transparent.png'
import { categories, creators, features, journeySteps, statistics, testimonials } from '../data/landingData'

const iconMap = { Gamepad2, Box, Play, Sparkles, Users, Compass }

function Brand() {
  return <Link to="/" className="landing-brand" aria-label="ScopeCanvas home"><img src={scopeCanvasLogo} alt="" className="landing-brand-mark" style={{ objectFit: 'contain' }} /><span>ScopeCanvas</span></Link>
}

function LandingHeader() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="landing-header"><nav className="landing-nav"><Brand /><button className="landing-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button><div className={`landing-nav-links ${open ? 'is-open' : ''}`}><a href="#discover" onClick={close}>Discover</a><a href="#creators" onClick={close}>Creators</a><a href="#how-it-works" onClick={close}>How it works</a><a href="#community" onClick={close}>Community</a><Link to="/signin" onClick={close}>Sign in</Link><Link className="landing-button landing-button-small" to="/signup" onClick={close}>Join free <ArrowRight /></Link></div></nav></header>
}

function StatStrip() {
  return <section className="landing-stats" aria-label="ScopeCanvas community statistics">{statistics.slice(0, 4).map((item) => { const Icon = iconMap[item.iconName] || Sparkles; return <div key={item.id}><Icon /><strong>{item.value}</strong><span>{item.label}</span></div> })}</section>
}

function CategoryCard({ category, index }) {
  const Icon = iconMap[category.iconName] || Sparkles
  return <article className={`category-card category-card-${index % 4}`}><img src={category.imageUrl} alt="" loading="lazy" /><div><Icon /><span>{category.title}</span></div></article>
}

function LandingFooter() {
  return <footer className="landing-footer"><div><Brand /><p>A home for the people making what’s next.</p></div><div><strong>Platform</strong><a href="#discover">Discover</a><a href="#creators">Creators</a><Link to="/signup">Start creating</Link></div><div><strong>Company</strong><a href="#community">Community</a><a href="#how-it-works">How it works</a><a href="mailto:hello@scopecanvas.example">Contact</a></div><p className="landing-copyright">© {new Date().getFullYear()} ScopeCanvas</p></footer>
}

export default function LandingPage() {
  return <div className="landing-page">
    <LandingHeader />
    <main>
      <section className="landing-hero">
        <div className="landing-hero-copy"><p className="landing-eyebrow"><span /> A place for every kind of creator</p><h1>Make work that <em>moves</em> people.</h1><p className="landing-lead">Share your games, art, music, and ideas with a community that sees the value in making something new.</p><div className="landing-actions"><Link className="landing-button" to="/signup">Start creating <ArrowRight /></Link><a className="landing-text-link" href="#discover">Explore the work <ArrowRight /></a></div><div className="landing-proof"><div className="landing-avatars">{creators.map((creator) => <img key={creator.id} src={creator.avatarUrl} alt="" />)}</div><span><strong>100k+</strong> creators sharing what they love</span></div></div>
        <div className="landing-hero-art" aria-hidden="true"><div className="landing-orbit landing-orbit-one" /><div className="landing-orbit landing-orbit-two" /><div className="landing-hero-glow" /><img src={heroCharacter} alt="" /><div className="hero-chip hero-chip-top"><Gamepad2 /> Game design</div><div className="hero-chip hero-chip-right"><Sparkles /> Visual effects</div><div className="hero-chip hero-chip-bottom"><Play /> Animation</div></div>
      </section>
      <StatStrip />

      <section id="discover" className="landing-section landing-discover"><div className="landing-section-heading"><p className="landing-eyebrow"><span /> Explore the platform</p><h2>Built for the way creative people <em>actually work.</em></h2><p>Bring every practice together in one considered place, whether you’re showing a first draft or a finished world.</p></div><div className="category-grid">{categories.slice(0, 8).map((category, index) => <CategoryCard key={category.id} category={category} index={index} />)}</div></section>

      <section className="landing-section landing-features"><div className="landing-feature-intro"><p className="landing-eyebrow"><span /> More than a portfolio</p><h2>Make your next connection count.</h2><p>ScopeCanvas makes it easier to publish meaningful work, find your people, and keep the momentum going.</p><Link className="landing-text-link" to="/signup">Join the community <ArrowRight /></Link></div><div className="feature-list">{features.map((feature, index) => { const Icon = iconMap[feature.iconName] || Sparkles; return <article key={feature.title} className="feature-card"><span className="feature-number">0{index + 1}</span><Icon /><h3>{feature.title}</h3><p>{feature.description}</p></article> })}</div></section>

      <section id="creators" className="landing-section landing-creators"><div className="landing-section-heading landing-heading-row"><div><p className="landing-eyebrow"><span /> Meet the community</p><h2>Made by people with something to say.</h2></div><a className="landing-text-link" href="#community">Hear their stories <ArrowRight /></a></div><div className="creator-grid">{creators.map((creator) => <article key={creator.id} className="creator-card"><img src={creator.avatarUrl} alt={creator.name} /><div><span>{creator.role}</span><h3>{creator.name}</h3><p>{creator.followers}</p></div><CheckCircle2 aria-label="Verified creator" /></article>)}</div></section>

      <section id="how-it-works" className="landing-section landing-journey"><div className="journey-copy"><p className="landing-eyebrow"><span /> A simple start</p><h2>Keep moving forward, one good step at a time.</h2><p>There’s no complicated process. Start with what you make, then let the right people find it.</p></div><ol>{journeySteps.map((step) => { const Icon = iconMap[step.iconName] || Sparkles; return <li key={step.step}><span><Icon /></span><div><small>{step.step}</small><h3>{step.title}</h3><p>{step.description}</p></div></li> })}</ol></section>

      <section id="community" className="landing-section landing-stories"><div className="stories-heading"><p className="landing-eyebrow"><span /> Creator stories</p><h2>“A space that feels as ambitious as the work.”</h2></div><div className="story-list">{testimonials.map((story) => <article key={story.id}><div className="story-stars">{Array.from({ length: story.stars }).map((_, i) => <Star key={i} />)}</div><p>{story.quote}</p><footer><img src={story.avatarUrl} alt="" /><span><strong>{story.name}</strong>{story.role}</span></footer></article>)}</div></section>

      <section className="landing-cta"><div><p className="landing-eyebrow"><span /> Your next chapter</p><h2>Give your work a place to <em>belong.</em></h2></div><div><p>Start sharing the things you care about with people who care, too.</p><Link className="landing-button" to="/signup">Create your profile <ArrowRight /></Link></div></section>
    </main>
    <LandingFooter />
  </div>
}

export { LandingPage }
