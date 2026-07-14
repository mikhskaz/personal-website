import {
  scaleSequential,
  scaleDiverging,
  interpolateRgbBasis,
  extent,
} from 'd3'

// Each map layer: a dark→accent ramp tuned for the dispatch theme, a formatter,
// and copy. `type` controls sequential vs diverging (heat can be negative).
export const DATA_VINTAGES = {
  crisis: '2014–2024',
  population: '2021 Census',
  treecanopy: '2018',
  temp_diff: 'summer 2022',
  demographics: '2021 Census',
  tes: '2024 snapshot',
}

export const LAYERS = {
  crisis_per1k: {
    key: 'crisis_per1k',
    label: 'Crisis intensity · 2014–2024',
    unit: 'calls / 1,000 residents',
    short: 'Crisis · 2014–24',
    ramp: ['#16181a', '#3a1410', '#7a1f12', '#c4321a', '#ff3d22', '#ffa23a'],
    type: 'sequential',
    fmt: (v) => Math.round(v).toLocaleString(),
    blurb: 'Attended Persons-in-Crisis calls from 2014–2024 per 1,000 residents, using 2021 Census population; MHA records are reported separately.',
  },
  treecanopy: {
    key: 'treecanopy',
    label: 'Tree canopy · 2018',
    unit: '% of land area',
    short: 'Canopy · 2018',
    ramp: ['#1b1f17', '#2c4022', '#436b34', '#5f9a4b', '#86c266', '#cde7ab'],
    type: 'sequential',
    fmt: (v) => (v * 100).toFixed(0) + '%',
    blurb: 'Share of land covered by tree canopy in the City of Toronto’s 2018 forest and land-cover data.',
  },
  temp_diff: {
    key: 'temp_diff',
    label: 'Summer heat · 2022',
    unit: '°C vs city average',
    short: 'Heat · 2022',
    ramp: ['#2f5e86', '#6f9ec0', '#b9cbd6', '#3a2a20', '#c0502e', '#f0a060', '#ffce8a'],
    type: 'diverging',
    fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(1) + '°C',
    blurb: 'Summer 2022 Landsat land-surface heat extremity relative to the urban-area average.',
  },
  pctpov: {
    key: 'pctpov',
    label: 'Low income · 2021 Census',
    unit: '% below LIM-AT',
    short: 'Low income · 2021',
    ramp: ['#221a10', '#4d3a16', '#866425', '#c39233', '#e6b54e', '#f6dd97'],
    type: 'sequential',
    fmt: (v) => (v * 100).toFixed(0) + '%',
    blurb: '2021 Census prevalence of low income (after-tax low-income measure).',
  },
  tes: {
    key: 'tes',
    label: 'Tree Equity Score · 2024 snapshot',
    unit: '0–100 composite',
    short: 'Equity · 2024',
    ramp: ['#14201f', '#1f413f', '#2e6764', '#3f928d', '#5fb4b0', '#aadfdc'],
    type: 'sequential',
    fmt: (v) => Math.round(v),
    blurb: 'The 2024 Tree Equity Score Analyzer snapshot; the composite combines inputs from different years, including 2018 canopy.',
  },
}

export const LAYER_ORDER = ['crisis_per1k', 'treecanopy', 'temp_diff', 'pctpov', 'tes']

export function heatVintageLabel(meta) {
  const years = meta?.lst?.mode === 'annual' ? meta.lst.years : []
  if (years?.length) return `${years[0]}–${years[years.length - 1]} mean`
  return String(meta?.vintages?.summer_heat || DATA_VINTAGES.temp_diff)
    .replace(/^summer\s+/i, '')
}

export function layersForMeta(meta) {
  const vintage = heatVintageLabel(meta)
  const years = meta?.lst?.mode === 'annual' ? meta.lst.years : []
  const shortVintage = years?.length
    ? `${years[0]}–${String(years[years.length - 1]).slice(-2)}`
    : vintage
  return {
    ...LAYERS,
    temp_diff: {
      ...LAYERS.temp_diff,
      label: `Summer heat · ${vintage}`,
      short: `Heat · ${shortVintage}`,
      blurb: years?.length
        ? `Mean annual June–August Landsat surface-heat anomaly for ${years[0]}–${years[years.length - 1]}.`
        : LAYERS.temp_diff.blurb,
    },
  }
}

// Numeric fields selectable as scatter-plot axes in the Correlation Studio.
export const AXIS_FIELDS = [
  { key: 'crisis_per1k', label: 'Crisis calls per 1,000 (2014–2024)', fmt: (v) => Math.round(v) },
  { key: 'person_in_crisis_per1k', label: 'Person in Crisis per 1,000 (2014–2024)', fmt: (v) => v.toFixed(1) },
  { key: 'suicide_related_per1k', label: 'Suicide-related per 1,000 (2014–2024)', fmt: (v) => v.toFixed(1) },
  { key: 'overdose_per1k', label: 'Overdose per 1,000 (2014–2024)', fmt: (v) => v.toFixed(1) },
  { key: 'treecanopy', label: 'Tree canopy % (2018)', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'temp_diff', label: 'Summer heat °C (2022)', fmt: (v) => v.toFixed(1) },
  { key: 'air_temp', label: 'Open-Meteo air temperature', fmt: (v) => v.toFixed(1) + '°C' },
  { key: 'pctpov', label: 'Low income % (2021 Census)', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'pctpoc', label: 'People of colour % (2021 Census)', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'seniorperc', label: 'Seniors % (2021 Census)', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'tes', label: 'Tree Equity Score (2024 snapshot)', fmt: (v) => Math.round(v) },
]

const NULL_COLOR = '#2a241e'

// Build a value→color function for a layer over the supplied features.
export function makeColorScale(layer, features) {
  const vals = features
    .map((f) => f.properties[layer.key])
    .filter((v) => v != null && isFinite(v))
  const interp = interpolateRgbBasis(layer.ramp)

  if (layer.type === 'diverging') {
    const [lo, hi] = extent(vals)
    const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1
    const scale = scaleDiverging(interp).domain([-m, 0, m])
    return { color: (v) => (v == null || !isFinite(v) ? NULL_COLOR : scale(v)), domain: [-m, 0, m] }
  }

  const [lo, hi] = extent(vals)
  const scale = scaleSequential(interp).domain([lo, hi])
  return { color: (v) => (v == null || !isFinite(v) ? NULL_COLOR : scale(v)), domain: [lo, hi] }
}
