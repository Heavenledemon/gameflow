import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaGithub, FaInstagram, FaLinkedin, FaBehance, FaArtstation } from 'react-icons/fa';
import { SiItchdotio } from 'react-icons/si';
import { fetchContent, togglePostLike, updateProject, deleteProject, uploadProjectFile } from '../../lib/content';
import { fetchMyCollaborations } from '../../lib/collaboration';
import GuestBanner from '../../components/layout/GuestBanner';
import GuestToast from '../../components/layout/GuestToast';
import {
  ChevronLeftIcon, ShareIcon2, VerifiedIcon, ChevronDownIcon
} from '../../components/icons/Icons';

// Local skill icons with color & size support
const CodeSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const DatabaseSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 11v8c0 1.66 3.58 3 8 3s8-1.34 8-3v-8" />
  </svg>
);

const BrushSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 3a3 3 0 0 1 3 3c0 5-3 8-6 8h-1l-4 4a3 3 0 0 1-4 0 3 3 0 0 1 0-4l4-4v-1c0-3 3-6 8-6z" />
    <path d="M6 18c-1 0-2 .4-3 1" />
  </svg>
);

const CloudSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
    <path d="M8 16h12a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8z" />
  </svg>
);

const CubeSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const AfterEffectsSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const GameSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="11" x2="10" y2="11" /><line x1="8" y1="9" x2="8" y2="13" />
    <line x1="15" y1="12" x2="15.01" y2="12" /><line x1="18" y1="10" x2="18.01" y2="10" />
    <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z" />
  </svg>
);

