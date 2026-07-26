import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import wavingVideo from '../../assets/wave.mp4';
import logoImg    from '../../assets/logo.jpg';
import slide1 from '../../assets/7697d2c01b465803c1b41ab51d5557b7.jpg';
import slide2 from '../../assets/fly.jpg';
import slide3 from '../../assets/an.jpg';
import GoogleSignInButton from '../../components/GoogleSignInButton';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  bg:          '#0B0D12',
  inputBg:     'rgba(15,23,42,0.65)',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputFocus:  '#FF7A59',
  white:       '#FFFFFF',
  muted:       'rgba(255,255,255,0.48)',
  subtle:      'rgba(255,255,255,0.24)',
  ctaBg:       '#F8F9FA',
  ctaText:     '#111827',
  font:        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
};

// ─── Input Field ──────────────────────────────────────────────────────────
const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoFocus, rightEl }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.muted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 56,
          background: T.inputBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${focused ? T.inputFocus : T.inputBorder}`,
          borderRadius: 16,
          padding: '0 18px',
          gap: 10,
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
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
          autoComplete={type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'off'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 16,
            fontWeight: 400,
            color: T.white,
            fontFamily: T.font,
            letterSpacing: type === 'password' ? 3 : 0,
          }}
        />
        {rightEl}
      </div>
    </div>
  );
};

// ─── Eye Toggle ───────────────────────────────────────────────────────────
const EyeBtn = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? 'Hide password' : 'Show password'}
    style={{
      background: 'none', border: 'none', padding: 0,
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      flexShrink: 0,
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  </button>
);

// ─── Primary CTA ──────────────────────────────────────────────────────────
const CTA = ({ label, onClick, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%',
      height: 56,
      background: (disabled || loading) ? 'rgba(248,249,250,0.3)' : T.ctaBg,
      border: 'none',
      borderRadius: 20,
      fontSize: 16,
      fontWeight: 600,
      color: (disabled || loading) ? 'rgba(17,24,39,0.35)' : T.ctaText,
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
    {loading ? 'Signing in...' : label}
    {!loading && <span style={{ fontSize: 16, opacity: disabled ? 0.3 : 0.55 }}>→</span>}
  </button>
);

// ─── OAuth Button ─────────────────────────────────────────────────────────────
const OAuthButton = ({ label, icon, onClick }) => (
  <button
    aria-label={label}
    onClick={onClick}
    style={{
      width: '100%',
      height: 52,
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      cursor: 'pointer',
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.1s ease',
      fontFamily: T.font,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'scale(0.99)';
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'none';
    }}
    onTouchStart={e => {
      e.currentTarget.style.transform = 'scale(0.99)';
    }}
    onTouchEnd={e => {
      e.currentTarget.style.transform = 'none';
    }}
  >
    {icon}
    <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.75)', letterSpacing: -0.1 }}>
      {label}
    </span>
  </button>
);

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showMoreOAuth, setShowMoreOAuth] = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [visible,  setVisible]  = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const slides = [slide1, slide2, slide3];

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/app/home';

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % slides.length), 5000);
    return () => clearTimeout(t);
  }, [slides.length]);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await signIn({
        username,
        password,
      });
      navigate(redirectPath);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in right now.');
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
      setErrorMessage(error.message || 'Unable to sign in with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthClick = () => {
    setErrorMessage('This sign-in provider is not connected yet.');
  };

  const isReady = username.trim().length > 0 && password.length >= 8 && !isSubmitting;

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
      {/* ── Fallback slideshow ─────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {slides.map((src, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: activeSlide === i ? 1 : 0,
            transition: 'opacity 2s ease',
          }} />
        ))}
      </div>

      {/* ── Video ─────────────────────────────────────────────────────── */}
      <video
        src={wavingVideo}
        autoPlay muted loop playsInline preload="auto"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 1,
        }}
      />

      {/* ── Full-screen cinematic tint ────────────────────────────────── */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'rgba(11,13,18,0.55)',
        pointerEvents: 'none',
      }} />

      {/* ── Top scrim ─────────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '45%', zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(11,13,18,0.9) 0%, transparent 100%)',
      }} />

      {/* ── Bottom scrim ──────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '75%', zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(0deg, rgba(11,13,18,0.98) 0%, rgba(11,13,18,0.75) 50%, transparent 100%)',
      }} />

      {/* ── UI ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative', zIndex: 3,
          flex: 1, display: 'flex', flexDirection: 'column',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          padding: '56px 24px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          {/* Glass logo */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(11,13,18,0.5)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.13)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          }}>
            <img src={logoImg} alt="CreativeVerse"
              style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: T.white, letterSpacing: -0.4 }}>
            CreativeVerse
          </span>
        </div>

        {/* ── Spacer: let video breathe ────────────────────────────────── */}
        <div style={{ flex: 1 }} />

        {/* ── Bottom content ───────────────────────────────────────────── */}
        <div style={{
          padding: '0 24px 44px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 700,
              color: T.white,
              letterSpacing: -0.7,
              lineHeight: 1.2,
            }}>
              Welcome Back
            </h1>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: T.muted,
              fontWeight: 400,
              lineHeight: 1.5,
            }}>
              Sign in to continue.
            </p>
          </div>

          {/* ── Form group ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Username */}
            <Field
              id="login-username"
              label="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
            />

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Field
                id="login-password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                rightEl={<EyeBtn visible={showPw} onToggle={() => setShowPw(p => !p)} />}
              />
              {/* Forgot password — right-aligned, low emphasis */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => navigate('/forgot-password')}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    cursor: 'pointer', fontFamily: T.font,
                    fontSize: 13, fontWeight: 500,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 16,
                background: 'rgba(255,122,89,0.14)',
                border: '1px solid rgba(255,122,89,0.28)',
                color: '#FFD9CF',
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          {/* Primary CTA */}
          <CTA label="Sign In" onClick={handleSignIn} disabled={!isReady} loading={isSubmitting} />

          {/* Divider + Google */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* OR divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 12, color: T.subtle, fontWeight: 500, letterSpacing: 0.5 }}>
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

            {/* Keep account creation visible without expanding OAuth options. */}
            <p style={{ margin: '2px 0 0', textAlign: 'center', fontSize: 14, color: T.muted }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{
                  background: 'none', border: 'none', padding: '4px 2px',
                  cursor: 'pointer', fontFamily: T.font,
                  fontSize: 14, fontWeight: 700, color: T.white,
                  textDecoration: 'underline', textUnderlineOffset: 3,
                  textDecorationColor: 'rgba(255,255,255,0.45)',
                }}
              >
                Sign Up
              </button>
            </p>

            {showMoreOAuth && <>
            {/* More options toggle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowMoreOAuth(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: T.font,
                  letterSpacing: -0.1,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                {showMoreOAuth ? 'Fewer sign in options' : 'More sign in options'}
              </button>
            </div>

            {/* Secondary OAuth options */}
            <div
              style={{
                maxHeight: showMoreOAuth ? '120px' : '0px',
                opacity: showMoreOAuth ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: showMoreOAuth ? 4 : 0,
              }}
            >
              <OAuthButton
                label="Continue with Apple"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ fill: '#FFFFFF' }}>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 2.99 1.11.09 2.26-.54 3-1.44z"/>
                  </svg>
                }
                onClick={handleOAuthClick}
              />
              <OAuthButton
                label="Continue with GitHub"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ fill: '#FFFFFF' }}>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                }
                onClick={handleOAuthClick}
              />
            </div>
            </>}
          </div>

          {/* Tertiary — create account */}
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
