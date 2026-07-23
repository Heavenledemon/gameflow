import './TopBar.css'

/**
 * TopBar — Design Guide §7.2
 *
 * Provides a three-slot layout: left | center | right.
 * Pages use the AppShellContext `setTopBar` hook to populate slots:
 *
 *   const { setTopBar } = useAppShell()
 *   useEffect(() => {
 *     setTopBar(
 *       <TopBar
 *         left={<IconButton label="Back" onClick={handleBack}><ChevronLeftIcon /></IconButton>}
 *         center={<span className="top-bar__title">{project.title}</span>}
 *         right={<IconButton label="Options"><OverflowIcon /></IconButton>}
 *       />
 *     )
 *   }, [setTopBar, project.title])
 *
 * Do not redesign individual page headers here.
 * This component is the structural slot container only.
 */
const TopBar = ({ left = null, center = null, right = null, className = '' }) => {
  return (
    <div className={`top-bar${className ? ` ${className}` : ''}`} role="banner">
      <div className="top-bar__slot top-bar__slot--left">
        {left}
      </div>
      <div className="top-bar__slot top-bar__slot--center">
        {center}
      </div>
      <div className="top-bar__slot top-bar__slot--right">
        {right}
      </div>
    </div>
  )
}

export default TopBar
