import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wavingVideo from '../../assets/wave.mp4';
import logoImg from '../../assets/logo.jpg';

const T = {
  bg:           '#0B0D12',
  inputBg:      'rgba(15,23,42,0.65)',
  inputBorder:  'rgba(255,255,255,0.08)',
  inputFocus:   '#FF7A59',
  textPrimary:  '#FFFFFF',
  textMuted:    'rgba(255,255,255,0.5)',
  ctaBg:        '#F8F9FA',
  ctaText:      '#111827',
  font:         '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
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
      {/* ── Background Video ── */}
      <video
        src={wavingVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
      />

      {/* ── Vignette ── */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,13,18,0.6)', zIndex: 2 }} />

      {/* ── Content Container ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 24px 48px',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="CreativeVerse" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>CreativeVerse</span>
          </div>
        </div>

        {/* Card Form */}
        <div
          style={{
            background: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 28,
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,122,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <span style={{ fontSize: 28 }}>🔒</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.textPrimary }}>Reset Unavailable</h1>
                <p style={{ margin: 0, fontSize: 14, color: T.textMuted, lineHeight: 1.5 }}>
                  Self-service password recovery is not available in this mobile prototype. Please sign in using the provided demo account credentials or contact an administrator.
                </p>
              </div>
            </div>
        </div>

        {/* Back to Sign In */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/signin')}
            style={{
              background: 'none',
              border: 'none',
              padding: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: T.textPrimary,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.3)',
              fontFamily: T.font,
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
