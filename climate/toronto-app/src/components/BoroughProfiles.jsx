import { useEffect, useMemo, useState } from 'react'
import ChoroplethMap from './ChoroplethMap'
import Legend from './Legend'
import Sparkline from './Sparkline'
import { LAYERS, heatVintageLabel, makeColorScale } from '../lib/colors'
import {
  BOROUGH_ORDER,
  BOROUGH_PROFILES,
  aggregateBoroughs,
  aggregateCity,
  boroughOf,
} from '../lib/boroughs'
import { num, pct, signed } from '../lib/format'

const OUTSIDE_FILL = '#101214'
const FEATURED_BOROUGHS = ['Old Toronto', 'Etobicoke']

// Keep one city-wide scale so colours remain comparable as the borough changes.
const BOROUGH_LAYER = LAYERS.crisis_per1k

const TYPE_COLORS = {
  'Person in Crisis': '#c9a24b',
  'Suicide-related': '#8b9a93',
  Overdose: '#e2603f',
}

// Authored illustrative scenes, explicitly labelled in the UI as non-testimony.
// Image filenames are the municipality names below, placed in public/img.
const BOROUGH_VISUALS = {
  'Old Toronto': { image: 'oldtoronto.webp', quote: '“Everything here is concrete, glass, and asphalt, so the heat has nowhere to go. Even at night, the streets still feel like they’re holding onto the whole day.”' },
  'North York': { image: 'northyork.webp', quote: '“The towers block the breeze, and the sidewalks turn bright and hot by noon. I keep moving between air-conditioned buildings, pretending the short walk doesn’t count as a heat wave.”' },
  Scarborough: { image: 'scarborough.webp', quote: '“The heat doesn’t hit every neighbourhood the same way. Some places have shade and parks, but other streets feel like long stretches of pavement with nowhere comfortable to stop.”' },
  Etobicoke: { image: 'etobicoke.webp', quote: '“Everything is spread out, so escaping the heat means walking, driving, or waiting for a bus longer than you want to. The trees help, but the roads and parking lots still seem to go on forever.”' },
  'East York': { image: 'eastyork.webp', quote: '“The heat is hardest on the people who can’t simply stay inside all day. I worry about the neighbours, the kids, the gardens, and whether the community has enough cool places to gather.”' },
  York: { image: 'york.webp', quote: '“The older streets have character, but character doesn’t always make shade. On the hottest days, brick walls and pavement seem to radiate heat right back at you.”' },
}

// One borough stat with the city-wide value alongside for context.
function CompareRow({ label, value, city, fmt, higherWorse }) {
  const delta = value == null || city == null ? 0 : value - city
  const worse = higherWorse ? delta > 0 : delta < 0
  const arrow = delta === 0 ? '·' : delta > 0 ? '▲' : '▼'
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{fmt(value)}</span>
      <span className={`stat-delta ${worse ? 'bad' : 'good'}`}>
        {arrow} <span className="muted">city {fmt(city)}</span>
      </span>
    </div>
  )
}

