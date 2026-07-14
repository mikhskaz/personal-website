import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3'

const W = 1000
const H = 650

// Reusable SVG choropleth of Toronto's 158 neighbourhoods.
// colorFn receives a feature's properties object and returns a fill.
export default function ChoroplethMap({
  geo,
  colorFn,
  selected,
  onSelect,
  onHover,
  dim = false,
  highlightTop = [],
}) {
  const wrapRef = useRef(null)
  const [tip, setTip] = useState(null)
  // Decorative maps (Hero) pass neither handler; skip the tooltip + wrapper
  // there so its flex/width styling on the bare <svg> is untouched.
  const interactive = Boolean(onSelect || onHover)

  const paths = useMemo(() => {
    const projection = geoMercator().fitSize([W, H], geo)
    const path = geoPath(projection)
    return geo.features.map((f) => ({
      d: path(f),
      name: f.properties.name,
      p: f.properties,
    }))
  }, [geo])

  const selPath = paths.find((p) => p.name === selected)

  const moveTip = (e, name) => {
    const r = wrapRef.current.getBoundingClientRect()
    setTip({ name, x: e.clientX - r.left, y: e.clientY - r.top })
  }

  const svg = (
    <svg viewBox={`0 0 ${W} ${H}`} className={`choropleth${dim ? ' is-dim' : ''}`} role="img" aria-label="Map of Toronto neighbourhoods">
      <g>
        {paths.map(({ d, name, p }) => (
          <path
            key={name}
            d={d}
            fill={colorFn(p)}
            className={`nb${highlightTop.includes(name) ? ' top' : ''}`}
            onMouseEnter={
              interactive
                ? (e) => {
                    onHover?.(p)
                    moveTip(e, name)
                  }
                : undefined
            }
            onMouseMove={
              interactive
                ? (e) => {
                    onHover?.(p)
                    moveTip(e, name)
                  }
                : undefined
            }
            onMouseLeave={
              interactive
                ? () => {
                    onHover?.(null)
                    setTip(null)
                  }
                : undefined
            }
            onClick={onSelect ? () => onSelect(name) : undefined}
          />
        ))}
      </g>
      {/* Redraw the selected neighbourhood on top so its outline is never
          painted over by neighbouring polygons. */}
      {selPath && (
        <path d={selPath.d} fill={colorFn(selPath.p)} className="nb sel" pointerEvents="none" />
      )}
    </svg>
  )

  if (!interactive) return svg

  return (
    <div ref={wrapRef} className="choropleth-wrap">
      {svg}
      {tip && (
        <div className="map-tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.name}
        </div>
      )}
    </div>
  )
}
