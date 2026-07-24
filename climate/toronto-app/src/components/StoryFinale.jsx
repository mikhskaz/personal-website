const ACTIONS = [
  {
    verb: 'Protect.',
    title: 'Keep what already works.',
    body:
      'Protect existing parks and mature trees. Their shade, cooling, habitat, and public access take years to replace.',
  },
  {
    verb: 'Prioritize.',
    title: 'Put investment where pressures overlap.',
    body:
      'Grow and maintain canopy in low-income, low-canopy neighbourhoods, with residents guiding access, safety, and use.',
  },
  {
    verb: 'Pair.',
    title: 'Never ask greening to stand alone.',
    body:
      'Combine it with income and housing supports, community mental-health care, crisis services, and anti-displacement protections.',
  },
]

export default function StoryFinale({ onExplore }) {
  return (
    <section className="story-finale" id="action">
      <div className="story-finale-shadow" aria-hidden="true" />
      <div className="story-finale-inner">
        <span className="story-finale-kicker">08 · The call to action</span>
        <h2>Protect. Prioritize. Pair.</h2>
        <p className="story-finale-lede">
          Toronto can act on green space without pretending it is the single answer to crisis.
          Protect it, expand it where need is greatest, and invest in social supports at the same
          time.
        </p>

        <div className="story-action-grid">
          {ACTIONS.map((action, index) => (
            <article key={action.verb}>
              <span>Action {index + 1}</span>
              <strong>{action.verb}</strong>
              <h3>{action.title}</h3>
              <p>{action.body}</p>
            </article>
          ))}
        </div>

        <div className="story-final-statement">
          <p>
            Measure tree survival, access, quality, heat, and health over time. A cross-sectional
            correlation is a place to begin asking better questions, not the result by which action
            should be judged.
          </p>
          <button type="button" onClick={onExplore}>
            Explore the evidence and your neighbourhood
            <span aria-hidden="true">↓</span>
          </button>
        </div>
      </div>
    </section>
  )
}
