import { useRef } from 'react'
import ChoroplethMap from './ChoroplethMap'

const TYPE_COLORS = {
  'Person in Crisis': '#c9922e',
  'Suicide-related': '#7e8b86',
  Overdose: '#ff3d22',
}

export default function Hero({ geo, meta, scale, onStart }) {
  const ref = useRef(null)
  const colorFn = (p) => scale.color(p.crisis_per1k)
  const typeMax = Math.max(...Object.values(meta.type_split))

  return (
    <header className="hero" ref={ref}>
      <div className="hero-map" aria-hidden="true">
        <ChoroplethMap geo={geo} colorFn={colorFn} dim />
        <div className="hero-map-fade" />
      </div>

      <div className="hero-content">
        <p className="kicker">Case file · Toronto · {meta.period}</p>
        <h1 className="hero-title">
          Crisis <span className="amp">&amp;</span> Canopy
        </h1>
        <p className="hero-sub">
          Where — and when — do mental-health crises concentrate across Toronto, and how do they
          line up with summer heat and the missing tree canopy?
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-big">{meta.crisis_total.toLocaleString()}</span>
            <span className="hero-cap">crisis calls in a decade</span>
          </div>
          <div className="hero-stat">
            <span className="hero-big">≈{meta.per_day}</span>
            <span className="hero-cap">every single day</span>
          </div>
        </div>

        <div className="hero-types">
          {Object.entries(meta.type_split).map(([t, v]) => (
            <div className="hero-type" key={t}>
              <div className="hero-type-top">
                <span>{t}</span>
                <span className="mono">{v.toLocaleString()}</span>
              </div>
              <div className="hero-type-track">
                <span style={{ width: `${(v / typeMax) * 100}%`, background: TYPE_COLORS[t] }} />
              </div>
            </div>
          ))}
        </div>

        <button className="hero-cta" onClick={onStart}>
          Scroll to explore <span aria-hidden="true">↓</span>
        </button>
      </div>
    </header>
  )
}
