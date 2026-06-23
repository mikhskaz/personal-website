import { useEffect, useRef, useState } from 'react'

// Tracks which scroll "step" is currently crossing the centre of the viewport.
// Returns the active index and a ref-setter to attach to each step element.
export function useScrollSteps(count) {
  const [active, setActive] = useState(0)
  const refs = useRef([])
  const setRef = (i) => (el) => {
    refs.current[i] = el
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = refs.current.indexOf(entry.target)
            if (i >= 0) setActive(i)
          }
        })
      },
      // A thin band across the viewport centre: the step in that band wins.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    refs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [count])

  return { active, setRef }
}
