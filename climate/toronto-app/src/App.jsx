import { useMemo, useState } from 'react'
import { useData } from './lib/useData'
import { LAYER_ORDER, heatVintageLabel, layersForMeta, makeColorScale } from './lib/colors'
import { median } from './lib/format'
import Hero from './components/Hero'
import PhoneIntro from './components/PhoneIntro'
import ScrollyStory from './components/ScrollyStory'
import CrisisPrimer from './components/CrisisPrimer'
import MapExplorer from './components/MapExplorer'
import BoroughProfiles from './components/BoroughProfiles'
import CorrelationStudio from './components/CorrelationStudio'
import SeasonalPulse from './components/SeasonalPulse'
import NeighbourhoodPanel from './components/NeighbourhoodPanel'

export default function App() {
  const { loading, error, geo, seasonal, meta } = useData()
  const [selected, setSelected] = useState(null)
  // Intro gate: `answered` triggers the hero entrance; `showIntro` keeps the
  // overlay mounted through its exit animation.
  const [answered, setAnswered] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const layers = useMemo(() => layersForMeta(meta), [meta])

  const scales = useMemo(() => {
    if (!geo) return null
    const s = {}
    LAYER_ORDER.forEach((k) => (s[k] = makeColorScale(layers[k], geo.features)))
    return s
  }, [geo, layers])

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
      {showIntro && (
        <PhoneIntro onAnswer={() => setAnswered(true)} onDone={() => setShowIntro(false)} />
      )}
      <Hero
        geo={geo}
        meta={meta}
        scale={scales.crisis_per1k}
        entered={answered}
        onStart={() => document.getElementById('calls')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <CrisisPrimer meta={meta} />
      <ScrollyStory geo={geo} scales={scales} layers={layers} meta={meta} />
      <SeasonalPulse geo={geo} seasonal={seasonal} selected={selected} onSelect={setSelected} />
      <BoroughProfiles geo={geo} meta={meta} selected={selected} onSelect={setSelected} />
      <CorrelationStudio geo={geo} onSelect={setSelected} />
      <MapExplorer geo={geo} layers={layers} selected={selected} onSelect={setSelected} />

      <footer className="footer">
        <h2 className="footer-take">
          Target the gap, not the score.
        </h2>
        <p className="footer-body">
          Across Toronto's 158 neighbourhoods, crisis-call rates have their strongest measured
          association with low income (r = {meta.correlations['Low-income %']}). The association
          is moderate for thin tree canopy (r = {meta.correlations['Tree canopy %']}) and weak for
          heat (r = {meta.correlations['Heat extremity']}), while the composite Tree Equity Score
          barely moves with call rates (r = {meta.correlations['Tree Equity Score']}). These
          patterns do not prove causation. They argue for looking beneath a single score when
          deciding where more study, shade, cooling, and social support may be warranted.
        </p>
        <p className="footer-src">
          Data: Toronto Police Service open data (Persons in Crisis; Mental Health Act Apprehensions,
          {' '}{meta.period}), City of Toronto neighbourhood boundaries (158), and Tree Equity Score
          Analyzer. Open-Meteo ERA5-Land provides year-by-year monthly 2 m air-temperature context.
          Cross-sectional measures are not an 11-year series: canopy is from 2018,
          demographic measures are from the 2021 Census, the heat layer is {heatVintageLabel(meta)},
          and Tree Equity Score is the 2024 snapshot. Crisis rates use 2021 Census population as
          their denominator.
          Attended calls are generalized to the neighbourhood of occurrence; MHA
          apprehension records are reported separately. Correlations are descriptive, not causal.
          Built with React + D3.
        </p>
      </footer>

      {selectedFeature && (
        <NeighbourhoodPanel
          feature={selectedFeature}
          allProps={allProps}
          medians={medians}
          meta={meta}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
