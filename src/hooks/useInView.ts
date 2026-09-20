import { RefObject, useEffect, useState } from 'react'

export function useInView(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting && entry.intersectionRatio > 0.22), { threshold: [0, .22, .5] })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return active
}
