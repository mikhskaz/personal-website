import { num, pct, signed, rankOf } from '../lib/format'
import { heatVintageLabel } from '../lib/colors'
import Sparkline from './Sparkline'

const TYPE_COLORS = {
  'Person in Crisis': '#c9a24b',
  'Suicide-related': '#8b9a93',
  Overdose: '#e2603f',
}
const AGE_ORDER = ['under 18', '18 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', '65 and older']

function StatRow({ label, value, formatted, median, higherWorse }) {
  const delta = value == null || median == null ? 0 : value - median
  const worse = higherWorse ? delta > 0 : delta < 0
  const arrow = delta === 0 ? '·' : delta > 0 ? '▲' : '▼'
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{formatted}</span>
      <span className={`stat-delta ${worse ? 'bad' : 'good'}`}>
        {arrow} <span className="muted">vs {label.startsWith('Tree Equity') || label.startsWith('Tree canopy') ? 'median' : 'med.'}</span>
      </span>
    </div>
  )
}

export default function NeighbourhoodPanel({ feature, allProps, medians, meta, onClose }) {
  if (!feature) return null
  const p = feature
  const heatVintage = heatVintageLabel(meta)
  const crisisVals = allProps.map((x) => x.crisis_per1k)
  const rank = rankOf(p.crisis_per1k, crisisVals, true)
  const total = crisisVals.filter((v) => v != null).length

  const types = Object.entries(p.by_type || {})
  const typeTotal = types.reduce((s, [, v]) => s + v, 0) || 1

  const ages = Object.entries(p.age || {}).sort(
    (a, b) => AGE_ORDER.indexOf(a[0]) - AGE_ORDER.indexOf(b[0])
  )
  const ageMax = Math.max(...ages.map(([, v]) => v), 1)
  const sexes = Object.entries(p.sex || {}).filter(([k]) => k === 'Male' || k === 'Female')
  const sexTotal = sexes.reduce((s, [, v]) => s + v, 0) || 1

  return (
    <aside className="panel" aria-live="polite">
      <button className="panel-close" onClick={onClose} aria-label="Close panel">
        ×
      </button>
      <div className="panel-eyebrow">Neighbourhood {p.code}</div>
      <h3 className="panel-title">{p.name}</h3>

      <div className="panel-hero">
        <div className="panel-hero-num">{p.crisis_per1k == null ? 'N/A' : Math.round(p.crisis_per1k)}</div>
        <div className="panel-hero-cap">
          crisis calls / 1,000 residents · 2014–2024
          <br />
          <strong>#{rank}</strong> of {total} neighbourhoods
        </div>
      </div>

      <div className="panel-block">
        <div className="panel-block-h">Environment &amp; equity</div>
        <StatRow label="Tree canopy · 2018" value={p.treecanopy} formatted={pct(p.treecanopy)} median={medians.treecanopy} higherWorse={false} />
        <StatRow label={`Summer heat · ${heatVintage}`} value={p.temp_diff} formatted={signed(p.temp_diff) + '°C'} median={medians.temp_diff} higherWorse={true} />
        <StatRow label="Low income · 2021 Census" value={p.pctpov} formatted={pct(p.pctpov)} median={medians.pctpov} higherWorse={true} />
        <StatRow label="Tree Equity · 2024 snapshot" value={p.tes} formatted={p.tes == null ? 'N/A' : Math.round(p.tes)} median={medians.tes} higherWorse={false} />
      </div>

      <div className="panel-block">
        <div className="panel-block-h">Call mix · {num(typeTotal)} calls</div>
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

      <div className="panel-block">
        <div className="panel-block-h">Calls per year · 2014 → 2024</div>
        <Sparkline values={p.yearly || []} />
      </div>

      {(ages.length > 0 || sexes.length > 0) && (
        <div className="panel-block">
          <div className="panel-block-h">Who · MHA apprehensions</div>
          <div className="who-grid">
            <div className="who-ages">
              {ages.map(([a, v]) => (
                <div key={a} className="who-age">
                  <span className="who-age-l">{a}</span>
                  <span className="who-age-bar">
                    <span style={{ width: `${(v / ageMax) * 100}%` }} />
                  </span>
                </div>
              ))}
            </div>
            <div className="who-sex">
              {sexes.map(([s, v]) => (
                <div key={s} className={`who-sex-chip ${s.toLowerCase()}`}>
                  <strong>{Math.round((v / sexTotal) * 100)}%</strong>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
