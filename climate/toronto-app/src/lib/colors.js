import {
  scaleSequential,
  scaleDiverging,
  interpolateRgbBasis,
  extent,
} from 'd3'

// Each map layer: a dark→accent ramp tuned for the dispatch theme, a formatter,
// and copy. `type` controls sequential vs diverging (heat can be negative).
export const LAYERS = {
  crisis_per1k: {
    key: 'crisis_per1k',
    label: 'Crisis intensity',
    unit: 'calls / 1,000 residents',
    short: 'Crisis',
    ramp: ['#16181a', '#3a1410', '#7a1f12', '#c4321a', '#ff3d22', '#ffa23a'],
    type: 'sequential',
    fmt: (v) => Math.round(v).toLocaleString(),
    blurb: 'Persons-in-Crisis calls + Mental Health Act apprehensions, per 1,000 residents (2014–2024).',
  },
  treecanopy: {
    key: 'treecanopy',
    label: 'Tree canopy',
    unit: '% of land area',
    short: 'Canopy',
    ramp: ['#1b1f17', '#2c4022', '#436b34', '#5f9a4b', '#86c266', '#cde7ab'],
    type: 'sequential',
    fmt: (v) => (v * 100).toFixed(0) + '%',
    blurb: 'Share of the neighbourhood covered by tree canopy.',
  },
  temp_diff: {
    key: 'temp_diff',
    label: 'Summer heat',
    unit: '°C vs city average',
    short: 'Heat',
    ramp: ['#2f5e86', '#6f9ec0', '#b9cbd6', '#3a2a20', '#c0502e', '#f0a060', '#ffce8a'],
    type: 'diverging',
    fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(1) + '°C',
    blurb: 'Land-surface heat extremity relative to the urban-area average.',
  },
  pctpov: {
    key: 'pctpov',
    label: 'Low income',
    unit: '% below LIM-AT',
    short: 'Poverty',
    ramp: ['#221a10', '#4d3a16', '#866425', '#c39233', '#e6b54e', '#f6dd97'],
    type: 'sequential',
    fmt: (v) => (v * 100).toFixed(0) + '%',
    blurb: 'Prevalence of low income (after-tax low-income measure).',
  },
  tes: {
    key: 'tes',
    label: 'Tree Equity Score',
    unit: '0–100 composite',
    short: 'Equity score',
    ramp: ['#14201f', '#1f413f', '#2e6764', '#3f928d', '#5fb4b0', '#aadfdc'],
    type: 'sequential',
    fmt: (v) => Math.round(v),
    blurb: "The off-the-shelf composite score. Watch how little it tracks the crisis map.",
  },
}

export const LAYER_ORDER = ['crisis_per1k', 'treecanopy', 'temp_diff', 'pctpov', 'tes']

// Numeric fields selectable as scatter-plot axes in the Correlation Studio.
export const AXIS_FIELDS = [
  { key: 'crisis_per1k', label: 'Crisis calls / 1k', fmt: (v) => Math.round(v) },
  { key: 'pic_per1k', label: 'PIC calls / 1k', fmt: (v) => Math.round(v) },
  { key: 'treecanopy', label: 'Tree canopy %', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'temp_diff', label: 'Summer heat (°C)', fmt: (v) => v.toFixed(1) },
  { key: 'pctpov', label: 'Low income %', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'pctpoc', label: 'People of colour %', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'seniorperc', label: 'Seniors %', fmt: (v) => (v * 100).toFixed(0) + '%' },
  { key: 'tes', label: 'Tree Equity Score', fmt: (v) => Math.round(v) },
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
