import { useEffect, useRef, useState } from 'react'

export function useMediaVisibility({ threshold = 0.6 } = {}) {
  const ref = useRef(null)
  const intersectionVisibleRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const updateVisibility = () => setIsVisible(intersectionVisibleRef.current && !document.hidden)
    const node = ref.current
    document.addEventListener('visibilitychange', updateVisibility)

    if (!node || !('IntersectionObserver' in window)) {
      intersectionVisibleRef.current = true
      updateVisibility()
      return () => document.removeEventListener('visibilitychange', updateVisibility)
    }

    const observer = new IntersectionObserver(([entry]) => {
      intersectionVisibleRef.current = entry.isIntersecting
      updateVisibility()
    }, { threshold })
    observer.observe(node)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [threshold])
  return { ref, isVisible }
}
