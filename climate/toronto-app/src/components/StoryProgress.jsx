import { useEffect, useState } from 'react'

const CHAPTERS = [
  { id: 'story-top', label: 'Opening' },
  { id: 'measure', label: 'The call' },
  { id: 'patterns', label: 'The map' },
  { id: 'evidence', label: 'The research' },
  { id: 'action', label: 'The action' },
]

export default function StoryProgress({ visible }) {
  const [active, setActive] = useState(CHAPTERS[0].id)

  useEffect(() => {
    const elements = CHAPTERS
      .map((chapter) => document.getElementById(chapter.id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      className={`story-progress${visible ? ' is-visible' : ''}`}
      aria-label="Story chapters"
    >
      <span className="story-progress-label">Story</span>
      <ol>
        {CHAPTERS.map((chapter, index) => (
          <li key={chapter.id} className={active === chapter.id ? 'is-active' : ''}>
            <a href={`#${chapter.id}`} aria-label={`${index + 1}. ${chapter.label}`}>
              <i />
              <span>{chapter.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
