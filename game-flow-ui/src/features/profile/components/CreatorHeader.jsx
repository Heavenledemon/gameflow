import { Avatar, Chip } from '../../../components/ui/Surface'
import { IconButton } from '../../../components/ui/Button'
import { ChevronLeftIcon, DotsIcon, ShareIcon2, VerifiedIcon } from '../../../components/icons/Icons'
import CreatorStats from './CreatorStats'
import { safeExternalUrl } from '../profileAdapters'

export default function CreatorHeader({ creator, stats, actions, onBack, onShare, onMore, moreLabel = 'More options' }) {
  const website = safeExternalUrl(creator.website)
  const socialLinks = (creator.socialLinks || []).map((link) => ({ ...link, href: safeExternalUrl(link.url) })).filter((link) => link.href)
  const credibility = [...new Set([...(creator.skills || []), ...(creator.tools || []), ...(creator.platforms || [])].filter(Boolean).map(String))]
  return <>
    <div className="creator-cover" aria-hidden="true">{creator.banner ? <img src={creator.banner} alt="" /> : null}</div>
    <section className="creator-header" aria-labelledby="creator-name">
      <div className="creator-header__toolbar">
        <IconButton label="Go back" variant="soft" onClick={onBack}><ChevronLeftIcon size={20} /></IconButton>
        <div>
          <IconButton label="Share profile" variant="soft" onClick={onShare}><ShareIcon2 size={18} /></IconButton>
          {onMore ? <IconButton label={moreLabel} variant="soft" onClick={onMore}><DotsIcon size={20} /></IconButton> : null}
        </div>
      </div>
      <div className="creator-header__primary">
        <Avatar src={creator.avatar} alt="" name={creator.name || creator.username || 'Creator'} size="large" className="creator-header__avatar" />
        <div className="creator-header__identity">
          <h1 id="creator-name">{creator.name || creator.username || 'Creator'} {creator.verified ? <VerifiedIcon size={16} /> : null}</h1>
          {creator.username ? <p className="creator-header__handle">@{creator.username}</p> : null}
          {[creator.role, creator.headline].filter(Boolean).length ? <p className="creator-header__role">{[creator.role, creator.headline].filter(Boolean).join(' · ')}</p> : null}
        </div>
        {actions}
      </div>
      {creator.location ? <p className="creator-header__location">{creator.location}</p> : null}
      {creator.bio ? <p className="creator-header__bio">{creator.bio}</p> : null}
      {(website || socialLinks.length) ? <div className="creator-header__links">{website ? <a href={website} target="_blank" rel="noopener noreferrer">{creator.website}</a> : null}{socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>{link.label}</a>)}</div> : null}
      <CreatorStats stats={stats} />
      {(credibility.length || creator.collaborationOpen === true) ? <div className="creator-credibility" aria-label="Creator skills and availability">{credibility.map((item) => <Chip key={item}>{item}</Chip>)}{creator.collaborationOpen === true ? <Chip className="creator-credibility__available">Open to collaboration</Chip> : null}</div> : null}
    </section>
  </>
}
