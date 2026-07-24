import { useMemo, useState } from 'react'
import { extent, scaleLinear } from 'd3'
import ChoroplethMap from './ChoroplethMap'
import { AXIS_FIELDS, LAYERS, makeColorScale } from '../lib/colors'
import { BOROUGH_ORDER, boroughOf } from '../lib/boroughs'

const W = 680
const H = 470
const M = { top: 24, right: 24, bottom: 54, left: 66 }
const EXCLUDED_COLOR = '#292b2d'
const YEARS = Array.from({ length: 11 }, (_, index) => 2014 + index)
const CALL_RATE_FIELDS = {
  crisis_per1k: { type: null, label: 'All crisis calls' },
  person_in_crisis_per1k: { type: 'Person in Crisis', label: 'Person in Crisis' },
  suicide_related_per1k: { type: 'Suicide-related', label: 'Suicide-related' },
  overdose_per1k: { type: 'Overdose', label: 'Overdose' },
}

function pearson(points) {
  const n = points.length
  if (n < 3) return NaN
  const mx = points.reduce((sum, point) => sum + point.x, 0) / n
  const my = points.reduce((sum, point) => sum + point.y, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const point of points) {
    sxy += (point.x - mx) * (point.y - my)
    sxx += (point.x - mx) ** 2
    syy += (point.y - my) ** 2
  }
  const denominator = Math.sqrt(sxx * syy)
  return denominator ? sxy / denominator : NaN
}

function twoWayResiduals(points, key) {
  if (points.length < 3 || new Set(points.map((point) => point.year)).size < 2) return null
  let residuals = points.map((point) => point[key])

  // Alternating demeaning handles the one missing LST observation without
  // pretending the neighbourhood-year panel is perfectly balanced.
  for (let iteration = 0; iteration < 20; iteration += 1) {
    for (const groupKey of ['name', 'year']) {
      const sums = new Map()
      points.forEach((point, index) => {
        const id = point[groupKey]
        const group = sums.get(id) || { sum: 0, n: 0 }
        group.sum += residuals[index]
        group.n += 1
        sums.set(id, group)
      })
      residuals = residuals.map((value, index) => {
        const group = sums.get(points[index][groupKey])
        return value - group.sum / group.n
      })
    }
  }
  return residuals
}

function adjustedPearson(points) {
  const xResiduals = twoWayResiduals(points, 'x')
  const yResiduals = twoWayResiduals(points, 'y')
  if (!xResiduals || !yResiduals) return NaN
  if (
    Math.max(...xResiduals.map((value) => Math.abs(value))) < 1e-9
    || Math.max(...yResiduals.map((value) => Math.abs(value))) < 1e-9
  ) return NaN
  return pearson(points.map((point, index) => ({
    x: xResiduals[index],
    y: yResiduals[index],
  })))
}

function correlationStrength(value, unavailable = 'not enough variation') {
  if (!Number.isFinite(value)) return unavailable
  const absolute = Math.abs(value)
  if (absolute >= 0.7) return 'strong correlation'
  if (absolute >= 0.3) return 'moderate correlation'
  if (absolute >= 0.1) return 'weak correlation'
  return 'very weak correlation'
}

const PRESETS = [
  { x: 'treecanopy', y: 'crisis_per1k', label: 'Canopy (2018) / crisis' },
  { x: 'pctpov', y: 'crisis_per1k', label: 'Low income (2021) / crisis' },
  { x: 'temp_diff', y: 'crisis_per1k', label: 'Heat / crisis' },
  { x: 'air_temp', y: 'crisis_per1k', label: 'Open-Meteo air / crisis' },
  { x: 'tes', y: 'crisis_per1k', label: 'Equity score (2024) / crisis' },
  { x: 'temp_diff', y: 'person_in_crisis_per1k', label: 'Heat / Person in Crisis' },
  { x: 'temp_diff', y: 'suicide_related_per1k', label: 'Heat / suicide-related' },
  { x: 'temp_diff', y: 'overdose_per1k', label: 'Heat / overdose' },
  { x: 'air_temp', y: 'overdose_per1k', label: 'Open-Meteo air / overdose' },
]

