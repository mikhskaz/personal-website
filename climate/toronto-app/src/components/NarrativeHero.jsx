import ChoroplethMap from './ChoroplethMap'

export default function NarrativeHero({ geo, meta, scale, onStart, entered = true }) {
  const colorFn = (properties) => scale.color(properties.crisis_per1k)
  const minutesPerCall = Math.round((24 * 60) / meta.per_day)

  return (
    <header className={`narrative-hero${entered ? ' is-entered' : ''}`} id="story-top">
      <div className="narrative-hero-map" aria-hidden="true">
        <ChoroplethMap geo={geo} colorFn={colorFn} dim />
      </div>
      <div className="narrative-hero-shade" aria-hidden="true" />
      <div className="narrative-hero-canopy" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="narrative-hero-content">
        <p className="story-edition">A data-driven Toronto story</p>
        <h1>
          Crisis
          <span>&amp; Canopy</span>
        </h1>
        <p className="narrative-hero-deck">
          One police-attended mental-health crisis call about every{' '}
          <strong>{minutesPerCall} minutes</strong>. The map asks a harder question: why do some
          neighbourhoods carry more recorded call demand, and what can trees actually change?
        </p>

        <div className="narrative-hero-question">
          <span>The question at the centre</span>
          <p>Is the pattern really about trees, or is it mostly about income?</p>
        </div>

        <button className="story-start" type="button" onClick={onStart}>
          Enter the story
          <span aria-hidden="true">↓</span>
        </button>
      </div>

      <div className="story-scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </header>
  )
}
