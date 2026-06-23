import { useMemo, useState } from 'react'
import { scaleLinear, extent } from 'd3'
import { AXIS_FIELDS } from '../lib/colors'

const W = 640
const H = 460
const M = { top: 24, right: 24, bottom: 52, left: 64 }

function pearson(points) {
  const n = points.length
  if (n < 3) return NaN
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my)
    sxx += (p.x - mx) ** 2
    syy += (p.y - my) ** 2
  }
  return sxy / Math.sqrt(sxx * syy)
}

const PRESETS = [
  { x: 'treecanopy', y: 'crisis_per1k', label: 'Canopy ⟷ Crisis' },
  { x: 'pctpov', y: 'crisis_per1k', label: 'Poverty ⟷ Crisis' },
  { x: 'temp_diff', y: 'crisis_per1k', label: 'Heat ⟷ Crisis' },
  { x: 'tes', y: 'crisis_per1k', label: 'Equity score ⟷ Crisis' },
]

export default function CorrelationStudio({ geo, onSelect }) {
  const [xKey, setXKey] = useState('treecanopy')
  const [yKey, setYKey] = useState('crisis_per1k')
  const [hover, setHover] = useState(null)

  const xField = AXIS_FIELDS.find((f) => f.key === xKey)
  const yField = AXIS_FIELDS.find((f) => f.key === yKey)

  const points = useMemo(
    () =>
      geo.features
        .map((f) => ({ name: f.properties.name, x: f.properties[xKey], y: f.properties[yKey] }))
        .filter((p) => p.x != null && p.y != null && isFinite(p.x) && isFinite(p.y)),
    [geo, xKey, yKey]
  )

  const r = useMemo(() => pearson(points), [points])

  const x = scaleLinear().domain(extent(points, (p) => p.x)).nice().range([M.left, W - M.right])
  const y = scaleLinear().domain(extent(points, (p) => p.y)).nice().range([H - M.bottom, M.top])

  // least-squares line endpoints
  const line = useMemo(() => {
    const n = points.length
    const mx = points.reduce((s, p) => s + p.x, 0) / n
    const my = points.reduce((s, p) => s + p.y, 0) / n
    let num = 0, den = 0
    for (const p of points) {
      num += (p.x - mx) * (p.y - my)
      den += (p.x - mx) ** 2
    }
    const slope = num / den
    const b = my - slope * mx
    const [x0, x1] = x.domain()
    return { x0, y0: slope * x0 + b, x1, y1: slope * x1 + b }
  }, [points, x])

  const strength = Math.abs(r) > 0.4 ? 'strong' : Math.abs(r) > 0.2 ? 'moderate' : 'weak/none'

  return (
    <section className="studio" id="why">
      <div className="section-head">
        <span className="section-num">02</span>
        <div>
          <h2 className="section-title">Is it really the trees — or just poverty?</h2>
          <p className="section-lede">
            Each dot is a neighbourhood. Pick any two variables and the line and correlation update
            live. Don’t take our word for it — test it.
          </p>
        </div>
      </div>

      <div className="studio-grid">
        <div className="studio-plot">
          <svg viewBox={`0 0 ${W} ${H}`} className="scatter">
            {/* axes */}
            {y.ticks(5).map((t) => (
              <g key={`y${t}`}>
                <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className="grid" />
                <text x={M.left - 10} y={y(t)} className="tick" textAnchor="end" dominantBaseline="middle">
                  {yField.fmt(t)}
                </text>
              </g>
            ))}
            {x.ticks(5).map((t) => (
              <g key={`x${t}`}>
                <text x={x(t)} y={H - M.bottom + 20} className="tick" textAnchor="middle">
                  {xField.fmt(t)}
                </text>
              </g>
            ))}
            {/* regression line */}
            <line x1={x(line.x0)} y1={y(line.y0)} x2={x(line.x1)} y2={y(line.y1)} className="regline" />
            {/* dots */}
            {points.map((p) => (
              <circle
                key={p.name}
                cx={x(p.x)}
                cy={y(p.y)}
                r={hover === p.name ? 6 : 4}
                className={`dot${hover === p.name ? ' hot' : ''}`}
                onMouseEnter={() => setHover(p.name)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(p.name)}
              />
            ))}
            <text x={(W) / 2} y={H - 8} className="axis-label" textAnchor="middle">
              {xField.label} →
            </text>
            <text x={-H / 2} y={16} className="axis-label" textAnchor="middle" transform="rotate(-90)">
              {yField.label} →
            </text>
            {hover && (() => {
              const p = points.find((q) => q.name === hover)
              return (
                <g transform={`translate(${Math.min(x(p.x) + 10, W - 150)},${Math.max(y(p.y) - 10, 30)})`}>
                  <rect className="tip" width="150" height="42" rx="4" />
                  <text className="tip-name" x="8" y="17">{p.name.slice(0, 22)}</text>
                  <text className="tip-val" x="8" y="33">
                    {xField.fmt(p.x)} · {yField.fmt(p.y)}
                  </text>
                </g>
              )
            })()}
          </svg>
        </div>

        <div className="studio-side">
          <div className="r-card">
            <span className="r-label">Pearson r</span>
            <span className={`r-value ${r > 0 ? 'pos' : 'neg'}`}>
              {r > 0 ? '+' : ''}
              {r.toFixed(2)}
            </span>
            <span className="r-strength">{strength} correlation</span>
          </div>

          <label className="field">
            <span>X axis</span>
            <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
              {AXIS_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Y axis</span>
            <select value={yKey} onChange={(e) => setYKey(e.target.value)}>
              {AXIS_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </label>

          <div className="presets">
            <span className="presets-h">Quick comparisons</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`preset${xKey === p.x && yKey === p.y ? ' is-on' : ''}`}
                onClick={() => {
                  setXKey(p.x)
                  setYKey(p.y)
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="studio-note">
            Notice: the composite <strong>Tree Equity Score</strong> is nearly flat against crisis,
            while <strong>canopy</strong> and <strong>poverty</strong> clearly slope. That gap is the
            argument for targeting the components, not the score.
          </p>
        </div>
      </div>
    </section>
  )
}
