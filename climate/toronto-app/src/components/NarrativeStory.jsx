import { useMemo } from 'react'
import ChoroplethMap from './ChoroplethMap'
import Legend from './Legend'
import { useScrollSteps } from '../hooks/useScrollSteps'

const RESEARCH_BEATS = [
  {
    number: 'A',
    type: 'Longitudinal cohort',
    stat: '46,786 adults',
    title: 'The association can persist after accounting for income.',
    body:
      'Australian adults living near at least 30% tree canopy had lower odds of developing psychological distress over about six years, after adjustment for income and other demographics.',
    caution:
      'This was observational, and the same pattern did not appear for physician-reported depression or anxiety.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/31348510/',
    link: 'Astell-Burt & Feng, 2019',
  },
  {
    number: 'B',
    type: 'Randomized intervention',
    stat: 'A real-world test',
    title: 'Changing neglected places changed some reported symptoms.',
    body:
      'A Philadelphia trial found less reported depression and worthlessness near greened vacant lots than near untreated lots, with a larger depression result in below-poverty neighbourhoods.',
    caution:
      'The intervention bundled grass, a few trees, fencing, cleanup, and maintenance. It was not a test of trees alone.',
    href: 'https://doi.org/10.1001/jamanetworkopen.2018.0298',
    link: 'South et al., 2018',
  },
  {
    number: 'C',
    type: 'Systematic review',
    stat: '26 studies',
    title: 'The pathways are plausible. The clinical evidence is not settled.',
    body:
      'Stress recovery, activity, social connection, cooling, and reduced environmental harms may connect green space with mental well-being.',
    caution:
      'Evidence for diagnosed mental illness was equivocal; the authors called for stronger longitudinal and experimental studies.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/33933490/',
    link: 'Callaghan et al., 2021',
  },
]

function pearson(rows, firstKey, secondKey) {
  const pairs = rows
    .map((row) => [Number(row[firstKey]), Number(row[secondKey])])
    .filter(([first, second]) => Number.isFinite(first) && Number.isFinite(second))

  if (pairs.length < 3) return null
  const firstMean = pairs.reduce((sum, [value]) => sum + value, 0) / pairs.length
  const secondMean = pairs.reduce((sum, [, value]) => sum + value, 0) / pairs.length
  let numerator = 0
  let firstSquares = 0
  let secondSquares = 0

  pairs.forEach(([first, second]) => {
    const firstDelta = first - firstMean
    const secondDelta = second - secondMean
    numerator += firstDelta * secondDelta
    firstSquares += firstDelta ** 2
    secondSquares += secondDelta ** 2
  })

  const denominator = Math.sqrt(firstSquares * secondSquares)
  return denominator ? numerator / denominator : null
}

function partialCorrelation(rXY, rXZ, rYZ) {
  if (![rXY, rXZ, rYZ].every(Number.isFinite)) return null
  const denominator = Math.sqrt((1 - rXZ ** 2) * (1 - rYZ ** 2))
  return denominator ? (rXY - rXZ * rYZ) / denominator : null
}