const ZBrushSkillIcon = ({ color = '#B8C0CC', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12a10 10 0 0 1 10-10z" />
    <path d="M12 6v12M6 12h12" />
  </svg>
);

// Tab and page SVG icons
const GridIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const HeartIcon = ({ size = 20, color = 'currentColor', fill = 'none', filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FF7A59' : fill} stroke={filled ? '#FF7A59' : color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

const BookmarkIcon = ({ size = 20, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

// Stats Card Icons
const GraduationCapIcon = ({ size = 20, color = '#FF7A59' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const CheckCircleIcon = ({ size = 20, color = '#A78BFA' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CalendarIcon = ({ size = 20, color = '#34D399' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ShareProfileIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 20 11 20 15" />
    <line x1="23" y1="8" x2="16" y2="15" />
  </svg>
);

const LogoutIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const EditIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const AVATAR = 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/19f781f2a-1e76-4c62-8f73-55c5248d45ab.png';
const BANNER = 'https://image.qwenlm.ai/public_source/581c980c-93ea-4473-a881-d706c334af84/1097bcf9c-55f8-4aa3-8544-7e63de8dd465.png';

const formatCount = (value = 0) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
};

const getEngagement = (item) => item?.engagement ?? {
  likesCount: 0,
  commentsCount: 0,
  savesCount: 0,
  sharesCount: 0,
  viewerHasLiked: false,
  viewerHasSaved: false,
  comments: [],
};

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#FFF',
  padding: '0 14px',
  fontSize: 14,
  outline: 'none',
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isGuest, logout, user, updateProfile, token } = useAuth();
  const [activeTab, setActiveTab] = useState('Projects');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editCreatorType, setEditCreatorType] = useState('Game Developer');
  const [editGithub, setEditGithub] = useState('');
  const [editItchio, setEditItchio] = useState('');
  const [editBehance, setEditBehance] = useState('');
  const [editArtstation, setEditArtstation] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projType, setProjType] = useState('game');
  const [projMode, setProjMode] = useState('landscape');
  const [projVisibility, setProjVisibility] = useState('public');
  const [projTags, setProjTags] = useState('');
  const [projSoftware, setProjSoftware] = useState('');
  const [isSavingProj, setIsSavingProj] = useState(false);
  const [isDeletingProj, setIsDeletingProj] = useState(false);
  const [newPreviewFile, setNewPreviewFile] = useState(null);
  const [previewUrlToDisplay, setPreviewUrlToDisplay] = useState('');
  const [contentFeed, setContentFeed] = useState({ projects: [], games: [], assets: [] });
  const [collaborationItems, setCollaborationItems] = useState([]);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    let timeoutId = null;

    const handleProfileUpdate = () => {
      setToastMsg('Profile updated successfully!');
      timeoutId = window.setTimeout(() => setToastMsg(null), 3000);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isGuest || !user) return;

    async function loadUserContent() {
      setIsLoadingProjects(true);
      try {
        const data = await fetchContent(token);
        if (!isMounted) return;
        const allProjects = Array.isArray(data?.projects) ? data.projects : [];
        const allGames = Array.isArray(data?.games) ? data.games : [];
        const allAssets = Array.isArray(data?.assets) ? data.assets : [];
        setContentFeed({ projects: allProjects, games: allGames, assets: allAssets });
        const filtered = allProjects.filter(
          (proj) => String(proj.ownerId) === String(user.id || user._id)
        );
        setUserProjects(filtered);
      } catch (err) {
        console.error('Failed to load user projects:', err);
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      }
    }

    loadUserContent();
    return () => {
      isMounted = false;
    };
  }, [user, isGuest, refreshTrigger, token]);

  useEffect(() => {
    if (isGuest || !token) return;
    fetchMyCollaborations(token).then((data) => setCollaborationItems((data.items || []).map((entry) => ({
      ...entry.project, id: entry.projectId, kind: 'Project', role: entry.role,
      thumbnail: entry.project.previewUrl || BANNER,
      subtitle: `${entry.role} · ${entry.project.category || entry.project.type || 'Project'}`,
    })))).catch(() => setCollaborationItems([]));
  }, [isGuest, token, refreshTrigger]);

  const handleGuestAction = (actionName) => {
    setToast({ action: actionName });
  };

  const handleOpenEdit = () => {
    if (isGuest) {
      handleGuestAction('Edit Profile');
      return;
    }

    setEditEmail(user?.email || '');
    setEditUsername(user?.username || '');
    setEditName(user?.name || '');
    setEditHeadline(user?.headline || '');
    setEditSkills(user?.skills?.join(', ') || '');
    setEditAvatar(user?.avatar || '');
    setEditBanner(user?.banner || '');
    setEditBio(user?.bio || '');
    setEditLocation(user?.location || '');
    setEditWebsite(user?.website || '');
    setEditCreatorType(user?.creatorType || 'Game Developer');
    setEditGithub(user?.github || '');
    setEditItchio(user?.itchio || '');
    setEditBehance(user?.behance || '');
    setEditArtstation(user?.artstation || '');
    setEditInstagram(user?.instagram || '');
    setEditLinkedin(user?.linkedin || '');
    setIsEditing(true);
  };

  const handleImageChange = (event, setImage) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const isValidUrl = (url) => {
    if (!url) return true;
    if (url.startsWith('data:')) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (isGuest) return;

    // URL Validations
    const urlsToValidate = [
      { name: 'Avatar', value: editAvatar },
      { name: 'Banner', value: editBanner },
      { name: 'Personal Website', value: editWebsite },
      { name: 'GitHub Link', value: editGithub },
      { name: 'Itch.io Link', value: editItchio },
      { name: 'Behance Link', value: editBehance },
      { name: 'ArtStation Link', value: editArtstation },
      { name: 'Instagram Link', value: editInstagram },
      { name: 'LinkedIn Link', value: editLinkedin }
    ];

    for (const field of urlsToValidate) {
      if (field.value && !isValidUrl(field.value)) {
        alert(`Please enter a valid URL for ${field.name}`);
        return;
      }
    }

    setIsSaving(true);

    try {
      const skillsArray = editSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      await updateProfile({
        email: editEmail,
        username: editUsername,
        name: editName,
        headline: editHeadline,
        skills: skillsArray,
        avatar: editAvatar,
        banner: editBanner,
        bio: editBio,
        location: editLocation,
        website: editWebsite,
        creatorType: editCreatorType,
        github: editGithub,
        itchio: editItchio,
        behance: editBehance,
        artstation: editArtstation,
        instagram: editInstagram,
        linkedin: editLinkedin
      });

      setIsEditing(false);
    } catch (error) {
      alert(error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditProject = (proj) => {
    setEditingProject(proj);
    setProjTitle(proj.title || '');
    setProjCategory(proj.category || '');
    setProjDescription(proj.description || '');
    setProjType(proj.type || 'game');
    setProjMode(proj.mode || 'landscape');
    setProjVisibility(proj.visibility || 'public');
    setProjTags(Array.isArray(proj.tags) ? proj.tags.join(', ') : '');
    setProjSoftware(Array.isArray(proj.software) ? proj.software.join(', ') : '');
    setNewPreviewFile(null);
    setPreviewUrlToDisplay(proj.previewUrl || '');
  };

  const handleSaveProjectEdit = async (event) => {
    event.preventDefault();
    if (!editingProject) return;

    setIsSavingProj(true);
    try {
      if (newPreviewFile) {
        const fileMeta = {
          name: newPreviewFile.name,
          relativePath: `cover/${newPreviewFile.name}`,
          mimeType: newPreviewFile.type || '',
        };
        await uploadProjectFile(token, editingProject.id || editingProject._id, fileMeta, newPreviewFile);
      }

      const tagsArray = projTags.split(',').map(t => t.trim()).filter(Boolean);
      const softwareArray = projSoftware.split(',').map(s => s.trim()).filter(Boolean);

      await updateProject(token, editingProject.id || editingProject._id, {
        title: projTitle,
        category: projCategory,
        description: projDescription,
        type: projType,
        mode: projMode,
        visibility: projVisibility,
        tags: tagsArray,
        software: softwareArray,
      });

      setToastMsg('Project updated successfully!');
      setEditingProject(null);
      triggerRefresh();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (error) {
      alert(error.message || 'Failed to update project.');
    } finally {
      setIsSavingProj(false);
    }
  };

  const handleOpenDeleteProject = (proj) => {
    setDeletingProject(proj);
  };

  const handleDeleteProjectConfirm = async () => {
    if (!deletingProject) return;

    setIsDeletingProj(true);
    try {
      await deleteProject(token, deletingProject.id || deletingProject._id);

      setToastMsg('Project deleted successfully!');
      setDeletingProject(null);
      triggerRefresh();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (error) {
      alert(error.message || 'Failed to delete project.');
    } finally {
      setIsDeletingProj(false);
    }
  };

  const syncContentItem = (updatedContent) => {
    if (!updatedContent?.id) {
      return;
    }

    setUserProjects((prev) =>
      prev.map((item) =>
        String(item.id ?? item._id) === String(updatedContent.id)
          ? {
              ...item,
              ...updatedContent,
              engagement: {
                ...(item.engagement ?? {}),
                ...(updatedContent.engagement ?? {}),
              },
            }
          : item,
      ),
    );

    setContentFeed((prev) => ({
      projects: prev.projects.map((item) =>
        String(item.id ?? item._id) === String(updatedContent.id)
          ? {
              ...item,
              ...updatedContent,
              engagement: {
                ...(item.engagement ?? {}),
                ...(updatedContent.engagement ?? {}),
              },
            }
          : item,
      ),
      games: prev.games.map((item) =>
        String(item.id ?? item._id) === String(updatedContent.id)
          ? {
              ...item,
              ...updatedContent,
              engagement: {
                ...(item.engagement ?? {}),
                ...(updatedContent.engagement ?? {}),
              },
            }
          : item,
      ),
      assets: prev.assets.map((item) =>
        String(item.id ?? item._id) === String(updatedContent.id)
          ? {
              ...item,
              ...updatedContent,
              engagement: {
                ...(item.engagement ?? {}),
                ...(updatedContent.engagement ?? {}),
              },
            }
          : item,
      ),
    }));
  };

  const handleLikeProject = async (proj, event) => {
    event.stopPropagation();

    if (isGuest) {
      handleGuestAction('Like projects');
      return;
    }

    try {
      const result = await togglePostLike(token, proj.id || proj._id);
      syncContentItem({
        id: proj.id || proj._id,
        engagement: result.engagement,
      });
      setToastMsg('Reaction updated successfully!');
      setTimeout(() => setToastMsg(null), 2000);
    } catch (error) {
      alert(error.message || 'Failed to like project.');
    }
  };

  const displayName = user?.name || 'CreativeVerse User';
  const handleName = user?.username ? `@${user.username}` : '@creativeverse';
  const userHeadline = user?.headline || 'Add a headline in Edit Profile.';
  const userAvatar = user?.avatar || AVATAR;
  const userBanner = user?.banner || BANNER;
  const userLocation = user?.location || '';
  const userBio = user?.bio || '';
  const userWebsite = user?.website || '';
  const dynamicSkills = Array.isArray(user?.skills) ? user.skills : [];
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Recently';

  const getSkillIcon = (name) => {
    const lower = String(name).toLowerCase();
    if (lower.includes('react')) return <CodeSkillIcon color="#00D2FF" size={13} />;
    if (lower.includes('node')) return <CodeSkillIcon color="#68A063" size={13} />;
    if (lower.includes('mongodb') || lower.includes('mongo')) return <DatabaseSkillIcon color="#4DB33D" size={13} />;
    if (lower.includes('blender') || lower.includes('maya') || lower.includes('3d') || lower.includes('model')) return <CubeSkillIcon color="#EA7638" size={13} />;
    if (lower.includes('after') || lower.includes('effects') || lower.includes('ae')) return <AfterEffectsSkillIcon color="#9999FF" size={13} />;
    if (lower.includes('unreal') || lower.includes('unity') || lower.includes('game') || lower.includes('engine')) return <GameSkillIcon color="#34D399" size={13} />;
    if (lower.includes('zbrush') || lower.includes('sculpt')) return <ZBrushSkillIcon color="#FBBF24" size={13} />;

    if (
      lower.includes('postgres') ||
      lower.includes('postgresql') ||
      lower.includes('mysql') ||
      lower.includes('sql') ||
      lower.includes('sqlite') ||
      lower.includes('prisma') ||
      lower.includes('firebase') ||
      lower.includes('supabase') ||
      lower.includes('database')
    ) return <DatabaseSkillIcon color="#10B981" size={13} />;

    if (
      lower.includes('typescript') ||
      lower.includes('python') ||
      lower.includes('java') ||
      lower.includes('c++') ||
      lower.includes('cpp') ||
      lower.includes('c#') ||
      lower.includes('html') ||
      lower.includes('css') ||
      lower.includes('tailwind') ||
      lower.includes('bootstrap') ||
      lower.includes('frontend') ||
      lower.includes('backend') ||
      lower.includes('web')
    ) return <CodeSkillIcon color="#38BDF8" size={13} />;

    if (
      lower.includes('figma') ||
      lower.includes('photoshop') ||
      lower.includes('illustrator') ||
      lower.includes('ui') ||
      lower.includes('ux') ||
      lower.includes('design')
    ) return <BrushSkillIcon color="#EC4899" size={13} />;

    if (
      lower.includes('aws') ||
      lower.includes('azure') ||
      lower.includes('gcp') ||
      lower.includes('cloud') ||
      lower.includes('docker') ||
      lower.includes('kubernetes') ||
      lower.includes('devops')
    ) return <CloudSkillIcon color="#60A5FA" size={13} />;

    return <CodeSkillIcon color="#8F98A8" size={13} />;
  };

  const visibleSkills = dynamicSkills.slice(0, 3).map((skillName) => ({
    name: skillName,
    icon: getSkillIcon(skillName),
  }));
  const remainingSkillsCount = Math.max(dynamicSkills.length - 3, 0);

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.email),
      Boolean(user?.username),
      Boolean(user?.headline),
      Boolean(user?.avatar),
      Array.isArray(user?.skills) && user.skills.length > 0,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [user]);

  const savedItems = useMemo(() => {
    const makeItem = (item, kind) => ({
      ...item,
      kind,
      thumbnail:
        item.previewUrl ||
        item.imageUrl ||
        item.loadingScreenUrl ||
        item.modelUrl ||
        BANNER,
      title: item.title || item.projectTitle || 'Untitled post',
      subtitle:
        kind === 'Project'
          ? item.category || item.type || 'Project'
          : kind === 'Game'
            ? 'Game'
            : '3D Asset',
    });

    const projectItems = contentFeed.projects
      .filter((item) => getEngagement(item).viewerHasSaved)
      .map((item) => makeItem(item, 'Project'));
    const gameItems = contentFeed.games
      .filter((item) => getEngagement(item).viewerHasSaved)
      .map((item) => makeItem(item, 'Game'));
    const assetItems = contentFeed.assets
      .filter((item) => getEngagement(item).viewerHasSaved)
      .map((item) => makeItem(item, '3D Asset'));

    return [...projectItems, ...gameItems, ...assetItems].sort((a, b) => {
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return right - left;
    });
  }, [contentFeed]);

  const likedItems = useMemo(() => {
    const makeItem = (item, kind) => ({
      ...item,
      kind,
      thumbnail:
        item.previewUrl ||
        item.imageUrl ||
        item.loadingScreenUrl ||
        item.modelUrl ||
        BANNER,
      title: item.title || item.projectTitle || 'Untitled post',
      subtitle:
        kind === 'Project'
          ? item.category || item.type || 'Project'
          : kind === 'Game'
            ? 'Game'
            : '3D Asset',
    });

    const projectItems = contentFeed.projects
      .filter((item) => getEngagement(item).viewerHasLiked)
      .map((item) => makeItem(item, 'Project'));
    const gameItems = contentFeed.games
      .filter((item) => getEngagement(item).viewerHasLiked)
      .map((item) => makeItem(item, 'Game'));
    const assetItems = contentFeed.assets
      .filter((item) => getEngagement(item).viewerHasLiked)
      .map((item) => makeItem(item, '3D Asset'));

    return [...projectItems, ...gameItems, ...assetItems].sort((a, b) => {
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return right - left;
    });
  }, [contentFeed]);

  const clearLikedItems = async () => {
    if (!likedItems.length || !window.confirm('Remove all liked items from your profile?')) return;
    try {
      await Promise.all(likedItems.map((item) => {
        const contentType = item.kind === 'Project' ? 'project' : item.kind === 'Game' ? 'game' : 'asset';
        const contentId = item._id || item.id || item.contentId;
        return contentType === 'project'
          ? togglePostLike(token, contentId)
          : updateContentEngagement(token, contentType, contentId, { action: 'react' });
      }));
      setContentFeed((current) => ({
        projects: current.projects.map((item) => ({ ...item, engagement: { ...(item.engagement || {}), viewerHasLiked: false, isLiked: false } })),
        games: current.games.map((item) => ({ ...item, engagement: { ...(item.engagement || {}), viewerHasLiked: false, isLiked: false } })),
        assets: current.assets.map((item) => ({ ...item, engagement: { ...(item.engagement || {}), viewerHasLiked: false, isLiked: false } })),
      }));
    } catch (error) {
      setToastMsg(error.message || 'Unable to remove liked items.');
    }
  };

  const commentedItems = useMemo(() => {
    const makeItem = (item, kind) => ({
      ...item,
      kind,
      thumbnail:
        item.previewUrl ||
        item.imageUrl ||
        item.loadingScreenUrl ||
        item.modelUrl ||
        BANNER,
      title: item.title || item.projectTitle || 'Untitled post',
      subtitle:
        kind === 'Project'
          ? item.category || item.type || 'Project'
          : kind === 'Game'
            ? 'Game'
            : '3D Asset',
    });

    const userHasCommented = (item) => {
      if (!user?.username) return false;
      const comments = getEngagement(item).comments || [];
      const checkComment = (c) => {
        if (String(c.username || '').toLowerCase() === String(user.username).toLowerCase()) {
          return true;
        }
        if (Array.isArray(c.replies)) {
          return c.replies.some(checkComment);
        }
        return false;
      };
      return comments.some(checkComment);
    };

    const projectItems = contentFeed.projects
      .filter(userHasCommented)
      .map((item) => makeItem(item, 'Project'));
    const gameItems = contentFeed.games
      .filter(userHasCommented)
      .map((item) => makeItem(item, 'Game'));
    const assetItems = contentFeed.assets
      .filter(userHasCommented)
      .map((item) => makeItem(item, '3D Asset'));

    return [...projectItems, ...gameItems, ...assetItems].sort((a, b) => {
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return right - left;
    });
  }, [contentFeed, user]);

  const collabItems = collaborationItems;

  const renderGrid = (items, isOwnPortfolio = false, emptyText = 'No items found', emptySubtext = '') => {
    if (isLoadingProjects) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#B8C0CC', fontSize: 13 }}>
          Loading content...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#B8C0CC' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#FFFFFF' }}>{emptyText}</div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', maxWidth: 260, margin: '0 auto 16px', lineHeight: '1.6' }}>
            {emptySubtext}
          </p>
          {isOwnPortfolio && (
            <button
              onClick={() => navigate('/app/upload')}
              className="press-scale"
              style={{
                background: 'linear-gradient(135deg, #FF7A59 0%, #FF522C 100%)',
                border: 'none',
                borderRadius: 100,
                color: '#FFFFFF',
                padding: '10px 22px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 122, 89, 0.25)',
              }}
            >
              Upload First Project
            </button>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map((proj, index) => {
          const projId = proj.id ?? proj._id ?? index;
          const engagement = getEngagement(proj);
          const isLiked = Boolean(engagement.viewerHasLiked);
          const isTall = proj.mode === 'portrait';
          const imageSrc = proj.previewUrl || proj.imageUrl || proj.thumbnail || BANNER;
          const categoryText = proj.category || proj.subtitle || proj.kind || 'Showcase';

          return (
            <div
              key={projId}
              onClick={() => navigate(`/app/project/${projId}`)}
              className="card-hover-lift"
              style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                aspectRatio: isTall ? '0.78' : '1.1',
                cursor: 'pointer',
                background: '#121620',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <img
                src={imageSrc}
                alt={proj.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Action Buttons (Only for own portfolio tab) */}
              {isOwnPortfolio && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    display: 'flex',
                    gap: 6,
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditProject(proj);
                    }}
                    className="press-scale"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    }}
                    title="Edit Project"
                  >
                    <EditIcon size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteProject(proj);
                    }}
                    className="press-scale"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FF6B6B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    }}
                    title="Delete Project"
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
              )}

              {/* Bottom Gradient Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 13, 18, 0.95) 0%, rgba(11, 13, 18, 0.6) 35%, rgba(11, 13, 18, 0) 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Category Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: 100,
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.2px',
                  textTransform: 'uppercase',
                }}
              >
                {categoryText}
              </div>

              {/* Engagement Heart Icon */}
              <div
                onClick={(event) => handleLikeProject(proj, event)}
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isLiked ? '#FF7A59' : '#FFFFFF',
                  cursor: 'pointer',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                <HeartIcon filled={isLiked} size={14} />
                <span>{formatCount(engagement.likesCount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const tabsList = [
    { id: 'Projects', label: 'Projects', icon: (color) => <GridIcon size={18} color={color} /> },
    { id: 'Liked', label: 'Liked', icon: (color) => <HeartIcon size={18} color={color} /> },
    { id: 'Comments', label: 'Comments', icon: (color) => <MessageCircleIcon size={18} color={color} /> },
    { id: 'Collaborations', label: 'Collaborate', icon: (color) => <UsersIcon size={18} color={color} /> },
    { id: 'Saved', label: 'Saved', icon: (color) => <BookmarkIcon size={18} color={color} /> },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#0B0D12',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes avatarGlow {
          0% { box-shadow: 0 0 15px rgba(255, 122, 89, 0.15); }
          50% { box-shadow: 0 0 28px rgba(255, 122, 89, 0.45); }
          100% { box-shadow: 0 0 15px rgba(255, 122, 89, 0.15); }
        }
        .premium-avatar-glow {
          animation: avatarGlow 5s ease-in-out infinite;
        }
        .press-scale {
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease;
        }
        .press-scale:active {
          transform: scale(0.96) !important;
          opacity: 0.9;
        }
        .card-hover-lift {
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease;
        }
        .card-hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.45);
        }
        .tab-transition {
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: (showLogoutConfirm || deletingProject || isEditing || editingProject) ? 'hidden' : 'auto',
          paddingBottom: 110,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isGuest && <GuestBanner onSignIn={() => navigate('/signin')} />}

        {/* ─── Cover Image ──────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: 250, flexShrink: 0 }}>
          <img
            src={userBanner}
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
              onClick={() => navigate('/app/home')}
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
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setToastMsg('Profile link copied!');
                  setTimeout(() => setToastMsg(null), 3000);
                }}
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
                onClick={() => setShowLogoutConfirm(true)}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
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
                src={userAvatar}
                alt={displayName}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3.5px solid #FF7A5C',
                  boxShadow: '0 0 20px rgba(255, 122, 92, 0.35)'
                }}
              />
            </div>

            {/* Action Buttons: Edit Profile */}
            <div style={{ display: 'flex', gap: 10, paddingBottom: 6 }}>
              <button
                onClick={handleOpenEdit}
                style={{
                  width: 110,
                  height: 38,
                  borderRadius: 100,
                  background: '#FFFFFF',
                  border: 'none',
                  color: '#090909',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <EditIcon size={13} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Identity Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{displayName}</span>
            {user && user.isVerified && <VerifiedIcon />}
          </div>
          <div style={{ fontSize: 13, color: '#FF7A5C', fontWeight: 600, marginBottom: 6 }}>{handleName}</div>
          <div style={{ fontSize: 13, color: '#A1A1AA', fontWeight: 500, marginBottom: 4 }}>
            {user?.creatorType || 'Game Developer'}{user?.headline ? ` · ${user.headline}` : ''}
          </div>
          {userLocation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#71717A', fontWeight: 500, marginBottom: 14 }}>
              <span>📍</span> {userLocation}
            </div>
          )}

          {/* Bio */}
          {userBio && (
            <p style={{
              fontSize: 13,
              color: '#E4E4E7',
              lineHeight: 1.5,
              margin: '0 0 16px',
              whiteSpace: 'pre-line',
              textAlign: 'left'
            }}>
              {userBio}
            </p>
          )}

          {/* Links row */}
          {(userWebsite || user?.github || user?.itchio || user?.behance || user?.artstation || user?.instagram || user?.linkedin) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {userWebsite && (
                <a
                  href={userWebsite.startsWith('http') ? userWebsite : `https://${userWebsite}`}
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
                  <span>🔗</span> {userWebsite.replace(/(^\w+:|^)\/\//, '')}
                </a>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'github', label: <FaGithub size={16} />, color: '#FFF', url: user?.github },
                  { key: 'itchio', label: <SiItchdotio size={16} />, color: '#FA5C5C', url: user?.itchio },
                  { key: 'behance', label: <FaBehance size={16} />, color: '#0057ff', url: user?.behance },
                  { key: 'artstation', label: <FaArtstation size={16} />, color: '#13AFF0', url: user?.artstation },
                  { key: 'instagram', label: <FaInstagram size={16} />, color: '#E1306C', url: user?.instagram },
                  { key: 'linkedin', label: <FaLinkedin size={16} />, color: '#0A66C2', url: user?.linkedin }
                ].filter(social => social.url).map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url.startsWith('http') ? social.url : `https://${social.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      color: social.color,
                      fontSize: 12
                    }}
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Skill Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {visibleSkills.map((skill, idx) => (
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
                {skill.icon}
                <span>{skill.name}</span>
              </div>
            ))}
            {remainingSkillsCount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 600,
                color: '#FF7A59'
              }}>
                +{remainingSkillsCount}
              </div>
            )}
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
              { value: userProjects.length, label: 'Projects' },
              { value: '1.2M', label: 'Followers' },
              { value: '340', label: 'Following' },
              { value: '12.4M', label: 'Views' }
            ].map((stat, idx) => (
              <div key={idx} style={{
                borderRight: idx < 3 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FF7A5C', marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#71717A', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '0 10px',
            background: 'rgba(11, 13, 18, 0.5)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
          }}
        >
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

        <div style={{ padding: '16px 12px 100px' }}>
          {activeTab === 'Projects' &&
            renderGrid(userProjects, true, 'No projects published yet', 'Upload your WebGL builds, 3D files, or 2D artwork and showcase them on your profile.')}
          
          {activeTab === 'Liked' && <>
            {likedItems.length > 0 && <button type="button" onClick={clearLikedItems} style={{ margin: '0 0 12px auto', display: 'block', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,122,89,.45)', background: 'transparent', color: '#FF9A7A', cursor: 'pointer' }}>Clear liked items</button>}
            {renderGrid(likedItems, false, 'No liked showcases yet', 'Projects you react to will be displayed here.')}
          </>}
          
          {activeTab === 'Comments' &&
            renderGrid(commentedItems, false, 'No commented showcases yet', 'Projects you leave responses on will appear here.')}
          
          {activeTab === 'Collaborations' &&
            renderGrid(collabItems, false, 'No collaborative showcases yet', 'Projects where you are tagged as a collaborator will show up here.')}
          
          {activeTab === 'Saved' &&
            renderGrid(savedItems, false, 'No saved showcases yet', 'Showcases you bookmark will appear here.')}
        </div>
      </div>

      {toast && (
        <GuestToast
          message={`Sign in to ${toast.action} on CreativeVerse.`}
          onSignIn={() => {
            setToast(null);
            navigate('/signin');
          }}
          onDismiss={() => setToast(null)}
        />
      )}

      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            bottom: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            animation: 'toastSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            whiteSpace: 'nowrap',
          }}
        >
          <style>{`
            @keyframes toastSlideUp {
              from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.92); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
            }
          `}</style>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 18px 11px 12px',
              borderRadius: 100,
              background: 'rgba(18, 22, 32, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset',
            }}
          >
            {/* Check circle */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(52, 211, 153, 0.4)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Text */}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#F1F5F9',
                letterSpacing: 0.1,
              }}
            >
              {toastMsg}
            </span>
          </div>
        </div>
      )}

      {isEditing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11, 13, 18, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Edit Profile</h2>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              X
            </button>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <img
                  src={editAvatar || AVATAR}
                  alt="Avatar Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #FF7A59',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <label
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#FFF',
                  }}
                >
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageChange(event, setEditAvatar)}
                    style={{ display: 'none' }}
                  />
                </label>

                {editAvatar && (
                  <button
                    type="button"
                    onClick={() => setEditAvatar('')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      background: 'rgba(255, 74, 74, 0.1)',
                      border: '1px solid rgba(255, 74, 74, 0.2)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#FF4A4A',
                      cursor: 'pointer',
                    }}
                  >
                    Delete Photo
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  width: '100%',
                  height: 84,
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(15, 23, 42, 0.72)',
                }}
              >
                <img
                  src={editBanner || BANNER}
                  alt="Banner Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <label
                style={{
                  padding: '6px 14px',
                  borderRadius: 100,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#FFF',
                  alignSelf: 'center',
                }}
              >
                Upload Banner
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageChange(event, setEditBanner)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Email</label>
              <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} required style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Username</label>
              <input type="text" value={editUsername} onChange={(event) => setEditUsername(event.target.value)} required style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Full Name</label>
              <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)} required style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Professional Headline</label>
              <input type="text" value={editHeadline} onChange={(event) => setEditHeadline(event.target.value)} placeholder="Gameplay Programmer · 3D Artist" style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Location</label>
              <input type="text" value={editLocation} onChange={(event) => setEditLocation(event.target.value)} placeholder="e.g., Tokyo, Japan" style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Bio</label>
              <textarea
                value={editBio}
                onChange={(event) => setEditBio(event.target.value)}
                placeholder="Tell us about yourself..."
                style={{
                  ...fieldStyle,
                  height: 80,
                  padding: '12px 14px',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Creator Category</label>
              <select value={editCreatorType} onChange={(event) => setEditCreatorType(event.target.value)} style={fieldStyle}>
                <option value="Web Developer">Web Developer</option>
                <option value="Game Developer">Game Developer</option>
                <option value="2D Artist">2D Artist</option>
                <option value="3D Artist">3D Artist</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Personal Website</label>
              <input type="text" value={editWebsite} onChange={(event) => setEditWebsite(event.target.value)} placeholder="e.g., zara-neon.com" style={fieldStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>GitHub Link</label>
                <input type="text" value={editGithub} onChange={(event) => setEditGithub(event.target.value)} placeholder="github.com/username" style={fieldStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Itch.io Link</label>
                <input type="text" value={editItchio} onChange={(event) => setEditItchio(event.target.value)} placeholder="username.itch.io" style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Behance Link</label>
                <input type="text" value={editBehance} onChange={(event) => setEditBehance(event.target.value)} placeholder="behance.net/username" style={fieldStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>ArtStation Link</label>
                <input type="text" value={editArtstation} onChange={(event) => setEditArtstation(event.target.value)} placeholder="artstation.com/username" style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Instagram Link</label>
                <input type="text" value={editInstagram} onChange={(event) => setEditInstagram(event.target.value)} placeholder="instagram.com/username" style={fieldStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>LinkedIn Link</label>
                <input type="text" value={editLinkedin} onChange={(event) => setEditLinkedin(event.target.value)} placeholder="linkedin.com/in/username" style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Skills (comma-separated)</label>
              <input type="text" value={editSkills} onChange={(event) => setEditSkills(event.target.value)} placeholder="Unity, C#, Blender" style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 1.5,
                  height: 48,
                  borderRadius: 12,
                  background: '#FF7A59',
                  border: 'none',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingProject && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11, 13, 18, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Edit Project</h2>
            <button
              onClick={() => setEditingProject(null)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              X
            </button>
          </div>

          <form onSubmit={handleSaveProjectEdit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Title</label>
              <input type="text" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} required style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Category</label>
              <input type="text" value={projCategory} onChange={(e) => setProjCategory(e.target.value)} placeholder="e.g., Casual, Action, Sci-Fi" style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Description</label>
              <textarea
                value={projDescription}
                onChange={(e) => setProjDescription(e.target.value)}
                style={{
                  ...fieldStyle,
                  height: 100,
                  padding: '12px 14px',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Type</label>
                <select value={projType} onChange={(e) => setProjType(e.target.value)} style={fieldStyle}>
                  <option value="game">Game (HTML/WebGL)</option>
                  <option value="3d">3D Model (GLB/GLTF)</option>
                  <option value="2d">2D Image/Artwork</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Aspect Ratio</label>
                <select value={projMode} onChange={(e) => setProjMode(e.target.value)} style={fieldStyle}>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Visibility</label>
              <select value={projVisibility} onChange={(e) => setProjVisibility(e.target.value)} style={fieldStyle}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Tags (comma-separated)</label>
              <input type="text" value={projTags} onChange={(e) => setProjTags(e.target.value)} placeholder="e.g., retro, physics, unity" style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Software Used (comma-separated)</label>
              <input type="text" value={projSoftware} onChange={(e) => setProjSoftware(e.target.value)} placeholder="e.g., Blender, Unity, Photoshop" style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#B8C0CC', textTransform: 'uppercase' }}>Preview Image</label>
              {previewUrlToDisplay && (
                <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={previewUrlToDisplay} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 48,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px dashed rgba(255,255,255,0.2)',
                color: '#FFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {previewUrlToDisplay ? 'Change Preview Image' : 'Upload Preview Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewPreviewFile(file);
                      setPreviewUrlToDisplay(URL.createObjectURL(file));
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProj}
                style={{
                  flex: 1.5,
                  height: 48,
                  borderRadius: 12,
                  background: '#FF7A59',
                  border: 'none',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: isSavingProj ? 0.7 : 1,
                }}
              >
                {isSavingProj ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingProject && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11, 13, 18, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              background: '#121620',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '24px 20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255, 74, 74, 0.1)',
                border: '1px solid rgba(255, 74, 74, 0.2)',
                color: '#FF4A4A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrashIcon size={24} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Delete Project?</h3>
              <p style={{ fontSize: 13, color: '#B8C0CC', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{deletingProject.title}</strong>? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', width: '100%', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setDeletingProject(null)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProjectConfirm}
                disabled={isDeletingProj}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  background: '#FF4A4A',
                  border: 'none',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: isDeletingProj ? 0.7 : 1,
                }}
              >
                {isDeletingProj ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11, 13, 18, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              background: '#121620',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '24px 20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255, 122, 89, 0.1)',
                border: '1px solid rgba(255, 122, 89, 0.2)',
                color: '#FF7A59',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogoutIcon size={24} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Log Out</h3>
              <p style={{ fontSize: 13, color: '#B8C0CC', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to log out of your account?
              </p>
            </div>

            <div style={{ display: 'flex', width: '100%', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate('/signin');
                }}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  background: '#FF7A59',
                  border: 'none',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
