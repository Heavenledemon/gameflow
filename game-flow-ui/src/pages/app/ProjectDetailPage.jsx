import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjectRealtime } from '../../hooks/useProjectRealtime';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useConversations } from '../../hooks/useConversations';
import { useInbox } from '../../hooks/useInbox';
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime';
import { useToast } from '../../context/ToastContext';
import {
  createCommentReply,
  createPostComment,
  fetchProject,
  togglePostLike,
  togglePostSave,
  updateContentEngagement,
  deleteProject,
  updateProject,
  createCollaborationRequest,
  fetchCollaborationCandidates,
  toggleUserFollow,
} from '../../lib/content';
import GltfAssetViewer from '../../components/GltfAssetViewer';
import WebGLGamePlayer from '../../components/WebGLGamePlayer';
import GuestBanner from '../../components/layout/GuestBanner';
import { BottomSheet, ConfirmDialog } from '../../components/ui/Overlay';
import { removeProjectMember, updateProjectMember } from '../../lib/collaboration';
import {
  ChevronLeftIcon, HeartIcon,
  CommentIcon, BookmarkIcon, ShareIcon, VerifiedIcon, DotsIcon
} from '../../components/icons/Icons';

const C = {
  bg: '#090909',
  surface: '#121212',
  surfaceGlass: 'rgba(20, 20, 20, 0.7)',
  cardGlass: 'rgba(255, 255, 255, 0.03)',
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  text: '#F5F5F7',
  textSecondary: '#A1A1AA',
  accent: '#FF7A5C',
  accentGrad: 'linear-gradient(135deg, #FF7A5C 0%, #E65C40 100%)',
  purple: '#A855F7',
  pink: '#EC4899',
  success: '#34D399',
};

const formatCount = (value = 0) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

const AVATAR = 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/19f781f2a-1e76-4c62-8f73-55c5248d45ab.png';
const BANNER = 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/1bd8db8c4-7446-4905-bbe6-106a3bce5dc2.png';

const GlassBadge = ({ children }) => (
  <span style={{
    padding: '6px 12px',
    borderRadius: 100,
    background: 'rgba(255, 255, 255, 0.06)',
    border: `1px solid ${C.borderGlass}`,
    color: '#FFF',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }}>
    {children}
  </span>
);

const GlassChip = ({ children, accent }) => (
  <span style={{
    padding: '6px 12px',
    borderRadius: 8,
    background: accent ? 'rgba(255, 122, 92, 0.1)' : 'rgba(255, 255, 255, 0.03)',
    border: `1px solid ${accent ? 'rgba(255, 122, 92, 0.2)' : C.borderGlass}`,
    color: accent ? C.accent : C.textSecondary,
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s',
  }}>
    {children}
  </span>
);

