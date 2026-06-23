import { useMemo, useState } from 'react'
import { scaleLinear, scaleSequential, interpolateRgbBasis, extent } from 'd3'
import ChoroplethMap from './ChoroplethMap'
import { LAYERS } from '../lib/colors'

const W = 580
const H = 340
const M = { top: 28, right: 46, bottom: 36, left: 40 }
const TYPE_COLORS = {
  'Person in Crisis': '#c9a24b',
  'Suicide-related': '#8b9a93',
  Overdose: '#e2603f',
}
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function SeasonalPulse({ geo, seasonal, selected, onSelect }) {
  const [month, setMonth] = useState(7) // August
  const [off, setOff] = useState({})

  const visible = seasonal.types.filter((t) => !off[t])
  const allVals = seasonal.types.flatMap((t) => seasonal.index[t])
  const y = scaleLinear().domain([Math.min(...allVals) - 2, Math.max(...allVals) + 2]).range([H - M.bottom, M.top])
  const x = (i) => M.left + (i / 11) * (W - M.left - M.right)

  // Real Toronto monthly mean air temperature (Open-Meteo / ERA5), if present.
  const temp = seasonal.temp_monthly
  const yT = temp
    ? scaleLinear().domain([Math.min(...temp) - 3, Math.max(...temp) + 3]).range([H - M.bottom, M.top])
    : null
  const tempArea = temp
    ? `M${x(0)},${H - M.bottom} ` +
      temp.map((v, i) => `L${x(i).toFixed(1)},${yT(v).toFixed(1)}`).join(' ') +
      ` L${x(11)},${H - M.bottom} Z`
    : null
  const tempLine = temp ? temp.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yT(v).toFixed(1)}`).join(' ') : null

  // Stable per-capita colour scale across all months for the mini map.
  const monthScale = useMemo(() => {
    const all = []
    geo.features.forEach((f) => {
      const pop = f.properties.population
      if (pop) f.properties.monthly.forEach((c) => all.push((c / pop) * 1000))
    })
    return scaleSequential(interpolateRgbBasis(LAYERS.crisis_per1k.ramp)).domain(extent(all))
  }, [geo])
  const colorFn = (p) => (p.population ? monthScale((p.monthly[month] / p.population) * 1000) : '#2a241e')

  const linePath = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <section className="seasonal" id="when">
      <div className="section-head">
        <span className="section-num">03</span>
        <div>
          <h2 className="section-title">Crisis follows the seasons — and the heat</h2>
          <p className="section-lede">
            Crisis indexed so 100 = each call type’s annual average; the shaded band is Toronto’s real
            mean air temperature (°C, right axis). Drag the month to watch the city heat up on the map.
            Overdose peaks with deep-summer heat; the others climb with spring.
          </p>
        </div>
      </div>

      <div className="seasonal-grid">
        <div className="seasonal-chart">
          <svg viewBox={`0 0 ${W} ${H}`} className="lines">
            {/* temperature band (drawn first, behind the crisis lines) */}
            {temp && (
              <g className="temp-layer">
                <path d={tempArea} className="temp-area" />
                <path d={tempLine} className="temp-line" />
                {yT.ticks(4).map((t) => (
                  <text key={`tc${t}`} x={W - M.right + 8} y={yT(t)} className="tick temp" dominantBaseline="middle">
                    {t}°
                  </text>
                ))}
              </g>
            )}
            {y.ticks(4).map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className={t === 100 ? 'grid base' : 'grid'} />
                <text x={M.left - 8} y={y(t)} className="tick" textAnchor="end" dominantBaseline="middle">{t}</text>
              </g>
            ))}
            {/* month guide */}
            <line x1={x(month)} x2={x(month)} y1={M.top} y2={H - M.bottom} className="guide" />
            {seasonal.months.map((m, i) => (
              <text key={m} x={x(i)} y={H - M.bottom + 18} className={`tick${i === month ? ' on' : ''}`} textAnchor="middle">
                {m[0]}
              </text>
            ))}
            {visible.map((t) => (
              <path key={t} d={linePath(seasonal.index[t])} fill="none" stroke={TYPE_COLORS[t]} strokeWidth="2.6" className="sline" />
            ))}
            {visible.map((t) => {
              const vals = seasonal.index[t]
              const pk = vals.indexOf(Math.max(...vals))
              return (
                <g key={`pk${t}`}>
                  <circle cx={x(pk)} cy={y(vals[pk])} r="5" fill={TYPE_COLORS[t]} stroke="#15100c" strokeWidth="2" />
                  <text x={x(pk)} y={y(vals[pk]) - 10} className="peak" fill={TYPE_COLORS[t]} textAnchor="middle">
                    {seasonal.months[pk]} {Math.round(vals[pk])}
                  </text>
                </g>
              )
            })}
            <circle cx={x(month)} cy={M.top - 6} r="4" className="guide-knob" />
          </svg>

          <div className="type-toggles">
            {seasonal.types.map((t) => (
              <button
                key={t}
                className={`type-toggle${off[t] ? ' is-off' : ''}`}
                onClick={() => setOff((o) => ({ ...o, [t]: !o[t] }))}
              >
                <i style={{ background: TYPE_COLORS[t] }} />
                {t}
              </button>
            ))}
            {temp && (
              <span className="type-toggle static">
                <i className="temp-swatch" />
                Air temp °C
              </span>
            )}
          </div>

          <div className="scrubber">
            <input type="range" min="0" max="11" value={month} onChange={(e) => setMonth(+e.target.value)} aria-label="Month" />
            <span className="scrubber-month mono">{FULL[month]}</span>
          </div>
        </div>

        <div className="seasonal-map">
          <ChoroplethMap geo={geo} colorFn={colorFn} selected={selected} onSelect={onSelect} />
          <p className="seasonal-mapcap">
            Crisis intensity in <strong>{FULL[month]}</strong>, per 1,000 residents. Colour scale is
            fixed across months so you can see the city brighten through summer.
          </p>
        </div>
      </div>
    </section>
  )
}