function formatR(value) {
  if (!Number.isFinite(value)) return 'N/A'
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`
}

export default function NarrativeStory({ geo, scales, layers, meta, selected, onSelect }) {
  const topNames = meta.top_crisis.slice(0, 3).map((place) => place.name)
  const minutesPerCall = Math.round((24 * 60) / meta.per_day)
  const callTypes = Object.entries(meta.type_split)

  const relationships = useMemo(() => {
    const rows = geo.features.map((feature) => feature.properties)
    const canopyCalls = pearson(rows, 'treecanopy', 'crisis_per1k')
    const incomeCalls = pearson(rows, 'pctpov', 'crisis_per1k')
    const canopyIncome = pearson(rows, 'treecanopy', 'pctpov')

    return {
      canopyCalls,
      incomeCalls,
      canopyIncome,
      adjustedCanopy: partialCorrelation(canopyCalls, canopyIncome, incomeCalls),
    }
  }, [geo])

  const steps = [
    {
      chapter: '02',
      metric: 'crisis_per1k',
      eyebrow: 'A city under pressure',
      title: 'The pressure is not evenly shared.',
      body: `${topNames.join(', ')} have the highest recorded call rates. Central service locations, reporting, population denominators, and real need can all shape this geography.`,
      stat: meta.pic_total.toLocaleString(),
      statLabel: 'police-attended calls',
      highlightTop: true,
      tone: 'calls',
    },
    {
      chapter: '03',
      metric: 'temp_diff',
      eyebrow: 'The first suspect',
      title: 'Heat looks like an answer. It isn’t.',
      body: `Hotter summer surfaces and higher call rates move together only weakly. Similar-looking maps are not enough: across neighbourhoods, the relationship is r = ${formatR(meta.correlations['Heat extremity'])}.`,
      stat: formatR(meta.correlations['Heat extremity']),
      statLabel: 'heat ↔ call rate',
      tone: 'heat',
    },
    {
      chapter: '04',
      metric: 'treecanopy',
      eyebrow: 'Then, the trees',
      title: 'Thinner canopy overlaps more clearly.',
      body: `Neighbourhoods with more 2018 tree cover tend to have fewer 2014–2024 calls per resident. The association is moderate, not a diagnosis, mechanism, or promise that planting will reduce calls.`,
      stat: formatR(relationships.canopyCalls),
      statLabel: 'canopy ↔ call rate',
      tone: 'canopy',
    },
    {
      chapter: '05',
      metric: 'pctpov',
      eyebrow: 'The stronger signal',
      title: 'Income changes the story.',
      body: `The share of residents below the low-income measure is more closely related to the recorded call rate than canopy is. This is neighbourhood low income, not a measure of income inequality.`,
      stat: formatR(relationships.incomeCalls),
      statLabel: 'low income ↔ call rate',
      tone: 'income',
    },
    {
      chapter: '06',
      metric: 'pctpov',
      eyebrow: 'The central turn',
      title: 'So, is it really trees or income?',
      body: `Income explains part of the apparent canopy pattern. Holding low income constant in a basic partial correlation, the canopy relationship falls from ${formatR(relationships.canopyCalls)} to ${formatR(relationships.adjustedCanopy)}. The map cannot rank trees against income policy.`,
      stat: formatR(relationships.adjustedCanopy),
      statLabel: 'canopy ↔ calls, adjusting for low income',
      tone: 'verdict',
      verdict: true,
    },
  ]

  const { active, setRef } = useScrollSteps(steps.length)
  const step = steps[active]
  const layer = layers[step.metric]
  const scale = scales[step.metric]
  const colorFn = (properties) => scale.color(properties[layer.key])

  return (
    <main className="narrative-story">
      <section className="story-measure" id="measure">
        <div className="story-smoke story-smoke--left" aria-hidden="true" />
        <div className="story-smoke story-smoke--right" aria-hidden="true" />

        <div className="story-measure-inner">
          <div className="story-chapter-mark">
            <span>01</span>
            <p>What are we counting?</p>
          </div>

          <h2>
            A call is a record of response.
            <em>It is not a diagnosis.</em>
          </h2>

          <div className="story-measure-grid">
            <div className="story-total">
              <strong>{meta.pic_total.toLocaleString()}</strong>
              <span>police-attended crisis calls · {meta.period}</span>
            </div>
            <div className="story-measure-copy">
              <p>
                Each record marks a reported crisis and the neighbourhood where police attended.
                Several callers can report one event, and one person can appear more than once.
              </p>
              <p>
                Read the map as demand placed on a response system, not a census of suffering and
                not a count of unique people.
              </p>
            </div>
            <div className="story-tempo">
              <span>That is about</span>
              <strong>{meta.per_day}</strong>
              <p>calls a day</p>
              <small>roughly one every {minutesPerCall} minutes</small>
            </div>
          </div>

          <div className="story-call-mix" aria-label="Call categories">
            {callTypes.map(([type, value]) => (
              <div key={type}>
                <span>{type}</span>
                <strong>{value.toLocaleString()}</strong>
                <i style={{ '--share': `${(value / meta.pic_total) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="story-boundary">
            The separate Mental Health Act file contains {meta.mha_total.toLocaleString()}{' '}
            apprehension records. It is not added to this call total.
          </p>
        </div>
      </section>

      <section className={`story-map story-map--${step.tone}`} id="patterns">
        <div className="story-map-intro">
          <span>02–06 · Follow the map</span>
          <h2>
            Four layers.
            <em>One question gets harder.</em>
          </h2>
          <p>
            The same city changes meaning as each condition appears. Scroll to test the first
            explanation, then the next.
          </p>
        </div>

        <div className="story-map-scrolly">
          <div className="story-map-visual">
            <div className="story-map-sticky">
              <div className="story-map-frame">
                <div className="story-map-number" aria-live="polite">
                  <strong>{step.stat}</strong>
                  <span>{step.statLabel}</span>
                </div>
                <p className="story-map-click-hint">
                  Click a neighbourhood for its profile
                </p>
                <ChoroplethMap
                  geo={geo}
                  colorFn={colorFn}
                  highlightTop={step.highlightTop ? topNames : []}
                  selected={selected}
                  onSelect={onSelect}
                />
                <Legend layer={layer} domain={scale.domain} />

                <div className={`story-relationship${step.verdict ? ' is-visible' : ''}`}>
                  <div>
                    <span>Low-income share</span>
                    <strong>{formatR(relationships.incomeCalls)}</strong>
                    <small>with call rate</small>
                  </div>
                  <i aria-hidden="true" />
                  <div>
                    <span>Tree canopy</span>
                    <strong>{formatR(relationships.canopyCalls)}</strong>
                    <small>before adjustment</small>
                  </div>
                  <i aria-hidden="true" />
                  <div>
                    <span>Tree canopy</span>
                    <strong>{formatR(relationships.adjustedCanopy)}</strong>
                    <small>holding low income constant</small>
                  </div>
                </div>
              </div>
              <p className="story-map-instruction">Scroll to change the evidence</p>
            </div>
          </div>

          <div className="story-map-steps">
            {steps.map((item, index) => (
              <article
                className={`story-map-step story-map-step--${item.tone}${
                  index === active ? ' is-active' : ''
                }`}
                key={`${item.title}-${index}`}
                ref={setRef(index)}
              >
                <div>
                  <span>
                    {item.chapter} / {item.eyebrow}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="story-evidence" id="evidence">
        <div className="story-evidence-opening">
          <div className="evidence-rings" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <span>07 · What trees can still do</span>
            <h2>
              Trees are not a cure.
              <em>They may still be part of care.</em>
            </h2>
            <p>
              Toronto’s correlations cannot show that trees prevent crisis calls. The wider
              literature supports a narrower claim: accessible, maintained green space may help
              well-being through several pathways, alongside material and clinical supports.
            </p>
          </div>
        </div>

        <div className="story-research-beats">
          {RESEARCH_BEATS.map((beat) => (
            <article key={beat.number}>
              <div className="research-beat-number">{beat.number}</div>
              <div className="research-beat-stat">
                <span>{beat.type}</span>
                <strong>{beat.stat}</strong>
              </div>
              <div className="research-beat-copy">
                <h3>{beat.title}</h3>
                <p>{beat.body}</p>
                <p className="research-beat-caution">
                  <strong>Limit:</strong> {beat.caution}
                </p>
                <a href={beat.href} target="_blank" rel="noreferrer">
                  {beat.link} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="story-synthesis">
          <span>The honest conclusion</span>
          <h2>Not trees instead of income.</h2>
          <p>
            Income security, stable housing, mental-health care, and crisis services remain
            fundamental. Green space is a practical, complementary form of public-health
            infrastructure, not a substitute and not a claim that planting trees will prevent a
            crisis.
          </p>
          <div className="story-synthesis-path">
            <span>Observed in Toronto</span>
            <i />
            <span>Informed by research</span>
            <i />
            <strong>Act without overstating</strong>
          </div>
        </div>
      </section>
    </main>
  )
}
