import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createDirectConversation } from '../../lib/messaging';
import { createModerationReport, toggleUserBlock } from '../../lib/moderation';
import { useToast } from '../../context/ToastContext';
import GuestToast from '../../components/layout/GuestToast';
import { BottomSheet, ConfirmDialog } from '../../components/ui/Overlay';
import {
  ChevronLeftIcon, ShareIcon2, VerifiedIcon, HeartIcon,
  DotsIcon, EyeIcon
} from '../../components/icons/Icons';

/* ─── Local Tab Icons Matching ProfilePage.jsx exactly ─────────────────────── */
const GridIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const HeartTabIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const MessageCircleIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const UsersIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BookmarkTabIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

/* ─── Mock Creator Data ──────────────────────────────────────────────────────── */
const MOCK_CREATOR = {
  name: 'zara_neon',
  username: 'zara_neon',
  role: 'Senior Animator',
  location: 'Tokyo, Japan',
  avatar: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/19f781f2a-1e76-4c62-8f73-55c5248d45ab.png',
  cover: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/1097bcf9c-55f8-4aa3-8544-7e63de8dd465.png',
  isVerified: true,
  isOnline: true,
  bio: 'Bringing stories to life through animation & motion.\nWorking with top studios worldwide.',
  stats: { projects: '24', followers: '12.3K', following: '320', views: '2.4M' },
  skills: [
    { name: '3D Animation', color: '#A855F7', icon: '🔮' },
    { name: 'Character Design', color: '#F97316', icon: '🎨' },
    { name: 'VFX', color: '#10B981', icon: '✨' },
    { name: 'Motion Design', color: '#3B82F6', icon: '🌐' }
  ],
  website: 'zara-neon.com'
};