// Local case studies using the six pre-amalgamation municipalities. Two
// contrasting cases lead; the other four are available on demand. One shared
// scale keeps colours comparable throughout the chapter.
export default function BoroughProfiles({ geo, meta, selected, onSelect }) {
  const [borough, setBorough] = useState('Old Toronto')
  const [showAll, setShowAll] = useState(false)
  const [visual, setVisual] = useState({ current: 'Old Toronto', previous: null })
  const heatVintage = heatVintageLabel(meta)

  useEffect(() => {
    setVisual((current) => (
      current.current === borough
        ? current
        : { current: borough, previous: current.current }
    ))
    const timeout = window.setTimeout(
      () => setVisual((current) => ({ ...current, previous: null })),
      500
    )
    return () => window.clearTimeout(timeout)
  }, [borough])

  const boroughs = useMemo(() => aggregateBoroughs(geo.features), [geo])
  const city = useMemo(() => aggregateCity(geo.features), [geo])

  const g = boroughs[borough]
  const profile = BOROUGH_PROFILES[borough]
  const layer = BOROUGH_LAYER

  const { colorFn, domain } = useMemo(() => {
    const feats = geo.features.filter((f) => boroughOf(f.properties) === borough)
    const inSet = new Set(feats.map((f) => f.properties.name))
    const scale = makeColorScale(layer, geo.features)
    return {
      colorFn: (p) => (inSet.has(p.name) ? scale.color(p[layer.key]) : OUTSIDE_FILL),
      domain: scale.domain,
    }
  }, [geo, borough, layer])

  const visibleBoroughs = showAll ? BOROUGH_ORDER : FEATURED_BOROUGHS

  const types = Object.entries(g.by_type)
  const typeTotal = types.reduce((s, [, v]) => s + v, 0) || 1

  return (
    <section className="boroughs" id="boroughs">
      <div className="section-head">
        <span className="section-num">A4</span>
        <div>
          <h2 className="section-title">How the citywide pattern becomes local</h2>
          <p className="section-lede">
            Citywide averages hide neighbourhoods with very different call demand, canopy, heat,
            and income. Start with two contrasting former municipalities, then open all six. Every
            tab keeps the same citywide colour scale so the comparison remains honest.
          </p>
        </div>
      </div>

      <div className="borough-tabs">
        <div className="borough-tab-list" role="tablist" aria-label="Former municipality">
          {visibleBoroughs.map((b) => (
            <button
              key={b}
              role="tab"
              aria-selected={borough === b}
              className={`layer-btn${borough === b ? ' is-on' : ''}`}
              onClick={() => setBorough(b)}
            >
              {b}
            </button>
          ))}
        </div>
        <button
          className="borough-more"
          onClick={() => {
            if (showAll && !FEATURED_BOROUGHS.includes(borough)) setBorough('Old Toronto')
            setShowAll(!showAll)
          }}
        >
          {showAll ? 'Show featured contrast' : 'Compare all six'}
        </button>
      </div>

      <div className="borough-grid">
        <div className="borough-character-column">
          <div className="borough-character-stage">
            {visual.previous && (
              <MunicipalityCharacter borough={visual.previous} departing />
            )}
            <MunicipalityCharacter key={visual.current} borough={visual.current} />
          </div>
        </div>

        <div className="borough-map">
          <ChoroplethMap
            geo={geo}
            colorFn={colorFn}
            selected={selected}
            onSelect={onSelect}
          />
          <Legend layer={layer} domain={domain} />
          <p className="borough-map-note">
            Shared citywide scale; neighbourhoods outside {borough} are dimmed. Click a mapped
            neighbourhood for its full profile.
          </p>
        </div>

        <div className="borough-profile">
          <div className="borough-kicker mono">
            {g.n} neighbourhoods · {num(g.population)} residents · {pct(g.pop_share)} of Toronto
          </div>
          <h3 className="borough-name">{borough}</h3>
          <p className="borough-tagline">{profile.tagline}</p>

          <div className="borough-hero">
            <div className="borough-hero-num mono">{Math.round(g.crisis_per1k)}</div>
            <div className="borough-hero-cap">
              crisis calls / 1,000 residents · 2014–2024
              <br />
              <strong>{pct(g.crisis_share)}</strong> of the city&apos;s calls from{' '}
              <strong>{pct(g.pop_share)}</strong> of its people
            </div>
          </div>

          <div className="borough-stats">
            <CompareRow label="Crisis / 1k · 2014–24" value={g.crisis_per1k} city={city.crisis_per1k} fmt={(v) => num(v)} higherWorse />
            <CompareRow label="Tree canopy · 2018" value={g.treecanopy} city={city.treecanopy} fmt={(v) => pct(v)} higherWorse={false} />
            <CompareRow label={`Summer heat · ${heatVintage}`} value={g.temp_diff} city={city.temp_diff} fmt={(v) => signed(v) + '°C'} higherWorse />
            <CompareRow label="Low income · 2021" value={g.pctpov} city={city.pctpov} fmt={(v) => pct(v)} higherWorse />
            <CompareRow label="Tree Equity · 2024" value={g.tes} city={city.tes} fmt={(v) => (v == null ? 'N/A' : Math.round(v))} higherWorse={false} />
          </div>

          <div className="borough-block">
            <div className="panel-block-h">Calls per year · 2014 → 2024</div>
            <Sparkline values={g.yearly} />
          </div>

          <div className="borough-block">
            <div className="panel-block-h">Call mix · {num(g.crisis_total)} calls</div>
            <div className="mix-bar">
              {types.map(([t, v]) => (
                <span key={t} style={{ width: `${(v / typeTotal) * 100}%`, background: TYPE_COLORS[t] || '#888' }} title={`${t}: ${num(v)}`} />
              ))}
            </div>
            <div className="mix-legend">
              {types.map(([t, v]) => (
                <span key={t}>
                  <i style={{ background: TYPE_COLORS[t] || '#888' }} />
                  {t} {Math.round((v / typeTotal) * 100)}%
                </span>
              ))}
            </div>
          </div>

          <p className="borough-issue">{profile.issues}</p>

          <div className="borough-block">
            <div className="panel-block-h">Pressure points</div>
            <ul className="borough-hotspots">
              {g.hotspots.map((h) => (
                <li key={h.name}>
                  <button className="hotspot-btn" onClick={() => onSelect(h.name)}>
                    <span>{h.name}</span>
                    <span className="mono">{Math.round(h.crisis_per1k)} / 1k →</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function MunicipalityCharacter({ borough, departing = false }) {
  const visual = BOROUGH_VISUALS[borough]
  const src = `${import.meta.env.BASE_URL}img/${encodeURIComponent(visual.image)}`

  return (
    <figure
      className={`borough-character ${departing ? 'is-departing' : 'is-arriving'}`}
      aria-hidden={departing || undefined}
    >
      <figcaption className="borough-vignette">
        <span>Illustrative scene - not resident testimony</span>
        <blockquote>{visual.quote.replace(/[“”]/g, '')}</blockquote>
      </figcaption>
      <div className={`borough-character-art ${borough.toLowerCase().replaceAll(' ', '-')}${borough === 'Old Toronto' || borough === 'East York' ? ' has-ground-shadow' : ''}`}>
        <img
          src={src}
          alt={departing ? '' : `Illustrated character representing ${borough}`}
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
      </div>
    </figure>
  )
}
