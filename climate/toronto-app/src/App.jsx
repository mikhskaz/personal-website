import { useMemo, useState } from 'react'
import { useData } from './lib/useData'
import { LAYER_ORDER, LAYERS, makeColorScale } from './lib/colors'
import { median } from './lib/format'
import Hero from './components/Hero'
import ScrollyStory from './components/ScrollyStory'
import MapExplorer from './components/MapExplorer'
import CorrelationStudio from './components/CorrelationStudio'
import SeasonalPulse from './components/SeasonalPulse'
import NeighbourhoodPanel from './components/NeighbourhoodPanel'

export default function App() {
  const { loading, error, geo, seasonal, meta } = useData()
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const scales = useMemo(() => {
    if (!geo) return null
    const s = {}
    LAYER_ORDER.forEach((k) => (s[k] = makeColorScale(LAYERS[k], geo.features)))
    return s
  }, [geo])

  const medians = useMemo(() => {
    if (!geo) return null
    const props = geo.features.map((f) => f.properties)
    const m = {}
    ;['treecanopy', 'temp_diff', 'pctpov', 'tes', 'crisis_per1k'].forEach(
      (k) => (m[k] = median(props.map((p) => p[k])))
    )
    return m
  }, [geo])

  const allProps = useMemo(() => (geo ? geo.features.map((f) => f.properties) : []), [geo])
  const selectedFeature = useMemo(
    () => (selected ? allProps.find((p) => p.name === selected) : null),
    [selected, allProps]
  )

  if (loading) return <div className="loader"><span className="loader-dot" /> Mapping Toronto…</div>
  if (error)
    return (
      <div className="loader">
        Couldn’t load data. Run <code>python build_app_data.py</code> first, then <code>npm run dev</code>.
      </div>
    )

  return (
    <div className="app">
      <Hero
        geo={geo}
        meta={meta}
        scale={scales.crisis_per1k}
        onStart={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <ScrollyStory geo={geo} scales={scales} meta={meta} selected={selected} onSelect={setSelected} />
      <MapExplorer geo={geo} selected={selected} onSelect={setSelected} hovered={hovered} onHover={setHovered} />
      <CorrelationStudio geo={geo} onSelect={setSelected} />
      <SeasonalPulse geo={geo} seasonal={seasonal} selected={selected} onSelect={setSelected} />

      <footer className="footer">
        <h2 className="footer-take">
          Target the gap, not the score.
        </h2>
        <p className="footer-body">
          Across Toronto’s 158 neighbourhoods, mental-health crises track most closely with poverty
          (r = {meta.correlations['Low-income %']}) and thin tree canopy (r = {meta.correlations['Tree canopy %']}),
          rise with summer heat, and peak in the warm months — while the off-the-shelf Tree Equity
          Score barely moves with them (r = {meta.correlations['Tree Equity Score']}). Cooling and
          canopy investment will do the most where canopy is thinnest and incomes are lowest.
        </p>
        <p className="footer-src">
          Data: Toronto Police Service open data (Persons in Crisis; Mental Health Act Apprehensions,
          {' '}{meta.period}), City of Toronto neighbourhood boundaries (158), and Tree Equity Score
          Analyzer. Crisis events geocoded to the neighbourhood of occurrence. Built with React + D3.
        </p>
      </footer>

      {selectedFeature && (
        <NeighbourhoodPanel
          feature={selectedFeature}
          allProps={allProps}
          medians={medians}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
