import { useEffect, useRef, useState } from 'react'

export function useMediaVisibility({ threshold = 0.6 } = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) { setIsVisible(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, isVisible }
}

