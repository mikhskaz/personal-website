import { useMemo, useState } from 'react'
import ChoroplethMap from './ChoroplethMap'
import Legend from './Legend'
import { LAYERS, LAYER_ORDER, makeColorScale } from '../lib/colors'

const CRISIS_COUNTS = {
  key: 'crisis_total',
  label: 'Crisis volume',
  unit: 'total calls, 2014–2024',
  ramp: LAYERS.crisis_per1k.ramp,
  type: 'sequential',
  fmt: (v) => Math.round(v).toLocaleString(),
}

// Free-exploration view: pick a layer, flip per-capita vs counts, click to drill in.
export default function MapExplorer({ geo, selected, onSelect, hovered, onHover }) {
  const [metric, setMetric] = useState('crisis_per1k')
  const [perCapita, setPerCapita] = useState(true)

  const isCrisis = metric === 'crisis_per1k'
  const layer = isCrisis && !perCapita ? CRISIS_COUNTS : LAYERS[metric]
  const scale = useMemo(() => makeColorScale(layer, geo.features), [layer, geo])
  const colorFn = (p) => scale.color(p[layer.key])

  return (
    <section className="explorer" id="explore">
      <div className="section-head">
        <span className="section-num">01</span>
        <div>
          <h2 className="section-title">Explore it yourself</h2>
          <p className="section-lede">
            Switch the lens. The selected neighbourhood stays put as you flip layers — so you can
            watch a single place go from <em>high crisis</em> to <em>low canopy</em> with your own eyes.
          </p>
        </div>
      </div>

      <div className="explorer-controls">
        <div className="layer-switch" role="tablist" aria-label="Map layer">
          {LAYER_ORDER.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={metric === k}
              className={`layer-btn${metric === k ? ' is-on' : ''}`}
              onClick={() => setMetric(k)}
            >
              {LAYERS[k].short}
            </button>
          ))}
        </div>

        {isCrisis && (
          <div className="toggle">
            <button className={perCapita ? '' : 'is-on'} onClick={() => setPerCapita(false)}>
              Total
            </button>
            <button className={perCapita ? 'is-on' : ''} onClick={() => setPerCapita(true)}>
              Per-capita
            </button>
          </div>
        )}
      </div>

      <div className="explorer-stage">
        <div className="explorer-map">
          <ChoroplethMap
            geo={geo}
            colorFn={colorFn}
            selected={selected}
            onSelect={onSelect}
            onHover={onHover}
          />
          <Legend layer={layer} domain={scale.domain} />
          {isCrisis && perCapita && (
            <p className="caveat">
              <span>ⓘ</span> Rates use <em>residential</em> population. Downtown is inflated by its large
              daytime and visitor population, and by clustered shelters and hospitals — switch to{' '}
              <strong>Total</strong> to compare raw burden.
            </p>
          )}
        </div>

        <div className="explorer-readout">
          {hovered ? (
            <>
              <div className="readout-name">{hovered.name}</div>
              <div className="readout-val mono">{layer.fmt(hovered[layer.key])}</div>
              <div className="readout-cap">{layer.unit}</div>
              <div className="readout-mini">
                <span>Canopy {hovered.treecanopy == null ? '—' : Math.round(hovered.treecanopy * 100) + '%'}</span>
                <span>Heat {hovered.temp_diff == null ? '—' : (hovered.temp_diff > 0 ? '+' : '') + hovered.temp_diff.toFixed(1) + '°'}</span>
              </div>
              <p className="readout-hint">Click to open the full profile</p>
            </>
          ) : (
            <p className="readout-empty">{layer.blurb || 'Hover a neighbourhood to read its value; click to drill in.'}</p>
          )}
        </div>
      </div>
    </section>
  )
}
