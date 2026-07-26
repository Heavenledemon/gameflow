import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import wavingVideo from '../../assets/wave.mp4';
import logoImg from '../../assets/logo.jpg';
import slide1 from '../../assets/7697d2c01b465803c1b41ab51d5557b7.jpg';
import slide2 from '../../assets/fly.jpg';
import slide3 from '../../assets/an.jpg';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { loginGuest } = useAuth();
  const [selected, setSelected] = useState('creator');
  const [visible, setVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [slide1, slide2, slide3];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const handleContinue = () => {
    localStorage.setItem('cv_onboarding_completed', 'true');
    if (selected === 'creator') {
      navigate('/signup');
    } else {
      loginGuest();
      navigate('/app/home');
    }
  };

  // ─── Shared pill style ───────────────────────────────────────────────────────
  const pill = (id) => {
    const on = selected === id;
    return {
      flex: 1,
      height: 48,
      border: on
        ? '1.5px solid rgba(255,255,255,0.9)'
        : '1px solid rgba(255,255,255,0.18)',
      borderRadius: 100,
      background: on
        ? 'rgba(255,255,255,0.92)'
        : 'rgba(11,13,18,0.55)',
      backdropFilter: on ? 'none' : 'blur(12px)',
      WebkitBackdropFilter: on ? 'none' : 'blur(12px)',
      color: on ? '#0B0D12' : 'rgba(255,255,255,0.72)',
      fontSize: 15,
      fontWeight: on ? 700 : 500,
      letterSpacing: -0.2,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      boxShadow: on ? '0 2px 16px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.2)',
    };
  };

  return (
    <div
      className="mobile-frame"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: '#0B0D12',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ── Fallback slideshow ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {slides.map((src, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: activeSlide === i ? 1 : 0,
              transition: 'opacity 2s ease',
            }}
          />
        ))}
      </div>

      {/* ── Video ──────────────────────────────────────────────────────────── */}
      <video
        src={wavingVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
        }}
      />

      {/* ── Full-screen cinematic vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11,13,18,0.28)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* ── Top scrim — logo readability ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '55%',
          background:
            'linear-gradient(180deg, rgba(11,13,18,0.86) 0%, rgba(11,13,18,0.3) 65%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* ── Bottom scrim — CTA readability ────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '58%',
          background:
            'linear-gradient(0deg, rgba(11,13,18,0.97) 0%, rgba(11,13,18,0.65) 50%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* ── UI Layer ───────────────────────────────────────────────────────── */}

      {/* ── TOP: Brand identity ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '25dvh',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.7s ease',
        }}
      >
        {/* Logo mark — glass circle container */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(11,13,18,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src={logoImg}
            alt="CreativeVerse"
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Wordmark */}
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          CreativeVerse
        </span>

        {/* Tagline — one sentence only */}
        <span
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: 0.1,
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}
        >
          Where creators connect.
        </span>
      </div>

      {/* ── MIDDLE: Spacer ───────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── BOTTOM: Role + CTA ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          padding: '0 24px 130px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.7s ease 0.15s',
        }}
      >
        {/* Role pills */}
        <div
          role="radiogroup"
          aria-label="Choose your role"
          style={{ display: 'flex', gap: 10 }}
        >
          <button
            role="radio"
            aria-checked={selected === 'creator'}
            onClick={() => setSelected('creator')}
            style={pill('creator')}
          >
            Creator
          </button>

          <button
            role="radio"
            aria-checked={selected === 'explorer'}
            onClick={() => setSelected('explorer')}
            style={pill('explorer')}
          >
            Explorer
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            height: 56,
            background: '#F8F9FA',
            border: 'none',
            borderRadius: 20,
            fontSize: 16,
            fontWeight: 600,
            color: '#111827',
            letterSpacing: -0.1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.01)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.01)')}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Continue
          <span style={{ fontSize: 16, lineHeight: 1, opacity: 0.6 }}>→</span>
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
