import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import wavingVideo from '../../assets/wave.mp4';
import logoImg    from '../../assets/logo.jpg';
import slide1 from '../../assets/7697d2c01b465803c1b41ab51d5557b7.jpg';
import slide2 from '../../assets/fly.jpg';
import slide3 from '../../assets/an.jpg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:           '#0B0D12',
  inputBg:      'rgba(15,23,42,0.65)',
  inputBorder:  'rgba(255,255,255,0.08)',
  inputFocus:   '#FF7A59',
  textPrimary:  '#FFFFFF',
  textMuted:    'rgba(255,255,255,0.5)',
  placeholder:  '#6B7280',
  ctaBg:        '#F8F9FA',
  ctaText:      '#111827',
  pill:         'rgba(255,255,255,0.07)',
  pillBorderOff:'rgba(255,255,255,0.12)',
  pillOn:       'rgba(255,255,255,0.92)',
  pillBorderOn: 'rgba(255,255,255,0.9)',
  font:         '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
};

// ─── Input Field ──────────────────────────────────────────────────────────────
const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoFocus, rightEl }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 48,
          background: T.inputBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${focused ? T.inputFocus : T.inputBorder}`,
          borderRadius: 14,
          padding: '0 16px',
          gap: 10,
          transition: 'border-color 0.18s ease',
          boxShadow: focused ? '0 0 0 3px rgba(255,122,89,0.1)' : 'none',
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 15,
            fontWeight: 400,
            color: T.textPrimary,
            fontFamily: T.font,
            letterSpacing: type === 'password' ? 3 : 0,
          }}
        />
        {rightEl}
      </div>
    </div>
  );
};

// ─── Eye Toggle ───────────────────────────────────────────────────────────────
const EyeBtn = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? 'Hide password' : 'Show password'}
    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round">
      {visible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  </button>
);

const CTA = ({ label, onClick, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%',
      height: 48,
      background: (disabled || loading) ? 'rgba(248,249,250,0.35)' : T.ctaBg,
      border: 'none',
      borderRadius: 16,
      fontSize: 15,
      fontWeight: 600,
      color: (disabled || loading) ? 'rgba(17,24,39,0.4)' : T.ctaText,
      letterSpacing: -0.1,
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      boxShadow: (disabled || loading) ? 'none' : '0 8px 24px rgba(0,0,0,0.18)',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
    }}
    onMouseEnter={e  => !(disabled || loading) && (e.currentTarget.style.transform = 'scale(1.01)')}
    onMouseLeave={e  => (e.currentTarget.style.transform = 'scale(1)')}
    onMouseDown={e   => !(disabled || loading) && (e.currentTarget.style.transform = 'scale(0.98)')}
    onMouseUp={e     => !(disabled || loading) && (e.currentTarget.style.transform = 'scale(1.01)')}
    onTouchStart={e  => !(disabled || loading) && (e.currentTarget.style.transform = 'scale(0.98)')}
    onTouchEnd={e    => (e.currentTarget.style.transform = 'scale(1)')}
  >
    {loading ? 'Creating Account...' : label}
    {!loading && <span style={{ fontSize: 15, opacity: disabled ? 0.4 : 0.55 }}>→</span>}
  </button>
);

// ─── OAuth Button ─────────────────────────────────────────────────────────────
const OAuthButton = ({ label, icon, onClick }) => (
  <button
    aria-label={label}
    onClick={onClick}
    style={{
      width: '100%',
      height: 44,
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      color: T.textPrimary,
      fontSize: 14,
      fontWeight: 500,
      fontFamily: T.font,
      cursor: 'pointer',
      outline: 'none',
      transition: 'background 0.2s ease, transform 0.2s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle } = useAuth();
  const [step, setStep]             = useState(1);        // 1 | 2
  const [visible, setVisible]       = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [slide1, slide2, slide3];

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/app/home';

  // Step 1
  const [email, setEmail]           = useState('');
  // Step 2
  const [username, setUsername]     = useState('');
  const [name, setName]             = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step transition
  const [stepVisible, setStepVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % slides.length), 5000);
    return () => clearTimeout(t);
  }, [slides.length]);

  const goToStep2 = () => {
    if (!email.trim()) return;
    setErrorMessage('');
    setStepVisible(false);
    setTimeout(() => { setStep(2); setStepVisible(true); }, 220);
  };

  const handleCreate = async () => {
    if (!username.trim() || !name.trim() || password.length < 8 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await signUp({
        email,
        username,
        name,
        password,
      });
      navigate(redirectPath);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create your account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await signInWithGoogle(credential);
      navigate(redirectPath);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to continue with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared overlay styles ──────────────────────────────────────────────────
  const overlayBase = {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    pointerEvents: 'none',
  };

  return (
    <div
      className="mobile-frame"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: T.font,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ── Fallback slideshow ────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {slides.map((src, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: activeSlide === i ? 1 : 0, transition: 'opacity 2s ease',
          }} />
        ))}
      </div>

      {/* ── Video ──────────────────────────────────────────────────────────── */}
      <video src={wavingVideo} autoPlay muted loop playsInline preload="auto"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
      />

      {/* ── Cinematic vignette ─────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ ...overlayBase, inset: 0, background: 'rgba(11,13,18,0.55)' }} />

      {/* ── Top scrim ──────────────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ ...overlayBase, top: 0, height: '35%',
        background: 'linear-gradient(180deg, rgba(11,13,18,0.9) 0%, transparent 100%)' }}
      />

      {/* ── Bottom scrim ───────────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ ...overlayBase, bottom: 0, height: '70%',
        background: 'linear-gradient(0deg, rgba(11,13,18,0.98) 0%, rgba(11,13,18,0.7) 50%, transparent 100%)' }}
      />

      {/* ── UI ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 20px',
          boxSizing: 'border-box',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        {/* ── Center Wrapper ────────────────────────────────────────────────── */}
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {/* Glass logo */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(11,13,18,0.5)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.13)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            }}>
              <img src={logoImg} alt="CreativeVerse" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
            </div>

            {/* Wordmark */}
            <span style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.4 }}>
              CreativeVerse
            </span>
          </div>

          {/* ── Step Content ─────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              opacity: stepVisible ? 1 : 0,
              transform: stepVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}
          >
          {errorMessage ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                background: 'rgba(255,122,89,0.14)',
                border: '1px solid rgba(255,122,89,0.28)',
                color: '#FFD9CF',
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          {step === 1 ? (
            <>
              {/* ── Step 1 ─────────────────────────────────────────────────── */}

              {/* Heading */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  Create your<br />creator profile.
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontWeight: 400 }}>
                  Start with your email address.
                </p>
              </div>

              {/* Email field */}
              <Field
                id="signup-email"
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />

              {/* CTA */}
              <CTA
                label="Continue"
                onClick={goToStep2}
                disabled={!email.trim()}
              />

              {/* OAuth Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', fontWeight: 500, letterSpacing: 0.5 }}>
                    OR
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Google — primary provider */}
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onError={setErrorMessage}
                  disabled={isSubmitting}
                />
              </div>

              {/* Sign in link */}
              <p style={{ margin: '2px 0 0', textAlign: 'center', fontSize: 13, color: T.textMuted }}>
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/signin')}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: T.textPrimary,
                    fontFamily: T.font, textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  Sign In
                </button>
              </p>
            </>
          ) : (
            <>
              {/* ── Step 2 ─────────────────────────────────────────────────── */}

              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 16, height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.25)' }} />
                  <div style={{ width: 16, height: 3, borderRadius: 100, background: T.textPrimary }} />
                </div>
                <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: 0.3 }}>Step 2 of 2</span>
              </div>

              {/* Heading */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  Almost there.
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>
                  Complete your profile.
                </p>
              </div>

              <Field
                id="signup-username"
                label="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Pick a unique username"
                autoFocus
              />

              {/* Name */}
              <Field
                id="signup-name"
                label="Display Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="How should we call you?"
              />

              {/* Password */}
              <Field
                id="signup-password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                rightEl={<EyeBtn visible={showPw} onToggle={() => setShowPw(p => !p)} />}
              />

              {/* CTA */}
              <CTA
                label="Create Account"
                onClick={handleCreate}
                disabled={!username.trim() || !name.trim() || password.length < 8 || isSubmitting}
                loading={isSubmitting}
              />

              {/* Back link */}
              <button
                onClick={() => { setStepVisible(false); setTimeout(() => { setStep(1); setStepVisible(true); }, 220); }}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontSize: 14, color: T.textMuted, fontFamily: T.font, textAlign: 'center',
                  width: '100%',
                }}
              >
                ← Go back
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
