import { useEffect, useRef, useState } from 'react'
import Avatar from '../../../components/ui/Avatar'
import Chip from '../../../components/ui/Chip'
import IconButton from '../../../components/ui/IconButton'
import {
  ChevronLeftIcon,
  DotsIcon,
  ShareIcon2,
  LinkIcon,
  GithubIcon,
  LinkedinIcon,
  InstagramIcon,
  BehanceIcon,
  ItchIcon
} from '../../../components/icons/Icons'
import CreatorStats from './CreatorStats'
import { safeExternalUrl } from '../profileAdapters'
import ProfileCompanion from './ProfileCompanion'
import AbstractProfileDesign from './AbstractProfileDesign'

const SOCIAL_ICONS = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  instagram: InstagramIcon,
  behance: BehanceIcon,
  'itch.io': ItchIcon,
}

export default function CreatorHeader({
  creator,
  stats,
  actions,
  capability = 'public',
  onBack,
  onShare,
  onMore,
  moreLabel = 'More options',
  hasActiveStory = false,
  storyViewed = false,
  onStoryOpen,
  onStatSelect,
}) {
  const [bioExpanded, setBioExpanded] = useState(false)
  const [animateSocialBorders, setAnimateSocialBorders] = useState(false)
  const animatedProfiles = useRef(new Set())
  const website = safeExternalUrl(creator.website)
  const socialLinks = (creator.socialLinks || [])
    .map((link) => ({ ...link, href: safeExternalUrl(link.url) }))
    .filter((link) => link.href)

  const credibility = [...new Set((creator.skills || []).filter(Boolean).map(String))].slice(0, 3)

  const avatarSize = capability === 'self' ? '2xl' : 'xl'
  const isAvailableForCollab = creator.collaborationOpen === true || creator.openToCollaboration === true

  useEffect(() => {
    if (!socialLinks.length) return

    const profileIdentity = creator.id || creator.username
    if (!profileIdentity || animatedProfiles.current.has(profileIdentity)) return
    animatedProfiles.current.add(profileIdentity)

    const startTimer = window.setTimeout(() => setAnimateSocialBorders(true), 0)
    const endTimer = window.setTimeout(() => setAnimateSocialBorders(false), 1900)
    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(endTimer)
    }
  }, [creator.id, creator.username, socialLinks.length])

  return (
    <div className="creator-header-container">
      {/* Top Bar Navigation (Overlaying the cover image) */}
      <div className="creator-header__topbar creator-header__topbar--overlay">
        <div className="creator-header__topbar-left">
          {onBack ? (
            <IconButton label="Go back" variant="light" onClick={onBack}>
              <ChevronLeftIcon size={20} />
            </IconButton>
          ) : null}
        </div>

        <div className="creator-header__topbar-actions">
          <IconButton label="Share profile" variant="light" onClick={onShare}>
            <ShareIcon2 size={18} />
          </IconButton>
          {onMore ? (
            <IconButton label={moreLabel} variant="light" onClick={onMore}>
              <DotsIcon size={20} />
            </IconButton>
          ) : null}
        </div>
      </div>

      {creator.banner ? (
        <div className="creator-cover" aria-hidden="true">
          <img src={creator.banner} alt="" />
        </div>
      ) : (
        <div className="creator-cover creator-cover--placeholder" aria-hidden="true" />
      )}

      <section className="creator-header" aria-labelledby="creator-name">
        {/* Instagram Profile Top Row: Avatar on Left, Stats on Right */}
        <div className="creator-header__main-row">
          <button
            type="button"
            className={`creator-header__avatar-wrapper${hasActiveStory ? ` creator-header__avatar-wrapper--story${storyViewed ? ' creator-header__avatar-wrapper--story-viewed' : ''}` : ''}`}
            onClick={onStoryOpen}
            disabled={!onStoryOpen}
            aria-label={hasActiveStory ? `View ${creator.name || creator.username || 'creator'}'s story` : undefined}
          >
            <Avatar
              src={creator.avatar}
              alt={creator.name || creator.username || 'Creator'}
              name={creator.name || creator.username || 'Creator'}
              size={avatarSize}
              className="creator-header__avatar"
            />
          </button>

          <div className="creator-header__stats-wrapper">
            <CreatorStats stats={stats} onSelect={onStatSelect} />
          </div>
        </div>

        {/* Creator Bio & Info Section */}
        <div className={`creator-header__info${creator.profileDisplayType === 'none' ? ' creator-header__info--no-display' : ''}`}>
          {creator.profileDisplayType !== 'none' ? <div className={`creator-header__companion-slot${creator.profileDisplayType === 'design' ? ' creator-header__companion-slot--design' : ''}`}>
            {creator.profileDisplayType === 'design' ? (
              <AbstractProfileDesign key={`${creator.profileDesignType}-${creator.profileDesignPalette}-${creator.companionBubble}-${creator.companionBubbleText}`} type={creator.profileDesignType} palette={creator.profileDesignPalette} density={creator.profileDesignDensity} lineStyle={creator.profileDesignLineStyle} motion={creator.profileDesignMotion} interaction={creator.profileDesignInteraction} doodleTheme={creator.profileDesignDoodleTheme} status={creator.companionBubble} statusText={creator.companionBubbleText} statusBehavior={creator.companionBubbleBehavior}/>
            ) : (
              <ProfileCompanion key={`${creator.companionType}-${creator.companionBubble}-${creator.companionBubbleText}-${creator.companionBubbleBehavior}`} type={creator.companionType} motion={creator.companionMotion} emotion={creator.companionEmotion} bubble={creator.companionBubble} bubbleText={creator.companionBubbleText} bubbleBehavior={creator.companionBubbleBehavior}/>
            )}
          </div> : null}
          {creator.username ? (
            <p className="creator-header__username-text">
              @{creator.username}
            </p>
          ) : null}

          {creator.name ? (
            <h2 id="creator-name" className="creator-header__display-name">
              {creator.name}
            </h2>
          ) : null}

          {[creator.role, creator.headline, creator.location].filter(Boolean).length ? (
            <p className="creator-header__subline">
              {[creator.role, creator.headline, creator.location].filter(Boolean).join(' · ')}
            </p>
          ) : null}

          {creator.bio ? (
            <div className="creator-header__bio-wrap">
              <p className={`creator-header__bio ${bioExpanded ? 'creator-header__bio--expanded' : ''}`}>
                {creator.bio}
              </p>
              {creator.bio.length > 80 ? (
                <button
                  type="button"
                  className="creator-header__bio-toggle"
                  aria-expanded={bioExpanded}
                  onClick={() => setBioExpanded((value) => !value)}
                >
                  {bioExpanded ? 'less' : 'more'}
                </button>
              ) : null}
            </div>
          ) : null}

          {creator.description ? (
            <div className="creator-header__description-wrap">
              <p className="creator-header__description">{creator.description}</p>
            </div>
          ) : null}

          {/* Website Link (First Line) */}
          {website ? (
            <div className="creator-header__website-row">
              <a href={website} target="_blank" rel="noopener noreferrer" className="creator-link-pill">
                <LinkIcon size={14} />
                <span>{creator.website.replace(/^https?:\/\//, '')}</span>
              </a>
            </div>
          ) : null}

          {/* Social Portfolio Links (Second Line - Icon Only) */}
          {socialLinks.length ? (
            <div className="creator-header__social-icons-row">
              {socialLinks.map((link, index) => {
                const IconComponent = SOCIAL_ICONS[String(link.label).toLowerCase()] || LinkIcon
                return (
                  <a
                    key={link.label || link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="creator-social-icon-btn"
                    title={link.label}
                    style={{ '--social-icon-index': index }}
                  >
                    <IconComponent size={20} />
                    {animateSocialBorders ? (
                      <svg className="creator-social-icon-btn__border" viewBox="0 0 36 36" aria-hidden="true">
                        <circle cx="18" cy="18" r="16" />
                      </svg>
                    ) : null}
                  </a>
                )
              })}
            </div>
          ) : null}

          {/* Skills & Badges */}
          {credibility.length || isAvailableForCollab ? (
            <div className="creator-credibility" aria-label="Creator skills and availability">
              {isAvailableForCollab ? (
                <Chip active className="creator-credibility__available">
                  Open to collab
                </Chip>
              ) : null}
              {credibility.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          ) : null}
        </div>

        {/* Action Buttons Row (Edit Profile / Follow / Message) */}
        <div className="creator-header__actions-row">
          {actions}
        </div>
      </section>
    </div>
  )
}