export default function CorrelationStudio({ geo, onSelect }) {
  const [xKey, setXKey] = useState('treecanopy')
  const [yKey, setYKey] = useState('crisis_per1k')
  const [crisisYear, setCrisisYear] = useState('all')
  const [callWindow, setCallWindow] = useState('summer')
  const [excluded, setExcluded] = useState(() => new Set())
  const [hover, setHover] = useState(null)
  const [mapHover, setMapHover] = useState(null)

  const hasAnnualLst = useMemo(
    () =>
      geo.features.some((feature) =>
        feature.properties.yearly_temp_diff?.some((value) => value != null)
      ),
    [geo]
  )
  const hasAnnualAir = useMemo(
    () =>
      geo.features.some((feature) =>
        feature.properties.yearly_air_temp_c?.some((value) => value != null)
        && feature.properties.yearly_air_temp_full_c?.some((value) => value != null)
      ),
    [geo]
  )
  const usesAnnualObservations = Boolean(
    CALL_RATE_FIELDS[xKey]
    || CALL_RATE_FIELDS[yKey]
    || (hasAnnualLst && (xKey === 'temp_diff' || yKey === 'temp_diff'))
    || (hasAnnualAir && (xKey === 'air_temp' || yKey === 'air_temp'))
  )
  const isPooled = crisisYear === 'all'
  const windowLabel = callWindow === 'summer' ? 'Jun–Aug' : 'Jan–Dec'
  const crisisPeriodLabel = isPooled
    ? `${windowLabel} 2014–2024, pooled annually`
    : `${windowLabel} ${crisisYear}`
  const fieldConfig = (key) => {
    const field = AXIS_FIELDS.find((candidate) => candidate.key === key)
    if (CALL_RATE_FIELDS[key]) {
      return {
        ...field,
        label: `${CALL_RATE_FIELDS[key].label} per 1,000 (${crisisPeriodLabel})`,
      }
    }
    if (key === 'temp_diff' && hasAnnualLst) {
      const period = isPooled ? '2014–2024 pooled summers' : crisisYear
      return { ...field, label: `Summer LST vs city °C (${period})` }
    }
    if (key === 'air_temp' && hasAnnualAir) {
      const measure = callWindow === 'summer'
        ? 'Jun–Aug mean Open-Meteo air °C'
        : 'Annual mean Open-Meteo air °C'
      const period = isPooled ? '2014–2024 pooled annually' : crisisYear
      return { ...field, label: `${measure} (${period})` }
    }
    return field
  }
  const xField = fieldConfig(xKey)
  const yField = fieldConfig(yKey)

  const callRate = (properties, key = 'crisis_per1k', year = null) => {
    const callField = CALL_RATE_FIELDS[key]
    if (!callField || !properties.population) return null
    const type = callField.type
    const series = callWindow === 'summer'
      ? type
        ? properties.yearly_summer_by_type?.[type]
        : properties.yearly_summer
      : type
        ? properties.yearly_by_type?.[type]
        : properties.yearly
    if (!series) return null
    const index = year == null ? -1 : YEARS.indexOf(Number(year))
    const count = year == null ? series.reduce((sum, value) => sum + value, 0) : series[index]
    return count != null ? (count / properties.population) * 1000 : null
  }

  const metricValue = (properties, key, year) => {
    if (CALL_RATE_FIELDS[key]) return callRate(properties, key, year)
    if (key === 'temp_diff' && hasAnnualLst && year != null) {
      const index = YEARS.indexOf(Number(year))
      return properties.yearly_temp_diff?.[index] ?? null
    }
    if (key === 'air_temp' && hasAnnualAir && year != null) {
      const index = YEARS.indexOf(Number(year))
      const series = callWindow === 'summer'
        ? properties.yearly_air_temp_c
        : properties.yearly_air_temp_full_c
      return series?.[index] ?? null
    }
    return properties[key]
  }
  const mapCallKey = CALL_RATE_FIELDS[yKey]
    ? yKey
    : CALL_RATE_FIELDS[xKey]
      ? xKey
      : 'crisis_per1k'
  const mapFieldLabel = `${CALL_RATE_FIELDS[mapCallKey].label} per 1,000 (${windowLabel} ${isPooled ? '2014–2024 combined' : crisisYear})`

  const allPoints = useMemo(
    () =>
      geo.features
        .flatMap((feature) =>
          (isPooled && usesAnnualObservations
            ? YEARS
            : [isPooled ? null : Number(crisisYear)]
          ).map((year) => ({
            id: `${feature.properties.name}::${year ?? 'snapshot'}`,
            name: feature.properties.name,
            year,
            x: metricValue(feature.properties, xKey, year),
            y: metricValue(feature.properties, yKey, year),
          }))
        )
        .filter((point) => point.x != null && point.y != null && isFinite(point.x) && isFinite(point.y)),
    [geo, xKey, yKey, crisisYear, callWindow, hasAnnualLst, hasAnnualAir, usesAnnualObservations]
  )

  const points = useMemo(
    () => allPoints.filter((point) => !excluded.has(point.name)),
    [allPoints, excluded]
  )

  const boroughNames = useMemo(() => {
    const groups = Object.fromEntries(BOROUGH_ORDER.map((borough) => [borough, []]))
    geo.features.forEach((feature) => {
      const borough = boroughOf(feature.properties)
      if (borough) groups[borough].push(feature.properties.name)
    })
    return groups
  }, [geo])

  // Keep the axes stable while neighbourhoods are toggled so the reader sees
  // the calculation change, not a constantly rescaling coordinate system.
  const xDomain = extent(allPoints, (point) => point.x)
  const yDomain = extent(allPoints, (point) => point.y)
  const x = scaleLinear().domain(xDomain[0] == null ? [0, 1] : xDomain).nice().range([M.left, W - M.right])
  const y = scaleLinear().domain(yDomain[0] == null ? [0, 1] : yDomain).nice().range([H - M.bottom, M.top])

  const r = useMemo(() => pearson(points), [points])
  const hasR = Number.isFinite(r)
  const adjustedR = useMemo(
    () => (isPooled && usesAnnualObservations ? adjustedPearson(points) : NaN),
    [points, isPooled, usesAnnualObservations]
  )
  const hasAdjustedR = Number.isFinite(adjustedR)
  const hoveredPoint = hover
    ? allPoints.find((point) => point.id === hover.id) || null
    : null

  const line = useMemo(() => {
    if (points.length < 2) return null
    const n = points.length
    const mx = points.reduce((sum, point) => sum + point.x, 0) / n
    const my = points.reduce((sum, point) => sum + point.y, 0) / n
    let numerator = 0
    let denominator = 0
    for (const point of points) {
      numerator += (point.x - mx) * (point.y - my)
      denominator += (point.x - mx) ** 2
    }
    if (!denominator) return null
    const slope = numerator / denominator
    const intercept = my - slope * mx
    const [x0, x1] = x.domain()
    return { x0, y0: slope * x0 + intercept, x1, y1: slope * x1 + intercept }
  }, [points, x])

  const mapScale = useMemo(() => {
    const layer = { ...LAYERS.crisis_per1k, key: 'crisis_view' }
    const features = geo.features.map((feature) => ({
      properties: {
        crisis_view: callRate(
          feature.properties,
          mapCallKey,
          isPooled ? null : Number(crisisYear)
        ),
      },
    }))
    return makeColorScale(layer, features)
  }, [geo, crisisYear, callWindow, mapCallKey, isPooled])

  const toggleNeighbourhood = (name) => {
    setExcluded((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleBorough = (borough) => {
    const names = boroughNames[borough]
    setExcluded((current) => {
      const next = new Set(current)
      const allExcluded = names.every((name) => current.has(name))
      names.forEach((name) => {
        if (allExcluded) next.delete(name)
        else next.add(name)
      })
      return next
    })
  }

  const strength = correlationStrength(r)
  const adjustedStrength = correlationStrength(adjustedR, 'not enough within-year variation')

  return (
    <section className="studio" id="why">
      <div className="section-head">
        <span className="section-num">A5</span>
        <div>
          <h2 className="section-title">What moves together - and what does not</h2>
          <p className="section-lede">
            A visible slope tells you what co-varies, not why. Change the axes, year, and call
            window, or exclude neighbourhoods, to see how sensitive each bivariate relationship is.
            “All years” pools matched neighbourhood-years for temperature comparisons instead of
            mixing an eleven-year call total with one weather value.
          </p>
        </div>
      </div>

      <div className="studio-year-filter" aria-label="Crisis call period">
        <div className="studio-year-copy">
          <span>Observation set</span>
          <strong>{isPooled ? 'All years pooled' : crisisYear}</strong>
          <small>{isPooled && usesAnnualObservations ? 'One dot per neighbourhood-year' : 'One dot per neighbourhood'} · 2021 population.</small>
        </div>
        <div className="studio-window-filter">
          <span>Call window</span>
          <div className="studio-window-buttons" role="group" aria-label="Choose call window">
            <button
              type="button"
              className={callWindow === 'summer' ? 'is-on' : ''}
              aria-pressed={callWindow === 'summer'}
              onClick={() => setCallWindow('summer')}
            >
              Summer · Jun–Aug
            </button>
            <button
              type="button"
              className={callWindow === 'full' ? 'is-on' : ''}
              aria-pressed={callWindow === 'full'}
              onClick={() => setCallWindow('full')}
            >
              Full year
            </button>
          </div>
        </div>
        <div className="studio-year-buttons" role="group" aria-label="Choose crisis-call year">
          <button
            type="button"
            className={crisisYear === 'all' ? 'is-on' : ''}
            aria-pressed={crisisYear === 'all'}
            onClick={() => setCrisisYear('all')}
          >
            All years · pooled
          </button>
          {YEARS.map((year) => (
            <button
              key={year}
              type="button"
              className={crisisYear === year ? 'is-on' : ''}
              aria-pressed={crisisYear === year}
              onClick={() => setCrisisYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-grid studio-filter-grid">
        <div className="studio-map-filter">
          <div className="studio-map-head">
            <div>
              <span className="studio-map-kicker">{mapFieldLabel}</span>
              <h3>Choose neighbourhoods</h3>
            </div>
            <button
              type="button"
              className="studio-reset"
              disabled={excluded.size === 0}
              onClick={() => setExcluded(new Set())}
            >
              Enable all
            </button>
          </div>

          <ChoroplethMap
            geo={geo}
            selected={hoveredPoint?.name}
            colorFn={(properties) =>
              excluded.has(properties.name)
                ? EXCLUDED_COLOR
                : mapScale.color(
                    callRate(
                      properties,
                      mapCallKey,
                      isPooled ? null : Number(crisisYear)
                    )
                  )
            }
            onSelect={toggleNeighbourhood}
            onHover={setMapHover}
          />

          <div className="studio-map-key" aria-hidden="true">
            <span><i className="is-enabled" /> Included</span>
            <span><i className="is-excluded" /> Excluded</span>
          </div>
          <div className="borough-filter">
            <span className="borough-filter-label">Toggle former municipalities</span>
            <div className="borough-filter-buttons">
              {BOROUGH_ORDER.map((borough) => {
                const names = boroughNames[borough]
                const enabledCount = names.filter((name) => !excluded.has(name)).length
                const isEnabled = enabledCount === names.length
                const isPartial = enabledCount > 0 && !isEnabled
                return (
                  <button
                    key={borough}
                    type="button"
                    aria-pressed={isEnabled}
                    className={`borough-filter-btn${isEnabled ? ' is-enabled' : ''}${isPartial ? ' is-partial' : ''}`}
                    onClick={() => toggleBorough(borough)}
                  >
                    <span>{borough}</span>
                    <small>{enabledCount}/{names.length}</small>
                  </button>
                )
              })}
            </div>
          </div>
          <p className="studio-map-readout">
            {mapHover ? (
              <>
                <strong>{mapHover.name}</strong> is{' '}
                {excluded.has(mapHover.name) ? 'excluded' : 'included'} - click to toggle.
              </>
            ) : (
              <>Click a neighbourhood to drop it from the calculation; click it again to restore it.</>
            )}
          </p>
        </div>

        <div className="studio-analysis">
          <div className="studio-plot">
            <svg viewBox={`0 0 ${W} ${H}`} className="scatter">
              {y.ticks(5).map((tick) => (
                <g key={`y${tick}`}>
                  <line x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} className="grid" />
                  <text x={M.left - 10} y={y(tick)} className="tick" textAnchor="end" dominantBaseline="middle">
                    {yField.fmt(tick)}
                  </text>
                </g>
              ))}
              {x.ticks(5).map((tick) => (
                <text key={`x${tick}`} x={x(tick)} y={H - M.bottom + 20} className="tick" textAnchor="middle">
                  {xField.fmt(tick)}
                </text>
              ))}

              {line && (
                <line
                  x1={x(line.x0)}
                  y1={y(line.y0)}
                  x2={x(line.x1)}
                  y2={y(line.y1)}
                  className="regline"
                />
              )}

              {allPoints.map((point) => {
                const isExcluded = excluded.has(point.name)
                return (
                  <circle
                    key={point.id}
                    cx={x(point.x)}
                    cy={y(point.y)}
                    r={hoveredPoint?.id === point.id ? 6 : isPooled ? 2.6 : 4}
                    className={`dot${hoveredPoint?.id === point.id ? ' hot' : ''}${isExcluded ? ' is-excluded' : ''}`}
                    onMouseEnter={() => setHover(point)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onSelect?.(point.name)}
                  />
                )
              })}

              <text x={W / 2} y={H - 8} className="axis-label" textAnchor="middle">
                {xField.label}
              </text>
              <text x={-H / 2} y={16} className="axis-label" textAnchor="middle" transform="rotate(-90)">
                {yField.label}
              </text>

              {hoveredPoint && (() => {
                const point = hoveredPoint
                return (
                  <g
                    pointerEvents="none"
                    transform={`translate(${Math.min(x(point.x) + 10, W - 166)},${Math.max(y(point.y) - 10, 30)})`}
                  >
                    <rect className="tip" width="166" height="46" rx="4" />
                    <text className="tip-name" x="8" y="17">
                      {point.name.slice(0, 19)}{point.year != null ? ` · ${point.year}` : ''}
                    </text>
                    <text className="tip-val" x="8" y="34">
                      {excluded.has(point.name) ? 'Excluded / ' : ''}{xField.fmt(point.x)} / {yField.fmt(point.y)}
                    </text>
                  </g>
                )
              })()}
            </svg>
          </div>

          <div className="studio-side studio-controls">
            <div className="r-card">
              <span className="r-label">Pearson r</span>
              <span className={`r-value ${hasR && r > 0 ? 'pos' : 'neg'}`}>
                {hasR ? `${r > 0 ? '+' : ''}${r.toFixed(2)}` : '--'}
              </span>
              <span className="r-strength">{strength}</span>
              <span className="r-sample">
                n = {points.length} observations · {new Set(points.map((point) => point.name)).size} neighbourhoods
              </span>
              {isPooled && usesAnnualObservations && (
                <div className="r-adjusted">
                  <span className="r-label">Adjusted r</span>
                  <span className={`r-adjusted-value ${hasAdjustedR && adjustedR > 0 ? 'pos' : 'neg'}`}>
                    {hasAdjustedR ? `${adjustedR > 0 ? '+' : ''}${adjustedR.toFixed(2)}` : '--'}
                  </span>
                  <span className="r-strength">{adjustedStrength}</span>
                  <small>Neighbourhood + year baselines removed</small>
                </div>
              )}
            </div>

            <div className="studio-axis-fields">
              <label className="field">
                <span>X axis</span>
                <select value={xKey} onChange={(event) => setXKey(event.target.value)}>
                  {AXIS_FIELDS.map((field) => (
                    <option key={field.key} value={field.key}>{fieldConfig(field.key).label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Y axis</span>
                <select value={yKey} onChange={(event) => setYKey(event.target.value)}>
                  {AXIS_FIELDS.map((field) => (
                    <option key={field.key} value={field.key}>{fieldConfig(field.key).label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="presets">
              <span className="presets-h">Quick comparisons</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`preset${xKey === preset.x && yKey === preset.y ? ' is-on' : ''}`}
                  onClick={() => {
                    setXKey(preset.x)
                    setYKey(preset.y)
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="studio-note">
              Excluding a neighbourhood is a sensitivity test, not a reason to discard inconvenient
              evidence. Raw Pearson r describes the visible points. Adjusted r residualizes both
              neighbourhood and year baselines; neither result establishes cause.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
