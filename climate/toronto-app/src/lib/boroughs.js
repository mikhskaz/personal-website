// Toronto's six former municipalities ("boroughs", pre-1998 amalgamation) and
// which of the 158 neighbourhoods (HOOD_158 `code`) belong to each.
//
// The city's open data carries no former-municipality field, so this mapping is
// maintained by hand from the pre-amalgamation boundaries. Edge neighbourhoods
// that straddle an old boundary are assigned to the municipality holding most
// of their area / their community-council alignment (e.g. Bedford Park-Nortown
// → North York, Weston-Pelham Park and Lambton Baby Point → York).

export const BOROUGH_ORDER = [
  'Old Toronto',
  'North York',
  'Scarborough',
  'Etobicoke',
  'East York',
  'York',
]

const B = {
  OT: 'Old Toronto',
  NY: 'North York',
  SC: 'Scarborough',
  ET: 'Etobicoke',
  EY: 'East York',
  YK: 'York',
}

// code → borough
export const CODE_TO_BOROUGH = {
  // Etobicoke (22)
  1: B.ET, 2: B.ET, 3: B.ET, 4: B.ET, 5: B.ET, 6: B.ET, 7: B.ET, 8: B.ET,
  9: B.ET, 10: B.ET, 11: B.ET, 12: B.ET, 13: B.ET, 15: B.ET, 16: B.ET,
  18: B.ET, 19: B.ET, 20: B.ET, 158: B.ET, 159: B.ET, 160: B.ET, 161: B.ET,
  // North York (37)
  21: B.NY, 22: B.NY, 23: B.NY, 24: B.NY, 25: B.NY, 27: B.NY, 28: B.NY,
  29: B.NY, 30: B.NY, 31: B.NY, 32: B.NY, 33: B.NY, 34: B.NY, 35: B.NY,
  36: B.NY, 37: B.NY, 38: B.NY, 39: B.NY, 40: B.NY, 41: B.NY, 42: B.NY,
  43: B.NY, 44: B.NY, 46: B.NY, 47: B.NY, 48: B.NY, 49: B.NY, 50: B.NY,
  52: B.NY, 53: B.NY, 149: B.NY, 150: B.NY, 151: B.NY, 152: B.NY, 153: B.NY,
  154: B.NY, 155: B.NY,
  // East York (8)
  54: B.EY, 55: B.EY, 56: B.EY, 57: B.EY, 58: B.EY, 59: B.EY, 60: B.EY, 61: B.EY,
  // Old Toronto (50)
  62: B.OT, 63: B.OT, 64: B.OT, 65: B.OT, 66: B.OT, 67: B.OT, 68: B.OT,
  69: B.OT, 70: B.OT, 71: B.OT, 72: B.OT, 73: B.OT, 74: B.OT, 78: B.OT,
  79: B.OT, 80: B.OT, 81: B.OT, 83: B.OT, 84: B.OT, 85: B.OT, 86: B.OT,
  87: B.OT, 88: B.OT, 89: B.OT, 90: B.OT, 92: B.OT, 94: B.OT, 95: B.OT,
  96: B.OT, 97: B.OT, 98: B.OT, 99: B.OT, 100: B.OT, 101: B.OT, 102: B.OT,
  103: B.OT, 105: B.OT, 162: B.OT, 163: B.OT, 164: B.OT, 165: B.OT,
  166: B.OT, 167: B.OT, 168: B.OT, 169: B.OT, 170: B.OT, 171: B.OT,
  172: B.OT, 173: B.OT, 174: B.OT,
  // York (11)
  91: B.YK, 106: B.YK, 107: B.YK, 108: B.YK, 109: B.YK, 110: B.YK,
  111: B.YK, 112: B.YK, 113: B.YK, 114: B.YK, 115: B.YK,
  // Scarborough (30)
  116: B.SC, 118: B.SC, 119: B.SC, 120: B.SC, 121: B.SC, 122: B.SC,
  123: B.SC, 124: B.SC, 125: B.SC, 126: B.SC, 128: B.SC, 129: B.SC,
  130: B.SC, 133: B.SC, 134: B.SC, 135: B.SC, 136: B.SC, 138: B.SC,
  139: B.SC, 140: B.SC, 141: B.SC, 142: B.SC, 143: B.SC, 144: B.SC,
  145: B.SC, 146: B.SC, 147: B.SC, 148: B.SC, 156: B.SC, 157: B.SC,
}

export function boroughOf(p) {
  return CODE_TO_BOROUGH[Number(p.code)] || null
}

