import './MobileAppShell.css'

export default function MobileAppShell({
  children,
  topBar = null,
  bottomNavigation = null,
  showBottomNavigation = true,
  immersive = false,
}) {
  const className = `mobile-app-shell${immersive ? ' mobile-app-shell--immersive' : ''}`

  return (
    <div className={className}>
      {topBar ? (
        <header className="mobile-app-shell__top-bar">
          {topBar}
        </header>
      ) : null}

      <div className="mobile-app-shell__content">
        {children}
      </div>

      {showBottomNavigation && bottomNavigation ? (
        <div className="mobile-app-shell__bottom-navigation">
          {bottomNavigation}
        </div>
      ) : null}
    </div>
  )
}