const PROJECTS = [
  { id: 1, title: 'Neon Dreams', category: 'VFX', image: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/1bd8db8c4-7446-4905-bbe6-106a3bce5dc2.png', likes: '2.3K', views: '45K', tall: true },
  { id: 2, title: 'Lost in Thoughts', category: 'Animation', image: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/12de9432e-ccf4-418f-a563-5181abb44ff3.png', likes: '1.8K', views: '32K', tall: false },
  { id: 3, title: 'Red Planet Diary', category: '3D', image: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/1a26c70d3-6e59-4426-897a-6546a2e98a7e.png', likes: '1.5K', views: '28K', tall: false },
  { id: 4, title: 'Ethereal Portal', category: 'VFX', image: 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/18b6190b4-15eb-4568-9328-53c6d187c8c3.png', likes: '1.2K', views: '21K', tall: true }
];

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const { isGuest, token } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('Projects');
  const [isFollowing, setIsFollowing] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [toast, setToast] = useState(null);
  const [messageError, setMessageError] = useState('');
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [showSafetySheet, setShowSafetySheet] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSafetyAction, setIsSafetyAction] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleFollow = () => {
    if (isGuest) { setToast({ action: 'follow creators' }); return; }
    setIsFollowing(!isFollowing);
  };

  const handleLike = (id, e) => {
    e.stopPropagation();
    if (isGuest) { setToast({ action: 'like projects' }); return; }
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openDirectMessage = async () => {
    if (isGuest) { setToast({ action: 'message creators' }); return; }
    if (isBlocked) { setMessageError('You blocked this creator. Unblock them before starting a conversation.'); return; }
    setIsOpeningConversation(true);
    setMessageError('');
    try {
      const result = await createDirectConversation(token, creatorId || currentCreator.username);
      navigate(`/app/inbox/${result.conversation.id}`, { state: { conversation: result.conversation, moderationTarget: result.conversation.recipient } });
    } catch (error) { const message = error.message || 'Unable to open a conversation.'; setMessageError(message); showError(message); } finally { setIsOpeningConversation(false); }
  };

  const currentCreator = creatorId ? {
    ...MOCK_CREATOR,
    name: creatorId,
    username: creatorId
  } : MOCK_CREATOR;

  const moderationTargetId = /^[a-f\d]{24}$/i.test(String(creatorId || '')) ? creatorId : null;

  const openSafety = () => {
    if (isGuest) { setToast({ action: 'manage safety settings' }); return; }
    setShowSafetySheet(true);
  };

  const toggleBlock = async () => {
    if (!moderationTargetId) return;
    setIsSafetyAction(true);
    try {
      const result = await toggleUserBlock(token, moderationTargetId);
      setIsBlocked(Boolean(result.blocked));
      setShowSafetySheet(false);
      showSuccess(result.blocked ? 'Creator blocked. Messaging and collaboration are disabled.' : 'Creator unblocked.');
    } catch (error) { showError(error.message || 'Unable to update this block.'); } finally { setIsSafetyAction(false); }
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    if (!moderationTargetId || !reason) return;
    setIsSafetyAction(true);
    try {
      await createModerationReport(token, { targetUserId: moderationTargetId, reason, contextType: 'user', contextId: moderationTargetId });
      setReportReason('');
      setShowSafetySheet(false);
      showSuccess('Report submitted. Thank you for helping keep the community safe.');
    } catch (error) { showError(error.message || 'Unable to submit this report.'); } finally { setIsSafetyAction(false); }
  };

  const tabsList = [
    { id: 'Projects', label: 'Projects', icon: (color) => <GridIcon size={18} color={color} /> },
    { id: 'Liked', label: 'Liked', icon: (color) => <HeartTabIcon size={18} color={color} /> },
    { id: 'Comments', label: 'Comments', icon: (color) => <MessageCircleIcon size={18} color={color} /> },
    { id: 'Collaborations', label: 'Collaborate', icon: (color) => <UsersIcon size={18} color={color} /> },
    { id: 'Saved', label: 'Saved', icon: (color) => <BookmarkTabIcon size={18} color={color} /> },
  ];
  return (
    <div
      className="scrollbar-hide"
      style={{
        width: '100%',
        height: '100vh',
        background: '#090909',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        position: 'relative',
        paddingBottom: 80,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <style>{`
        .press-scale {
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease;
        }
        .press-scale:active {
          transform: scale(0.96) !important;
          opacity: 0.9;
        }
        .tab-transition {
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>

      {/* ─── Cover Image ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: 250, flexShrink: 0 }}>
        <img
          src={currentCreator.cover}
          alt="cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(9, 9, 9, 0.3) 0%, rgba(9, 9, 9, 0.95) 100%)'
        }} />

        {/* Top Navigation Controls */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(9, 9, 9, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFFFFF'
            }}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => alert('Profile link shared!')}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(9, 9, 9, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF'
              }}
            >
              <ShareIcon2 size={18} />
            </button>
            <button
              onClick={openSafety}
              aria-label="Creator safety options"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(9, 9, 9, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF'
              }}
            >
              <DotsIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Profile Header Overlay Content ───────────────────────────────────── */}
      <div style={{ padding: '0 20px', marginTop: -50, position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
          {/* Avatar Details */}
          <div style={{ position: 'relative', width: 92, height: 92 }}>
            <img
              src={currentCreator.avatar}
              alt={currentCreator.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3.5px solid #A855F7',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.35)'
              }}
            />

          </div>

          {/* Action Buttons: Follow & Message */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 6 }}>
            <button
              onClick={handleFollow}
              style={{
                width: 110,
                height: 38,
                borderRadius: 100,
                background: isFollowing ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                border: isFollowing ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                color: isFollowing ? '#FFFFFF' : '#090909',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={openDirectMessage}
              disabled={isOpeningConversation || isBlocked}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: 110,
                height: 38,
                borderRadius: 100,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: isOpeningConversation || isBlocked ? 'not-allowed' : 'pointer',
                opacity: isOpeningConversation || isBlocked ? .65 : 1,
                transition: 'all 0.2s'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {isOpeningConversation ? 'Opening…' : isBlocked ? 'Blocked' : 'Message'}
            </button>
          </div>
        </div>

        {messageError ? <p role="alert" style={{ margin: '0 0 12px', color: '#ffad96', fontSize: 12.5, lineHeight: 1.45 }}>{messageError}</p> : null}

        {/* Identity Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 18, fontWeight: 800 }}>{currentCreator.name}</span>
          {currentCreator.isVerified && <VerifiedIcon />}
        </div>
        <div style={{ fontSize: 13, color: '#FF7A5C', fontWeight: 600, marginBottom: 6 }}>@{currentCreator.username}</div>
        <div style={{ fontSize: 13, color: '#A1A1AA', fontWeight: 500, marginBottom: 4 }}>{currentCreator.role}</div>
        {currentCreator.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#71717A', fontWeight: 500, marginBottom: 14 }}>
            <span>📍</span> {currentCreator.location}
          </div>
        )}

        {/* Bio */}
        <p style={{
          fontSize: 13,
          color: '#E4E4E7',
          lineHeight: 1.5,
          margin: '0 0 16px',
          whiteSpace: 'pre-line'
        }}>
          {currentCreator.bio}
        </p>

        {/* Links row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <a
            href={`https://${currentCreator.website}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 100,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#A1A1AA',
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            <span>🔗</span> {currentCreator.website}
          </a>
          <div style={{ display: 'flex', gap: 8 }}>
            {['📸', '𝗕', '🐦', '▶'].map((soc, idx) => (
              <button
                key={idx}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: idx === 0 ? '#E1306C' : idx === 1 ? '#0057ff' : idx === 2 ? '#1DA1F2' : '#FF0000',
                  fontSize: 12
                }}
              >
                {soc}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {currentCreator.skills.map((skill, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 100,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: 12,
                fontWeight: 600,
                color: '#D4D4D8'
              }}
            >
              <span style={{ fontSize: 13 }}>{skill.icon}</span>
              <span>{skill.name}</span>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 20,
          padding: '16px 0',
          textAlign: 'center',
          marginBottom: 24
        }}>
          {[
            { value: currentCreator.stats.projects, label: 'Projects' },
            { value: currentCreator.stats.followers, label: 'Followers' },
            { value: currentCreator.stats.following, label: 'Following' },
            { value: currentCreator.stats.views, label: 'Views' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              borderRight: idx < 3 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FF7A5C', marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#71717A', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div> {/* Close Profile Header Overlay Content */}

      {/* Navigation Tabs (Stacked Layout matching ProfilePage.jsx) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '0 10px',
        background: 'rgba(11, 13, 18, 0.5)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        marginBottom: 16
      }}>
        {tabsList.map((tab) => {
          const isActive = activeTab === tab.id;
          const activeColor = '#FF7A59';
          const inactiveColor = 'rgba(255, 255, 255, 0.4)';
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className="press-scale tab-transition"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '12px 0 10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {tab.icon(isActive ? activeColor : inactiveColor)}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : inactiveColor,
                  transition: 'color 0.3s ease',
                }}
              >
                {tab.label}
              </span>

              {/* Coral Underline */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  background: activeColor,
                  borderRadius: '2px 2px 0 0',
                  opacity: isActive ? 1 : 0,
                  boxShadow: isActive ? '0 0 8px #FF7A59' : 'none',
                  transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* ─── Projects Grid Container ────────────────────────────────────────── */}
      <div style={{ padding: '16px 12px 100px' }}>
        {activeTab === 'Projects' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {PROJECTS.map(proj => {
              const isLiked = likedMap[proj.id];
              return (
                <div
                  key={proj.id}
                  onClick={() => navigate(`/app/project/${proj.id}`)}
                  style={{
                    position: 'relative',
                    borderRadius: 20,
                    overflow: 'hidden',
                    aspectRatio: proj.tall ? '0.78' : '1.1',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <img src={proj.image} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0) 100%)'
                  }} />

                  {/* Category Badge & 3-Dots */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    right: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      background: 'rgba(9, 9, 9, 0.6)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      padding: '3px 8px',
                      borderRadius: 100,
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: '#FFFFFF'
                    }}>
                      {proj.category}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); alert('Card settings'); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <DotsIcon size={16} />
                    </button>
                  </div>

                  {/* Title and stats at the bottom */}
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    right: 12
                  }}>
                    <div style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: 8
                    }}>
                      {proj.title}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          onClick={e => handleLike(proj.id, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            color: isLiked ? '#FF7A5C' : '#A1A1AA',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <HeartIcon filled={isLiked} size={12} />
                          <span>{proj.likes}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          color: '#A1A1AA',
                          fontWeight: 600
                        }}>
                          <EyeIcon size={12} />
                          <span>{proj.views}</span>
                        </div>
                      </div>

                      {/* Play Button Icon */}
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest Toast Notification Gate */}
      {toast && (
        <GuestToast
          message={`Sign in to ${toast.action} on CreativeVerse.`}
          onSignIn={() => { setToast(null); navigate('/signin'); }}
          onDismiss={() => setToast(null)}
        />
      )}

      <BottomSheet open={showSafetySheet} title="Safety options" onClose={() => { if (!isSafetyAction) setShowSafetySheet(false); }}>
        {!moderationTargetId ? <p style={{ margin: '4px 0', color: '#A1A1AA', fontSize: 13, lineHeight: 1.5 }}>Safety actions need this profile’s creator account ID. This profile currently provides a username only, so no block or report request was sent.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
          <p style={{ margin: 0, color: '#A1A1AA', fontSize: 13, lineHeight: 1.45 }}>Manage how you interact with @{currentCreator.username}, or report a concern to the moderation team.</p>
          <button type="button" disabled={isSafetyAction} onClick={() => setShowBlockConfirm(true)} style={{ minHeight: 46, borderRadius: 12, border: '1px solid rgba(255,120,140,.3)', background: 'rgba(217,75,98,.1)', color: '#ff9cac', fontWeight: 800, cursor: 'pointer' }}>{isBlocked ? 'Unblock creator' : 'Block creator'}</button>
          <label style={{ display: 'grid', gap: 7, color: '#E4E4E7', fontSize: 13, fontWeight: 700 }}>Report concern<textarea value={reportReason} maxLength={500} onChange={(event) => setReportReason(event.target.value)} placeholder="Tell us what happened (up to 500 characters)" style={{ minHeight: 96, boxSizing: 'border-box', resize: 'vertical', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', font: 'inherit' }} /></label>
          <button type="button" disabled={isSafetyAction || !reportReason.trim()} onClick={submitReport} style={{ minHeight: 46, borderRadius: 12, border: 'none', background: '#FF7A5C', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: isSafetyAction || !reportReason.trim() ? .6 : 1 }}>{isSafetyAction ? 'Submitting…' : 'Submit report'}</button>
        </div>}
      </BottomSheet>
      <ConfirmDialog open={showBlockConfirm} title={isBlocked ? 'Unblock creator?' : 'Block creator?'} message={isBlocked ? 'You will be able to message and collaborate with this creator again.' : 'Blocking prevents new messages and collaboration requests between you and this creator.'} confirmLabel={isBlocked ? 'Unblock' : 'Block'} onConfirm={toggleBlock} onClose={() => setShowBlockConfirm(false)} />
    </div>
  );
};

export default CreatorProfilePage;
