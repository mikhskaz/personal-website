import ChoroplethMap from './ChoroplethMap'
import Legend from './Legend'
import { LAYERS } from '../lib/colors'
import { useScrollSteps } from '../hooks/useScrollSteps'

// The guided narrative (storyboard Figs. 1 & 6). A sticky map recolours as the
// reader scrolls through each step; the text pulls real numbers from meta.json.
export default function ScrollyStory({ geo, scales, meta, selected, onSelect }) {
  const r = meta.correlations
  const top = meta.top_crisis.slice(0, 3).map((d) => d.name)

  const steps = [
    {
      metric: 'crisis_per1k',
      kicker: 'The pattern',
      title: 'A crisis map of Toronto',
      body: `Over ${meta.period}, Toronto Police logged ${meta.crisis_total.toLocaleString()} mental-health crisis events — about ${meta.per_day} a day. Mapped per resident, they are anything but evenly spread.`,
    },
    {
      metric: 'tes',
      kicker: 'The official lens',
      title: 'The city has a “Tree Equity Score”',
      body: `An off-the-shelf composite rates each neighbourhood 0–100 on tree fairness. Downtown scores 90–100 — apparently doing well. But this single score barely moves with the crisis map (r = ${r['Tree Equity Score']}).`,
    },
    {
      metric: 'treecanopy',
      kicker: 'The reality',
      title: 'Yet the actual canopy is thin',
      body: `Look at raw tree cover instead and downtown flips to bare — 5–18% canopy. Across all 158 neighbourhoods, less canopy tracks with more crisis (r = ${r['Tree canopy %']}).`,
    },
    {
      metric: 'temp_diff',
      kicker: 'The heat',
      title: 'And the heat lands unevenly',
      body: `Inner-city blocks run several degrees hotter than the leafy, lake-cooled edges. Hotter neighbourhoods carry a modestly heavier crisis load (r = ${r['Heat extremity']}).`,
    },
    {
      metric: 'crisis_per1k',
      kicker: 'The overlap',
      title: 'This is where crisis concentrates',
      body: `The hottest, barest, downtown core — ${top.join(', ')} — is exactly where calls pile up. The three lenses point at the same ground.`,
      highlightTop: true,
    },
    {
      metric: 'pctpov',
      kicker: 'The driver',
      title: 'But poverty tracks it most of all',
      body: `Low income is the single strongest correlate (r = ${r['Low-income %']}) — stronger than canopy or heat. The honest takeaway: target the gap, not the score. Plant and cool where canopy is thin and income is low.`,
    },
  ]

  const { active, setRef } = useScrollSteps(steps.length)
  const step = steps[active]
  const layer = LAYERS[step.metric]
  const scale = scales[step.metric]
  const colorFn = (p) => scale.color(p[layer.key])

  return (
    <section className="scrolly" id="story">
      <div className="scrolly-graphic">
        <div className="scrolly-sticky">
          <ChoroplethMap
            geo={geo}
            colorFn={colorFn}
            selected={selected}
            onSelect={onSelect}
            highlightTop={step.highlightTop ? top : []}
          />
          <Legend layer={layer} domain={scale.domain} />
          <p className="scrolly-hint">Click any neighbourhood for its full profile →</p>
        </div>
      </div>

      <div className="scrolly-steps">
        {steps.map((s, i) => (
          <div key={i} className={`step${i === active ? ' is-active' : ''}`} ref={setRef(i)}>
            <span className="step-kicker">{s.kicker}</span>
            <h2 className="step-title">{s.title}</h2>
            <p className="step-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
