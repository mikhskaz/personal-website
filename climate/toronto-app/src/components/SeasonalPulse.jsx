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
const YEARS = Array.from({ length: 11 }, (_, index) => 2014 + index)

export default function SeasonalPulse({ geo, seasonal, selected, onSelect }) {
  const [month, setMonth] = useState(7) // August
  const [year, setYear] = useState('all')
  const [mapMetric, setMapMetric] = useState('calls')
  const [off, setOff] = useState({})

  const yearIndex = year === 'all' ? null : YEARS.indexOf(year)
  const periodData = year === 'all' ? seasonal : seasonal.by_year?.[String(year)]
  const chartIndex = periodData?.index || seasonal.index
  const visible = seasonal.types.filter((t) => !off[t])
  const allVals = seasonal.types.flatMap((t) => chartIndex[t])
  const y = scaleLinear().domain([Math.min(...allVals) - 2, Math.max(...allVals) + 2]).range([H - M.bottom, M.top])
  const x = (i) => M.left + (i / 11) * (W - M.left - M.right)

  // Real Toronto monthly mean air temperature (Open-Meteo / ERA5), if present.
  const temp = year === 'all'
    ? seasonal.temp_monthly
    : seasonal.temp_monthly_by_year?.[String(year)]
  const yT = temp
    ? scaleLinear().domain([Math.min(...temp) - 3, Math.max(...temp) + 3]).range([H - M.bottom, M.top])
    : null
  const tempArea = temp
    ? `M${x(0)},${H - M.bottom} ` +
      temp.map((v, i) => `L${x(i).toFixed(1)},${yT(v).toFixed(1)}`).join(' ') +
      ` L${x(11)},${H - M.bottom} Z`
    : null
  const tempLine = temp ? temp.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yT(v).toFixed(1)}`).join(' ') : null

  // Stable scales across every year/month, so year changes remain comparable.
  const mapScales = useMemo(() => {
    const calls = []
    const temperatures = []
    geo.features.forEach((f) => {
      const pop = f.properties.population
      if (pop) {
        ;(f.properties.monthly_by_year || []).forEach((months) => {
          months.forEach((count) => calls.push((count / pop) * 1000))
        })
      }
      ;(f.properties.monthly_air_temp_c || []).forEach((months) => {
        months.forEach((value) => {
          if (value != null) temperatures.push(value)
        })
      })
    })
    return {
      calls: scaleSequential(interpolateRgbBasis(LAYERS.crisis_per1k.ramp)).domain(extent(calls)),
      openmeteo: scaleSequential(interpolateRgbBasis([
        '#173042', '#28566d', '#4f8295', '#b57a48', '#e3a451', '#ffd185',
      ])).domain(extent(temperatures)),
    }
  }, [geo])

  const meanMonth = (series) => {
    const values = series.map((months) => months?.[month]).filter((value) => value != null)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  }
  const mapValue = (p) => {
    if (mapMetric === 'openmeteo') {
      return yearIndex == null
        ? meanMonth(p.monthly_air_temp_c || [])
        : p.monthly_air_temp_c?.[yearIndex]?.[month] ?? null
    }
    if (!p.population) return null
    const count = yearIndex == null
      ? (p.monthly?.[month] || 0) / YEARS.length
      : p.monthly_by_year?.[yearIndex]?.[month]
    return count == null ? null : (count / p.population) * 1000
  }
  const colorFn = (p) => {
    const value = mapValue(p)
    return value == null ? '#2a241e' : mapScales[mapMetric](value)
  }

  const linePath = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <section className="seasonal" id="when">
      <div className="section-head">
        <span className="section-num">A3</span>
        <div>
          <h2 className="section-title">When call patterns change</h2>
          <p className="section-lede">
            Calls rise and fall by month, but the three call types do not trace one identical
            seasonal curve. Compare them with 2 m air temperature without assuming that warm
            weather caused the change. Each line is indexed to its own monthly average of 100.
          </p>
        </div>
      </div>

      <div className="seasonal-controls">
        <div className="seasonal-control-group">
          <span className="seasonal-control-label">Calendar year</span>
          <div className="studio-year-buttons" role="group" aria-label="Choose calendar year">
            <button
              className={year === 'all' ? 'is-on' : ''}
              aria-pressed={year === 'all'}
              onClick={() => setYear('all')}
            >
              All years
            </button>
            {YEARS.map((optionYear) => (
              <button
                key={optionYear}
                className={year === optionYear ? 'is-on' : ''}
                aria-pressed={year === optionYear}
                onClick={() => setYear(optionYear)}
              >
                {optionYear}
              </button>
            ))}
          </div>
        </div>
        <div className="seasonal-control-group">
          <span className="seasonal-control-label">Map measure</span>
          <div className="layer-switch" role="group" aria-label="Choose seasonal map measure">
            <button
              className={`layer-btn${mapMetric === 'calls' ? ' is-on' : ''}`}
              aria-pressed={mapMetric === 'calls'}
              onClick={() => setMapMetric('calls')}
            >
              Crisis calls
            </button>
            <button
              className={`layer-btn${mapMetric === 'openmeteo' ? ' is-on' : ''}`}
              aria-pressed={mapMetric === 'openmeteo'}
              onClick={() => setMapMetric('openmeteo')}
            >
              Open-Meteo air
            </button>
          </div>
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
              <path key={t} d={linePath(chartIndex[t])} fill="none" stroke={TYPE_COLORS[t]} strokeWidth="2.6" className="sline" />
            ))}
            {visible.map((t) => {
              const vals = chartIndex[t]
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
                Open-Meteo air °C · {year === 'all' ? '2014–24 mean' : year}
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
            {mapMetric === 'calls' ? (
              <>Attended-call intensity in <strong>{FULL[month]} {year === 'all' ? '· 2014–24 monthly mean' : year}</strong>, per 1,000 residents.</>
            ) : (
              <>Open-Meteo mean 2 m air temperature in <strong>{FULL[month]} {year === 'all' ? '· 2014–24 mean' : year}</strong>.</>
            )}{' '}The colour scale stays fixed across all years and months.
          </p>
        </div>
      </div>
    </section>
  )
}
