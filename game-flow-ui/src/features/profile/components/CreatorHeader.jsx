import { useState } from 'react'
import Avatar from '../../../components/ui/Avatar'
import Chip from '../../../components/ui/Chip'
import IconButton from '../../../components/ui/IconButton'
import { ChevronLeftIcon, DotsIcon, ShareIcon2, VerifiedIcon } from '../../../components/icons/Icons'
import CreatorStats from './CreatorStats'
import { safeExternalUrl } from '../profileAdapters'

export default function CreatorHeader({
  creator,
  stats,
  actions,
  capability = 'public',
  onBack,
  onShare,
  onMore,
  moreLabel = 'More options',
}) {
  const [bioExpanded, setBioExpanded] = useState(false)
  const website = safeExternalUrl(creator.website)
  const socialLinks = (creator.socialLinks || [])
    .map((link) => ({ ...link, href: safeExternalUrl(link.url) }))
    .filter((link) => link.href)

  const credibility = [
    ...new Set(
      [...(creator.skills || []), ...(creator.tools || []), ...(creator.platforms || [])]
        .filter(Boolean)
        .map(String)
    ),
  ]

  const avatarSize = capability === 'self' ? '2xl' : 'xl'
  const isAvailableForCollab = creator.collaborationOpen === true || creator.openToCollaboration === true

  return (
    <>
      {creator.banner ? (
        <div className="creator-cover" aria-hidden="true">
          <img src={creator.banner} alt="" />
        </div>
      ) : null}

      <section className="creator-header" aria-labelledby="creator-name">
        <div className="creator-header__toolbar">
          <IconButton label="Go back" variant="light" onClick={onBack}>
            <ChevronLeftIcon size={20} />
          </IconButton>

          <div className="creator-header__toolbar-actions">
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

        {/* Creator Identity Row */}
        <div className="creator-header__primary">
          <Avatar
            src={creator.avatar}
            alt={creator.name || creator.username || 'Creator'}
            name={creator.name || creator.username || 'Creator'}
            size={avatarSize}
            className="creator-header__avatar"
          />

          <div className="creator-header__identity">
            <h1 id="creator-name" className="creator-header__name">
              {creator.name || creator.username || 'Creator'}{' '}
              {creator.verified ? <VerifiedIcon size={16} /> : null}
            </h1>
            {creator.username ? (
              <p className="creator-header__handle">@{creator.username}</p>
            ) : null}
            {[creator.role, creator.headline].filter(Boolean).length ? (
              <p className="creator-header__role">
                {[creator.role, creator.headline].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>

          {actions}
        </div>

        {creator.location ? (
          <p className="creator-header__location">{creator.location}</p>
        ) : null}

        {creator.bio ? (
          <div className="creator-header__bio-wrap">
            <p className={`creator-header__bio ${bioExpanded ? 'creator-header__bio--expanded' : ''}`}>
              {creator.bio}
            </p>
            {creator.bio.length > 90 ? (
              <button
                type="button"
                className="creator-header__bio-toggle"
                aria-expanded={bioExpanded}
                onClick={() => setBioExpanded((value) => !value)}
              >
                {bioExpanded ? 'Show less' : 'More'}
              </button>
            ) : null}
          </div>
        ) : null}

        {website || socialLinks.length ? (
          <div className="creator-header__links">
            {website ? (
              <a href={website} target="_blank" rel="noopener noreferrer">
                {creator.website}
              </a>
            ) : null}
            {socialLinks.map((link) => (
              <a
                key={link.label || link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}

        {/* Creator Stats */}
        <CreatorStats stats={stats} />

        {/* Credibility & Skills Row */}
        {credibility.length || isAvailableForCollab ? (
          <div className="creator-credibility" aria-label="Creator skills and availability">
            {credibility.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
            {isAvailableForCollab ? (
              <Chip active className="creator-credibility__available">
                Open to collaboration
              </Chip>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}
