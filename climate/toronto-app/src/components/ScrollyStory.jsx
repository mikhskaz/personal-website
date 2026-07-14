import ChoroplethMap from './ChoroplethMap'
import Legend from './Legend'
import { heatVintageLabel } from '../lib/colors'
import { useScrollSteps } from '../hooks/useScrollSteps'

// The guided argument. One sticky map changes lens as the evidence builds;
// open-ended clicking is intentionally reserved for the explorer at the end.
export default function ScrollyStory({ geo, scales, layers, meta }) {
  const r = meta.correlations
  const top = meta.top_crisis.slice(0, 3).map((d) => d.name)
  const heatVintage = heatVintageLabel(meta)

  const steps = [
    {
      metric: 'crisis_per1k',
      kicker: 'Start with the calls',
      title: 'The pressure is not evenly shared',
      body: `Across ${meta.period}, Toronto Police attended ${meta.pic_total.toLocaleString()} mental-health crisis calls, about ${meta.per_day} a day. Per resident, a small group of central neighbourhoods carries a much higher recorded call rate than most of the city.`,
    },
    {
      metric: 'treecanopy',
      kicker: 'First association',
      title: 'Thinner canopy often overlaps',
      body: `The 2018 canopy snapshot shows that neighbourhoods with less tree cover tend to have higher 2014–2024 crisis-call rates (r = ${r['Tree canopy %']}). The relationship is moderate, not deterministic: canopy is one condition around a crisis, not an explanation by itself.`,
    },
    {
      metric: 'temp_diff',
      kicker: 'A weaker signal',
      title: 'Heat adds context',
      body: `Summer land surface heat (${heatVintage}) shows only a weak positive association with 2014–2024 crisis-call rates (r = ${r['Heat extremity']}). Several high-call neighbourhoods are hot, but the hottest places are not automatically the places with the most calls.`,
    },
    {
      metric: 'pctpov',
      kicker: 'The strongest measured link',
      title: 'Low income travels closest with calls',
      body: `Among the conditions compared here, 2021 Census low income has the strongest neighbourhood-level association with 2014–2024 crisis-call rates (r = ${r['Low-income %']}). That still does not prove that poverty caused any individual call.`,
    },
    {
      metric: 'tes',
      kicker: 'The composite lens',
      title: 'One score can hide different realities',
      body: `The 2024 Tree Equity Score snapshot combines conditions from different source years into one 0–100 measure. Here it is almost unrelated to 2014–2024 crisis-call rates (r = ${r['Tree Equity Score']}). A composite score cannot substitute for looking directly at canopy, heat, and income.`,
    },
    {
      metric: 'crisis_per1k',
      kicker: 'What the maps support',
      title: 'Target the gap, then investigate it',
      body: `${top.join(', ')} record the highest call rates. The maps identify places where pressures overlap and closer study may be warranted; they do not diagnose why a person experienced a crisis.`,
      highlightTop: true,
    },
  ]

  const { active, setRef } = useScrollSteps(steps.length)
  const step = steps[active]
  const layer = layers[step.metric]
  const scale = scales[step.metric]
  const colorFn = (p) => scale.color(p[layer.key])

  return (
    <section className="story-section" id="story">
      <div className="section-head">
        <span className="section-num">02</span>
        <div>
          <h2 className="section-title">Where the pressures overlap</h2>
          <p className="section-lede">
            Follow one map through six lenses. Each step adds evidence, then narrows what the data
            can honestly support.
          </p>
        </div>
      </div>

      <div className="scrolly">
        <div className="scrolly-graphic">
          <div className="scrolly-sticky">
            <ChoroplethMap
              geo={geo}
              colorFn={colorFn}
              highlightTop={step.highlightTop ? top : []}
            />
            <Legend layer={layer} domain={scale.domain} />
            <p className="scrolly-hint">Scroll to change the map lens</p>
          </div>
        </div>

        <div className="scrolly-steps">
          {steps.map((s, i) => (
            <div key={s.title} className={`step${i === active ? ' is-active' : ''}`} ref={setRef(i)}>
              <div className="step-card">
                <span className="step-kicker">{String(i + 1).padStart(2, '0')} / {s.kicker}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-body">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
