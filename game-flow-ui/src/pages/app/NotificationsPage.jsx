import { BellIcon, HeartIcon, VerifiedIcon } from '../../components/icons/Icons';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'like',
    user: 'alex_vfx',
    action: 'liked your project',
    target: 'Volumetric Portal Effect',
    time: '2h ago',
    avatar: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/19f781f2a-1e76-4c62-8f73-55c5248d45ab.png',
  },
  {
    id: 2,
    type: 'follow',
    user: 'zara_neon',
    action: 'started following you',
    time: '5h ago',
    avatar: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/19f781f2a-1e76-4c62-8f73-55c5248d45ab.png',
    isVerified: true,
  },
  {
    id: 3,
    type: 'feature',
    user: 'CreativeVerse',
    action: 'featured your artwork in Trending Projects!',
    target: 'Neon Cube Composition',
    time: '1d ago',
    avatar: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/16f5b8c4e-7f3a-4b6d-9c8e-2d4a5e6f7a8b.png',
  },
];

const NotificationsPage = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0B0D12',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '24px 20px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <BellIcon size={24} style={{ color: '#FF7A59' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.4 }}>
          Notifications
        </h1>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '55%',
          background: 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <BellIcon size={36} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            Alerts Unavailable
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.4, color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
            Real-time notifications are currently not supported in this mobile prototype.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
