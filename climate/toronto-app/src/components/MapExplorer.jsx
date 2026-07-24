import { useMemo, useState } from 'react'
import ChoroplethMap from './ChoroplethMap'
import Legend from './Legend'
import { LAYERS, LAYER_ORDER, makeColorScale } from '../lib/colors'

const CRISIS_COUNTS = {
  key: 'crisis_total',
  label: 'Attended crisis-call volume · 2014–2024',
  unit: 'total calls, 2014–2024',
  short: 'Crisis · 2014–24',
  ramp: LAYERS.crisis_per1k.ramp,
  type: 'sequential',
  fmt: (v) => Math.round(v).toLocaleString(),
}

// One self-contained map: its own layer picker, colour scale, legend and hover
// readout. Clicking a neighbourhood still bubbles up to open the shared profile.
function MapPanel({ geo, layers, defaultMetric, selected, onSelect }) {
  const [metric, setMetric] = useState(defaultMetric)
  const [perCapita, setPerCapita] = useState(true)
  const [hovered, setHovered] = useState(null)

  const isCrisis = metric === 'crisis_per1k'
  const layer = isCrisis && !perCapita ? CRISIS_COUNTS : layers[metric]
  const scale = useMemo(() => makeColorScale(layer, geo.features), [layer, geo])
  const colorFn = (p) => scale.color(p[layer.key])

  return (
    <div className="map-panel">
      <div className="layer-switch" role="tablist" aria-label="Map layer">
        {LAYER_ORDER.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={metric === k}
            className={`layer-btn${metric === k ? ' is-on' : ''}`}
            onClick={() => setMetric(k)}
          >
            {layers[k].short}
          </button>
        ))}
      </div>

      <div className="explorer-map">
        <ChoroplethMap
          geo={geo}
          colorFn={colorFn}
          selected={selected}
          onSelect={onSelect}
          onHover={setHovered}
        />
      </div>

      <div className="panel-legend-row">
        <Legend layer={layer} domain={scale.domain} />
        {isCrisis && (
          <div className="toggle toggle-sm">
            <button className={perCapita ? '' : 'is-on'} onClick={() => setPerCapita(false)}>
              Total
            </button>
            <button className={perCapita ? 'is-on' : ''} onClick={() => setPerCapita(true)}>
              Per-capita
            </button>
          </div>
        )}
      </div>

      <div className="panel-readout">
        {hovered ? (
          <>
            <span className="panel-readout-name">{hovered.name}</span>
            <span className="panel-readout-val mono">{layer.fmt(hovered[layer.key])}</span>
            <span className="panel-readout-cap">{layer.unit}</span>
          </>
        ) : (
          <span className="panel-readout-empty">{layer.blurb || 'Hover a neighbourhood; click to drill in.'}</span>
        )}
      </div>
    </div>
  )
}

// Free-exploration view: two independent maps side by side so a single
// neighbourhood can be compared across two layers at once (e.g. crisis vs heat).
export default function MapExplorer({ geo, layers, selected, onSelect }) {
  return (
    <section className="explorer" id="neighbourhood-explorer">
      <div className="section-head">
        <span className="section-num">A6</span>
        <div>
          <h2 className="section-title">Now investigate the city yourself</h2>
          <p className="section-lede">
            The decision question is where needs overlap. Put two measures side by side, compare
            the same neighbourhood across both maps, and click anywhere for its full profile.
            Similar colours identify a place to investigate, not proof of a relationship.
          </p>
        </div>
      </div>

      <div className="explorer-duo">
        <MapPanel geo={geo} layers={layers} defaultMetric="crisis_per1k" selected={selected} onSelect={onSelect} />
        <MapPanel geo={geo} layers={layers} defaultMetric="treecanopy" selected={selected} onSelect={onSelect} />
      </div>
    </section>
  )
}