const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { isGuest, user, token } = useAuth();
  const { success: showSuccess, error: showError, info: showInfo } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showOwnerSheet, setShowOwnerSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showCollaborationSheet, setShowCollaborationSheet] = useState(false);
  const [collaborationCandidates, setCollaborationCandidates] = useState([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [collaborationMessage, setCollaborationMessage] = useState('');
  const [collaborationError, setCollaborationError] = useState('');
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [isSendingCollaborationRequest, setIsSendingCollaborationRequest] = useState(false);
  const [showGuestAuthSheet, setShowGuestAuthSheet] = useState(false);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [memberActionId, setMemberActionId] = useState('');
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false);
  const [localProjectRequest, setLocalProjectRequest] = useState(null);

  const normalizedOwnerUsernameForRole = String(project?.ownerUsername || '').trim().toLowerCase();
  const normalizedViewerUsernameForRole = String(user?.username || '').trim().toLowerCase();
  const isOwner = Boolean(project && user && (
    (project.ownerId && String(project.ownerId) === String(user.id || user._id)) ||
    (normalizedOwnerUsernameForRole && normalizedOwnerUsernameForRole === normalizedViewerUsernameForRole)
  ));
  const viewerRole = project?.viewerRole || (isOwner ? 'owner' : '');
  const isActiveMember = Boolean(viewerRole);
  const canManageMembers = isOwner || ['owner', 'editor'].includes(viewerRole);
  const members = useProjectMembers(token, projectId, { enabled: Boolean(token && isActiveMember) });
  const conversations = useConversations(token, { enabled: Boolean(token && isActiveMember) });
  const outgoingRequests = useInbox(token, 'outgoing');

  const localIdRef = useRef(0);
  const nextLocalId = () => {
    localIdRef.current += 1;
    return `local-${localIdRef.current}`;
  };

  useProjectRealtime(projectId, token, {
    onEngagementUpdated: (data) => {
      if (data?.engagement) {
        syncProject({ engagement: data.engagement });
      }
    },
    onReconnected: async () => {
      try {
        const data = await fetchProject(projectId, token);
        if (data?.project) {
          syncProject(data.project);
        }
      } catch (err) {
        console.warn('Failed to refetch project data after reconnection:', err);
      }
    }
  });

  useEffect(() => {
    let isMounted = true;
    async function getProjectData() {
      setLoading(true);
      try {
        const data = await fetchProject(projectId, token);
        if (isMounted && data?.project) {
          setProject(data.project);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load project details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    getProjectData();
    return () => {
      isMounted = false;
    };
  }, [projectId, token]);

  const guard = (fn) => (...args) => {
    if (isGuest) {
      setShowGuestAuthSheet(true);
    } else {
      fn(...args);
    }
  };

  const engagement = project?.engagement ?? {};
  const comments = Array.isArray(engagement.comments) ? engagement.comments : [];
  const liked = Boolean(engagement.viewerHasLiked ?? engagement.isLiked);
  const saved = Boolean(engagement.viewerHasSaved ?? engagement.isSaved);

  const syncProject = (updatedContent) => {
    if (!updatedContent) return;
    setProject((prev) =>
      prev
        ? {
            ...prev,
            ...updatedContent,
            engagement: {
              ...(prev.engagement ?? {}),
              ...(updatedContent.engagement ?? {}),
            },
          }
        : updatedContent
    );
  };

  const reloadProjectAccess = useCallback(async () => {
    try {
      const data = await fetchProject(projectId, token);
      if (data?.project) syncProject(data.project);
    } catch {
      // The next protected read will make removed/private access authoritative.
    }
  }, [projectId, token]);
  const reloadMembers = members.reload;
  const reloadProjectConversations = conversations.reload;
  const handleProjectRealtimeEvent = useCallback((eventName, event) => {
    if (!eventName.startsWith('project.member.') || String(event?.projectId) !== String(projectId)) return;
    reloadMembers();
    reloadProjectConversations();
    reloadProjectAccess();
  }, [projectId, reloadMembers, reloadProjectAccess, reloadProjectConversations]);
  useMessagingRealtime(token, { onEvent: handleProjectRealtimeEvent, onReady: reloadProjectAccess });

  const mutateEngagement = async (action, payload = {}) => {
    if (isGuest) {
      setShowGuestAuthSheet(true);
      return;
    }

    if (action === 'react') {
      const prev = engagement;
      syncProject({
        engagement: {
          ...engagement,
          viewerHasLiked: !liked,
          isLiked: !liked,
          likesCount: Math.max(0, Number(engagement.likesCount || 0) + (liked ? -1 : 1)),
        },
      });
      try {
        const result = await togglePostLike(token, projectId);
        syncProject({ engagement: result.engagement });
      } catch (err) {
        syncProject({ engagement: prev });
      }
      return;
    }

    if (action === 'save') {
      const prev = engagement;
      syncProject({
        engagement: {
          ...engagement,
          viewerHasSaved: !saved,
          isSaved: !saved,
          savesCount: Math.max(0, Number(engagement.savesCount || 0) + (saved ? -1 : 1)),
        },
      });
      try {
        const result = await togglePostSave(token, projectId);
        syncProject({ engagement: result.engagement });
      } catch (err) {
        syncProject({ engagement: prev });
      }
      return;
    }

    const result = await updateContentEngagement(token, 'project', projectId, {
      action,
      ...payload,
    });
    syncProject(result.content);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert('Project link copied to clipboard!');
      }
    } catch {
      window.prompt('Copy this link', url);
    }
    if (!isGuest) await mutateEngagement('share');
  };

  const openCollaborationPicker = async () => {
    setShowCollaborationSheet(true);
    setCollaborationError('');
    setIsLoadingCollaborators(true);
    try {
      const data = await fetchCollaborationCandidates(token);
      setCollaborationCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
    } catch (err) {
      setCollaborationError(err.message || 'Unable to load your connections.');
    } finally {
      setIsLoadingCollaborators(false);
    }
  };

  const sendCollaborationRequest = async () => {
    if (!selectedCollaborator) return;
    setIsSendingCollaborationRequest(true);
    setCollaborationError('');
    try {
      const result = await createCollaborationRequest(token, projectId, {
        recipientId: selectedCollaborator.id,
        message: collaborationMessage.trim(),
      });
      setLocalProjectRequest(result.request || null);
      const username = selectedCollaborator.username;
      setShowCollaborationSheet(false);
      setCollaborationMessage('');
      setSelectedCollaborator(null);
      showSuccess(`Invitation sent to @${username}.`);
    } catch (err) {
      setCollaborationError(err.message || 'Unable to send the collaboration request.');
    } finally {
      setIsSendingCollaborationRequest(false);
    }
  };

  const requestToCollaborate = async () => {
    setIsSendingCollaborationRequest(true);
    try {
      const result = await createCollaborationRequest(token, projectId, { proposedRole: 'contributor', message: '' });
      setLocalProjectRequest(result.request || null);
      showSuccess('Collaboration request sent. You can track it in Inbox.');
    } catch (err) {
      showError(err.message || 'Unable to send collaboration request.');
    } finally {
      setIsSendingCollaborationRequest(false);
    }
  };

  const toggleFollowing = async () => {
    if (!project?.ownerId) return;
    const previousValue = isFollowing;
    setIsFollowing(!previousValue);
    try {
      const result = await toggleUserFollow(token, project.ownerId);
      setIsFollowing(Boolean(result.following));
    } catch (err) {
      setIsFollowing(previousValue);
      alert(err.message || 'Unable to update follow status.');
    }
  };

  const projectRequest = localProjectRequest || outgoingRequests.items.find((request) => String(request.projectId) === String(projectId));
  const workspaceConversation = conversations.items.find((conversation) => conversation.kind === 'project' && String(conversation.projectId) === String(projectId));

  const openWorkspace = async () => {
    if (!isActiveMember) return;
    setIsOpeningWorkspace(true);
    try {
      const conversation = workspaceConversation || await conversations.findProjectConversation(projectId);
      if (!conversation) {
        showInfo('Your workspace is still being prepared. You can find it in Inbox when it is ready.');
        return;
      }
      navigate(`/app/inbox/${conversation.id}`, { state: { conversation } });
    } catch (workspaceError) {
      showError(workspaceError.message || 'Unable to open the project workspace.');
    } finally {
      setIsOpeningWorkspace(false);
    }
  };

  const applyRoleChange = async () => {
    const change = pendingRoleChange;
    if (!change) return;
    setMemberActionId(change.member.userId);
    try {
      const result = await updateProjectMember(token, projectId, change.member.userId, change.role);
      members.setItems((items) => items.map((member) => member.userId === change.member.userId ? result.member : member));
      showSuccess(`@${change.member.username || 'member'} is now a ${change.role}.`);
    } catch (memberError) {
      showError(memberError.message || 'Unable to update this member role.');
    } finally {
      setMemberActionId('');
      setPendingRoleChange(null);
    }
  };

  const removeMember = async () => {
    const member = pendingRemoval;
    if (!member) return;
    setMemberActionId(member.userId);
    try {
      await removeProjectMember(token, projectId, member.userId);
      members.setItems((items) => items.filter((item) => item.userId !== member.userId));
      showSuccess(`@${member.username || 'member'} was removed from this project.`);
    } catch (memberError) {
      showError(memberError.message || 'Unable to remove this member.');
    } finally {
      setMemberActionId('');
      setPendingRemoval(null);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    const prev = engagement;
    try {
      const optComment = {
        commentId: `optimistic-${nextLocalId()}`,
        userId: user?.id || user?._id || 'me',
        username: user?.username || 'me',
        name: user?.name || 'Me',
        avatar: user?.avatar || AVATAR,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
        replies: [],
      };
      syncProject({
        engagement: {
          ...engagement,
          commentsCount: Number(engagement.commentsCount || 0) + 1,
          comments: [optComment, ...comments],
        },
      });
      const result = await createPostComment(token, projectId, { text: commentText.trim() });
      syncProject({ engagement: result.engagement });
      setCommentText('');
    } catch (err) {
      syncProject({ engagement: prev });
      alert(err.message || 'Failed to add comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = async (commentId) => {
    if (isGuest) {
      setShowGuestAuthSheet(true);
      return;
    }
    const text = window.prompt('Write a reply');
    if (!text || !text.trim()) return;

    try {
      const result = await createCommentReply(token, commentId, { text: text.trim() });
      syncProject({ engagement: result.engagement });
    } catch (err) {
      alert(err.message || 'Failed to add reply.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmTitle !== project.title) {
      alert('Project title does not match. Deletion cancelled.');
      return;
    }
    try {
      await deleteProject(token, projectId);
      alert('Project deleted successfully.');
      navigate('/app/profile');
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const toggleVisibility = async () => {
    try {
      const updated = await updateProject(token, projectId, {
        visibility: project.visibility === 'public' ? 'private' : 'public'
      });
      syncProject(updated.project);
      alert(`Project is now ${updated.project.visibility}.`);
    } catch (err) {
      alert(err.message || 'Failed to update visibility.');
    }
  };

  if (loading) {
    return (
      <div className="mobile-frame" style={{ width: '100%', height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: C.textSecondary }}>Loading Immersive Space...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mobile-frame" style={{ width: '100%', height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, color: C.textSecondary }}>{error || 'Project not found.'}</div>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: C.accent, border: 'none', borderRadius: 12, color: '#FFF', fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  const imageSrc = project.previewUrl || project.imageUrl || BANNER;
  const creatorRole = project.type === 'game' ? 'Game Developer' : project.type === '3d' ? '3D Artist' : '2D Artist';
  return (
    <div
      className="mobile-frame"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: C.text,
      }}
    >
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
        background: `radial-gradient(circle at 50% 0%, ${C.accent}12, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── TOP NAV BAR ── */}
      <div style={{
        position: 'relative', zIndex: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'linear-gradient(to bottom, rgba(9,9,9,0.85) 0%, rgba(9,9,9,0) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${C.borderGlass}`,
              color: C.text, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeftIcon size={20} />
          </button>

          <div
            onClick={() => {
              if (isOwner) navigate('/app/profile');
              else navigate(`/app/creator/${project.ownerUsername || 'creator'}`);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <img
              src={(isOwner && user.avatar) ? user.avatar : (project.ownerAvatar || AVATAR)}
              alt="creator"
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1.2 }}>
                {project.ownerUsername || 'creator'}
                {(!isOwner || user?.isVerified) && <VerifiedIcon size={11} />}
              </span>
              <span style={{ fontSize: 10, color: C.textSecondary }}>{creatorRole}</span>
            </div>
          </div>
          {Array.isArray(project.collaborators) && project.collaborators.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 6 }} title={project.collaborators.map((member) => `${member.name || member.username} · ${member.role}`).join(', ')}>
              {project.collaborators.slice(1, 4).map((member, index) => <img key={member.id} src={member.avatar || AVATAR} alt={`${member.name || member.username} (${member.role})`} style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: '50%', border: '2px solid #0B0D12', marginLeft: index ? -7 : 0 }} />)}
              {project.collaborators.length > 4 && <span style={{ marginLeft: 4, fontSize: 11, color: C.textSecondary }}>+{project.collaborators.length - 4}</span>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isOwner ? (
            <button
              onClick={() => setShowOwnerSheet(true)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${C.borderGlass}`,
                color: C.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <DotsIcon size={20} />
            </button>
          ) : (
            <button
              onClick={guard(toggleFollowing)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                background: isFollowing ? 'transparent' : C.accent,
                border: `1px solid ${isFollowing ? C.borderGlass : 'transparent'}`,
                color: '#FFF',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 110,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isGuest && <GuestBanner onSignIn={() => navigate('/signin')} />}

        {/* ── IMMERSIVE MEDIA SPACE ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '52vh',
          background: '#040404',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderBottom: `1px solid ${C.borderGlass}`,
        }}>
          {project.type === '3d' && project.modelUrl ? (
            <GltfAssetViewer
              modelUrl={project.modelUrl}
              title={project.title}
              mode={project.mode || 'landscape'}
            />
          ) : project.type === 'game' && project.gameUrl ? (
            <WebGLGamePlayer
              gameUrl={project.gameUrl}
              title={project.title}
              mode={project.mode || 'landscape'}
              loadingScreenUrl={project.previewUrl}
            />
          ) : (
            <img
              src={imageSrc}
              alt={project.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}

          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 5 }}>
            <GlassBadge>{project.category || project.type}</GlassBadge>
          </div>

          {project.type === '3d' && (
            <div style={{
              position: 'absolute', bottom: 16,
              background: 'rgba(9, 9, 9, 0.65)',
              border: `1px solid ${C.borderGlass}`,
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 100,
              fontSize: 11,
              color: C.textSecondary,
              fontWeight: 500,
            }}>
              Drag to orbit · Pinch to zoom
            </div>
          )}
        </div>

        {/* ── INFO & DETAILS AREA ── */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              margin: '0 0 6px',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}>
              {project.title}
            </h1>
            <p style={{
              fontSize: 12.5,
              color: C.textSecondary,
              margin: 0,
            }}>
              Published in <span style={{ color: C.accent, fontWeight: 600 }}>{project.category || project.type}</span> · {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'}
            </p>
          </div>

          <div>
            <p style={{
              fontSize: 14,
              color: C.textSecondary,
              lineHeight: 1.6,
              margin: 0,
              maxHeight: descExpanded ? 'none' : '4.8em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: descExpanded ? 'none' : 3,
              WebkitBoxOrient: 'vertical',
            }}>
              {project.description || 'No description provided for this artwork.'}
            </p>
            {project.description && project.description.length > 100 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                style={{
                  background: 'none', border: 'none', color: C.accent,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  padding: '6px 0 0',
                }}
              >
                {descExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </div>

          {Array.isArray(project.tags) && project.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {project.tags.map(t => (
                <GlassChip key={t} accent>#{t}</GlassChip>
              ))}
            </div>
          )}

          {/* ── HORIZONTAL ACTION/ENGAGEMENT BAR ── */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${C.borderGlass}`,
            borderRadius: 16,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-around',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            {[
              {
                icon: <HeartIcon filled={liked} size={22} color={liked ? C.accent : 'currentColor'} />,
                label: formatCount(engagement.likesCount),
                onClick: () => mutateEngagement('react'),
                active: liked,
              },
              {
                icon: <CommentIcon size={22} />,
                label: formatCount(engagement.commentsCount),
                onClick: () => setShowCommentsSheet(true),
              },
              {
                icon: <BookmarkIcon filled={saved} size={22} color={saved ? C.accent : 'currentColor'} />,
                label: formatCount(engagement.savesCount),
                onClick: () => mutateEngagement('save'),
                active: saved,
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                label: isActiveMember ? 'Chat' : (isOwner ? 'Invite' : projectRequest ? 'Sent' : 'Request'),
                onClick: isActiveMember ? openWorkspace : guard(isOwner ? openCollaborationPicker : () => {
                  if (projectRequest?.conversationId) navigate(`/app/inbox/${projectRequest.conversationId}`, { state: { conversation: { id: projectRequest.conversationId, kind: 'collaboration_request', projectId, collaborationRequestId: projectRequest.id }, request: projectRequest } });
                  else requestToCollaborate();
                }),
              },
              {
                icon: <ShareIcon size={22} />,
                label: 'Share',
                onClick: handleShare,
              },
            ].filter((act) => act.label !== 'Request' || project?.collaborationOpen).map((act, i) => (
              <button
                key={i}
                onClick={act.onClick}
                style={{
                  background: 'none', border: 'none',
                  color: act.active ? C.accent : C.text,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '4px 8px', transition: 'all 0.15s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={e => e.currentTarget.style.transform = 'none'}
              >
                {act.icon}
                <span style={{ fontSize: 11, fontWeight: 600 }}>{act.label}</span>
              </button>
            ))}
          </div>

          {isActiveMember ? <div style={{ background: 'linear-gradient(135deg, rgba(255,122,92,.1), rgba(168,85,247,.06))', border: `1px solid rgba(255,122,92,.2)`, borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div><h3 style={{ margin: 0, fontSize: 16 }}>Team workspace</h3><p style={{ margin: '4px 0 0', color: C.textSecondary, fontSize: 12.5, lineHeight: 1.4 }}>Your role: <strong style={{ color: C.text, textTransform: 'capitalize' }}>{viewerRole}</strong></p></div>
              <button onClick={() => setShowMembersSheet(true)} style={{ minHeight: 40, padding: '0 12px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: `1px solid ${C.borderGlass}`, color: C.text, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Team {members.status === 'ready' ? `(${members.items.length})` : ''}</button>
            </div>
            <button onClick={openWorkspace} disabled={isOpeningWorkspace} style={{ width: '100%', minHeight: 46, border: 'none', borderRadius: 12, background: C.accentGrad, color: '#fff', fontWeight: 800, fontSize: 13, cursor: isOpeningWorkspace ? 'wait' : 'pointer', opacity: isOpeningWorkspace ? .72 : 1 }}>{isOpeningWorkspace ? 'Opening workspace…' : 'Open project chat'}</button>
          </div> : null}

          {/* ── PROJECT STATS GLASS CARD ── */}
          {!isOwner ? <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${C.borderGlass}`,
            borderRadius: 20,
            padding: '18px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            textAlign: 'center',
          }}>
            {[
              { label: 'Views', value: formatCount(project.viewsCount || 1240) },
              { label: 'Likes', value: formatCount(engagement.likesCount) },
              { label: 'Comments', value: formatCount(engagement.commentsCount) },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{stat.value}</div>
              </div>
            ))}
          </div> : null}

          {/* ── COLLABORATION CTA ── */}
          {isOwner ? <div style={{
            background: 'linear-gradient(135deg, rgba(255, 122, 92, 0.06) 0%, rgba(168, 85, 247, 0.04) 100%)',
            border: `1px solid rgba(255, 122, 92, 0.15)`,
            borderRadius: 20,
            padding: 22,
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Invite a collaborator</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12.5, color: C.textSecondary, lineHeight: 1.45 }}>
              Choose someone you follow, or someone who follows you, for this project.
            </p>
            <button
              onClick={guard(openCollaborationPicker)}
              style={{
                width: '100%', height: 46, borderRadius: 12,
                background: C.accentGrad, border: 'none', color: '#FFF',
                fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Choose a collaborator
            </button>
          </div> : null}

          {/* ── TOOLS USED ── */}
          {Array.isArray(project.software) && project.software.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.textSecondary }}>
                Tools Used
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {project.software.map(sw => (
                  <GlassChip key={sw}>{sw}</GlassChip>
                ))}
              </div>
            </div>
          )}

          {/* ── CREATOR PROFILE CARD ── */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${C.borderGlass}`,
            borderRadius: 20,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={(isOwner && user.avatar) ? user.avatar : (project.ownerAvatar || AVATAR)}
                alt="creator"
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {project.ownerUsername || 'creator'}
                  {(!isOwner || user?.isVerified) && <VerifiedIcon size={12} />}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textSecondary }}>
                  Verified CreativeVerse Creator
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!isOwner ? <button
                onClick={guard(toggleFollowing)}
                style={{
                  flex: 1, height: 38, borderRadius: 10,
                  background: isFollowing ? 'transparent' : C.accent,
                  border: `1px solid ${isFollowing ? C.borderGlass : 'transparent'}`,
                  color: '#FFF', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button> : <button
                onClick={() => navigate(`/app/upload?edit=${project.id || project._id}`)}
                style={{ flex: 1, height: 38, borderRadius: 10, background: C.accent, border: 'none', color: '#FFF', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
              >Edit Project</button>}
              <button
                onClick={() => {
                  if (isOwner) navigate('/app/profile');
                  else navigate(`/app/creator/${project.ownerUsername || 'creator'}`);
                }}
                style={{
                  flex: 1, height: 38, borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderGlass}`,
                  color: C.text, fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                }}
              >
                Visit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMMENTS BOTTOM SHEET ── */}
      <BottomSheet open={showCommentsSheet} title={`Responses (${comments.length})`} onClose={() => setShowCommentsSheet(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value.slice(0, 200))}
                placeholder={isGuest ? 'Sign in to add a response' : 'What are your thoughts?'}
                disabled={isGuest || isSubmittingComment}
                style={{
                  width: '100%',
                  height: 80,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.borderGlass}`,
                  color: C.text,
                  padding: 12,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: 8,
                right: 12,
                fontSize: 11,
                color: commentText.length >= 200 ? C.accent : C.textSecondary
              }}>
                {commentText.length}/200
              </span>
            </div>
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              style={{
                height: 44,
                borderRadius: 12,
                background: C.accent,
                border: 'none',
                color: '#FFF',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                opacity: commentText.trim() ? 1 : 0.5,
              }}
            >
              {isSubmittingComment ? 'Sending...' : 'Post Response'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {comments.map((comment) => (
              <div key={comment.commentId} style={{
                padding: 14,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${C.borderGlass}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={comment.avatar || AVATAR}
                      alt="commenter"
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {comment.username || 'member'}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13.5, color: C.textSecondary, lineHeight: 1.45 }}>
                  {comment.text}
                </p>
                <button
                  onClick={() => handleReply(comment.commentId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Reply
                </button>
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.textSecondary, fontStyle: 'italic' }}>
                No responses yet.
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* ── GUEST AUTHENTICATION BANNER SHEET ── */}
      <BottomSheet open={showCollaborationSheet} title="Invite a collaborator" onClose={() => { if (!isSendingCollaborationRequest) setShowCollaborationSheet(false); }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
          <p style={{ margin: 0, color: C.textSecondary, fontSize: 13, lineHeight: 1.45 }}>
            Invite a person you follow or who follows you to collaborate on <strong style={{ color: C.text }}>{project.title}</strong>.
          </p>
          {collaborationError ? <p style={{ margin: 0, color: '#ff8b72', fontSize: 13 }}>{collaborationError}</p> : null}
          {isLoadingCollaborators ? <p style={{ margin: 0, color: C.textSecondary, fontSize: 13 }}>Loading your connections…</p> : null}
          {!isLoadingCollaborators && !collaborationError && collaborationCandidates.length === 0 ? <div style={{ padding: '20px 4px', textAlign: 'center', color: C.textSecondary, fontSize: 13, lineHeight: 1.5 }}>No eligible collaborators yet. Follow creators, or wait for someone to follow you, then invite them here.</div> : null}
          {collaborationCandidates.map((candidate) => {
            const selected = selectedCollaborator?.id === candidate.id;
            return <button key={candidate.id} onClick={() => setSelectedCollaborator(candidate)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 12, textAlign: 'left', borderRadius: 12, cursor: 'pointer', background: selected ? 'rgba(255,122,92,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected ? C.accent : C.borderGlass}`, color: C.text }}>
              <img src={candidate.avatar || AVATAR} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 13 }}>{candidate.name || candidate.username}</strong><span style={{ fontSize: 12, color: C.textSecondary }}>@{candidate.username} · {candidate.relationship}</span></span>
            </button>;
          })}
          {selectedCollaborator ? <>
            <textarea value={collaborationMessage} onChange={(event) => setCollaborationMessage(event.target.value.slice(0, 500))} placeholder={`Add a note for @${selectedCollaborator.username} (optional)`} style={{ width: '100%', height: 72, boxSizing: 'border-box', padding: 12, borderRadius: 12, resize: 'none', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderGlass}`, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            <button onClick={sendCollaborationRequest} disabled={isSendingCollaborationRequest} style={{ height: 46, borderRadius: 12, border: 'none', background: C.accentGrad, color: '#fff', fontWeight: 700, cursor: isSendingCollaborationRequest ? 'wait' : 'pointer', opacity: isSendingCollaborationRequest ? 0.7 : 1 }}>
              {isSendingCollaborationRequest ? 'Sending…' : `Invite @${selectedCollaborator.username}`}
            </button>
          </> : null}
        </div>
      </BottomSheet>

      <BottomSheet open={showMembersSheet} title="Project team" onClose={() => setShowMembersSheet(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
          <p style={{ margin: 0, color: C.textSecondary, fontSize: 13, lineHeight: 1.45 }}>{canManageMembers ? 'Manage member roles and project access.' : 'People currently collaborating on this project.'}</p>
          {members.status === 'loading' ? <p style={{ margin: '14px 0', color: C.textSecondary, fontSize: 13, textAlign: 'center' }}>Loading project team…</p> : null}
          {members.status === 'error' ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#ff9a82', fontSize: 13 }}><span>{members.error}</span><button type="button" onClick={members.reload} style={{ minHeight: 42, borderRadius: 10, border: `1px solid ${C.borderGlass}`, background: 'transparent', color: C.text, fontWeight: 700 }}>Try again</button></div> : null}
          {members.status === 'ready' && !members.items.length ? <p style={{ margin: '14px 0', color: C.textSecondary, fontSize: 13, textAlign: 'center' }}>No active members were found.</p> : null}
          {members.items.map((member) => {
            const canEditMember = canManageMembers && member.role !== 'owner' && !(String(member.userId) === String(user?.id || user?._id) && !isOwner);
            const isWorking = memberActionId === member.userId;
            return <article key={member.userId} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.035)', border: `1px solid ${C.borderGlass}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><img src={member.avatar || AVATAR} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} /><div style={{ minWidth: 0, flex: 1 }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{member.name || member.username || 'Creator'}</strong><span style={{ color: C.textSecondary, fontSize: 12 }}>@{member.username || 'creator'} · Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'recently'}</span></div><span style={{ color: member.role === 'owner' ? '#ffb09b' : C.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{member.role}</span></div>
              {canEditMember ? <div style={{ display: 'flex', gap: 8 }}><select aria-label={`Change ${member.username || 'member'} role`} value={member.role} disabled={isWorking} onChange={(event) => { if (event.target.value !== member.role) setPendingRoleChange({ member, role: event.target.value }); }} style={{ minHeight: 40, flex: 1, borderRadius: 10, padding: '0 8px', background: 'rgba(255,255,255,.07)', border: `1px solid ${C.borderGlass}`, color: C.text, fontSize: 12 }}><option value="editor">Editor</option><option value="contributor">Contributor</option><option value="viewer">Viewer</option></select><button type="button" disabled={isWorking} onClick={() => setPendingRemoval(member)} style={{ minHeight: 40, padding: '0 11px', borderRadius: 10, background: 'rgba(217,75,98,.1)', border: '1px solid rgba(217,75,98,.25)', color: '#ff8b9b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{isWorking ? 'Working…' : 'Remove'}</button></div> : null}
            </article>;
          })}
        </div>
      </BottomSheet>

      <BottomSheet open={showGuestAuthSheet} title="Access Protected Action" onClose={() => setShowGuestAuthSheet(false)}>
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5, margin: 0 }}>
            Sign in to your account to like, save, comment, or collaborate with creators on CreativeVerse.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { setShowGuestAuthSheet(false); navigate('/signin'); }}
              style={{
                flex: 1, height: 46, borderRadius: 12,
                background: C.accentGrad, border: 'none', color: '#FFF',
                fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setShowGuestAuthSheet(false)}
              style={{
                flex: 1, height: 46, borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderGlass}`,
                color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── OWNER ACTIONS SHEET ── */}
      <BottomSheet open={showOwnerSheet} title="Manage Project" onClose={() => setShowOwnerSheet(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 0' }}>
          <button
            onClick={() => {
              setShowOwnerSheet(false);
              navigate(`/app/upload?edit=${projectId}`);
            }}
            style={{
              height: 48, width: '100%', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderGlass}`,
              color: C.text, fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}
          >
            Edit Project Metadata
          </button>
          <button
            onClick={() => {
              setShowOwnerSheet(false);
              toggleVisibility();
            }}
            style={{
              height: 48, width: '100%', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderGlass}`,
              color: C.text, fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}
          >
            Make {project.visibility === 'public' ? 'Private' : 'Public'}
          </button>
          <button
            onClick={() => {
              setShowOwnerSheet(false);
              setShowDeleteDialog(true);
            }}
            style={{
              height: 48, width: '100%', borderRadius: 12,
              background: 'rgba(217, 75, 98, 0.1)', border: '1px solid rgba(217, 75, 98, 0.2)',
              color: '#d94b62', fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}
          >
            Delete Project
          </button>
        </div>
      </BottomSheet>

      {/* ── DELETE DIALOG ── */}
      <ConfirmDialog
        open={Boolean(pendingRoleChange)}
        title="Change member role?"
        confirmLabel="Change role"
        onConfirm={applyRoleChange}
        onClose={() => setPendingRoleChange(null)}
        message={pendingRoleChange ? `Make @${pendingRoleChange.member.username || 'this member'} a ${pendingRoleChange.role}?` : ''}
      />

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title="Remove collaborator?"
        confirmLabel="Remove member"
        onConfirm={removeMember}
        onClose={() => setPendingRemoval(null)}
        message={pendingRemoval ? `Remove @${pendingRemoval.username || 'this member'} from this project and its private workspace?` : ''}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title="Confirm Deletion"
        confirmLabel="Delete Permanently"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmTitle('');
        }}
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span>This action cannot be undone. To verify, please type the project title: <strong>{project.title}</strong></span>
            <input
              type="text"
              value={deleteConfirmTitle}
              onChange={e => setDeleteConfirmTitle(e.target.value)}
              placeholder="Type project title..."
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.borderGlass}`,
                color: C.text,
                padding: '0 12px',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        }
      />
    </div>
  );
};

export default ProjectDetailPage;
