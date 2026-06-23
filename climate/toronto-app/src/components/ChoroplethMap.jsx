import { useMemo } from 'react'
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`choropleth${dim ? ' is-dim' : ''}`} role="img" aria-label="Map of Toronto neighbourhoods">
      <g>
        {paths.map(({ d, name, p }) => (
          <path
            key={name}
            d={d}
            fill={colorFn(p)}
            className={`nb${highlightTop.includes(name) ? ' top' : ''}`}
            onMouseEnter={onHover ? () => onHover(p) : undefined}
            onMouseMove={onHover ? () => onHover(p) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
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
}