// Hand-written profile copy per borough. The numbers cited are computed from
// the same public/data/neighbourhoods.geojson this app renders; if the data
// pipeline is re-run with new inputs, re-check these claims.
export const BOROUGH_PROFILES = {
  'Old Toronto': {
    tagline: 'Three in ten Torontonians, and a much larger share of attended calls.',
    issues:
      'Old Toronto records the highest borough-level call rate, with the sharpest concentration around Downtown Yonge East, Moss Park, and the Yonge-Bay corridor. Those neighbourhoods also tend to have thin canopy and higher low-income shares, but the borough average cannot explain any individual call.',
  },
  'North York': {
    tagline: 'A low borough average that conceals higher-rate pockets.',
    issues:
      'North York records the lowest borough-level crisis-call rate. York University Heights and Oakdale-Beverley Heights sit well above that average, showing why a borough-wide number can flatten meaningful variation within a large part of the city.',
  },
  Scarborough: {
    tagline: 'A middle-range average with a different southwest pattern.',
    issues:
      'Scarborough sits near the middle of the borough comparison, while Oakridge, Kennedy Park, and West Hill record higher local rates. Its average Tree Equity Score is the lowest of the six former municipalities, another reminder to inspect the component measures and neighbourhoods separately.',
  },
  Etobicoke: {
    tagline: 'More canopy and cooler averages, but rising recorded call volume.',
    issues:
      'Etobicoke has comparatively high canopy, cooler summers, and a lower low-income share. Its attended-call volume nevertheless rose from 2014 to 2024, with higher-rate pockets along the Lakeshore and around West Humber-Clairville. Greener borough conditions do not make local demand uniform.',
  },
  'East York': {
    tagline: 'A leafy borough where a composite score still misses local variation.',
    issues:
      'East York is small and comparatively green, with a high average Tree Equity Score. Thorncliffe Park and Taylor-Massey differ from that borough-wide picture, illustrating how density, income, canopy, and recorded call demand can combine differently within the same former municipality.',
  },
  York: {
    tagline: 'Several measured pressures overlap, without proving a common cause.',
    issues:
      'York records hotter summers, thinner canopy, and the second-highest borough-level crisis-call rate. Much of the higher call pressure appears around the Weston-Mount Dennis corridor. The overlap identifies a place for closer investigation, not a causal diagnosis.',
  },
}

const mean = (vals) => {
  const v = vals.filter((x) => x != null && isFinite(x))
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null
}

// City-wide baseline used to contextualize each borough's numbers.
export function aggregateCity(features) {
  const ps = features.map((f) => f.properties)
  const population = ps.reduce((s, p) => s + (p.population || 0), 0)
  const crisis_total = ps.reduce((s, p) => s + (p.crisis_total || 0), 0)
  const povPairs = ps.filter((p) => p.pctpov != null && p.population)
  const povPop = povPairs.reduce((s, p) => s + p.population, 0)
  return {
    population,
    crisis_total,
    crisis_per1k: population ? (crisis_total / population) * 1000 : null,
    treecanopy: mean(ps.map((p) => p.treecanopy)),
    temp_diff: mean(ps.map((p) => p.temp_diff)),
    tes: mean(ps.map((p) => p.tes)),
    pctpov: povPop
      ? povPairs.reduce((s, p) => s + p.pctpov * p.population, 0) / povPop
      : null,
  }
}

// Aggregate the per-neighbourhood properties into one profile per borough.
// Sums for counts; population-weighted mean for poverty (a share of people);
// simple across-neighbourhood means for canopy / heat / TES (shares of land).
export function aggregateBoroughs(features) {
  const out = {}
  BOROUGH_ORDER.forEach((b) => (out[b] = { name: b, feats: [] }))
  features.forEach((f) => {
    const b = boroughOf(f.properties)
    if (b) out[b].feats.push(f.properties)
  })

  const cityPop = features.reduce((s, f) => s + (f.properties.population || 0), 0)
  const cityCrisis = features.reduce((s, f) => s + (f.properties.crisis_total || 0), 0)

  BOROUGH_ORDER.forEach((b) => {
    const g = out[b]
    const ps = g.feats
    g.n = ps.length
    g.population = ps.reduce((s, p) => s + (p.population || 0), 0)
    g.crisis_total = ps.reduce((s, p) => s + (p.crisis_total || 0), 0)
    g.crisis_per1k = g.population ? (g.crisis_total / g.population) * 1000 : null
    g.pop_share = cityPop ? g.population / cityPop : null
    g.crisis_share = cityCrisis ? g.crisis_total / cityCrisis : null
    g.treecanopy = mean(ps.map((p) => p.treecanopy))
    g.temp_diff = mean(ps.map((p) => p.temp_diff))
    g.tes = mean(ps.map((p) => p.tes))
    const povPairs = ps.filter((p) => p.pctpov != null && p.population)
    const povPop = povPairs.reduce((s, p) => s + p.population, 0)
    g.pctpov = povPop
      ? povPairs.reduce((s, p) => s + p.pctpov * p.population, 0) / povPop
      : null
    g.yearly = ps.reduce((acc, p) => {
      ;(p.yearly || []).forEach((v, i) => (acc[i] = (acc[i] || 0) + v))
      return acc
    }, [])
    g.by_type = ps.reduce((acc, p) => {
      Object.entries(p.by_type || {}).forEach(([k, v]) => (acc[k] = (acc[k] || 0) + v))
      return acc
    }, {})
    g.hotspots = [...ps]
      .filter((p) => p.crisis_per1k != null)
      .sort((a, b) => b.crisis_per1k - a.crisis_per1k)
      .slice(0, 3)
  })
  return out
}
