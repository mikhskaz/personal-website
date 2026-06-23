import { useEffect, useRef, useState } from 'react'
import ChoroplethMap from './ChoroplethMap'

const TYPE_COLORS = {
  'Person in Crisis': '#c9a24b',
  'Suicide-related': '#8b9a93',
  Overdose: '#e2603f',
}

function useCountUp(target, duration = 1600) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

export default function Hero({ geo, meta, scale, onStart }) {
  const count = useCountUp(meta.crisis_total)
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
        <p className="kicker">An interactive atlas · Toronto · {meta.period}</p>
        <h1 className="hero-title">
          Crisis <span className="amp">&amp;</span> Canopy
        </h1>
        <p className="hero-sub">
          Where — and when — do mental-health crises concentrate across Toronto, and how do they
          line up with summer heat and the missing tree canopy?
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-big">{count.toLocaleString()}</span>
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
