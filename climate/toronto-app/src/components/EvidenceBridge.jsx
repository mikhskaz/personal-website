import { useMemo } from 'react'

const RESEARCH = [
  {
    type: 'Longitudinal cohort',
    title: 'The canopy association can persist beyond income',
    cite: 'Astell-Burt & Feng · 2019',
    body:
      'Among 46,786 Australian adults followed for about six years, at least 30% nearby tree canopy was associated with lower odds of developing psychological distress after adjustment for income and other demographics.',
    caution:
      'Observational evidence; it did not find the same pattern for physician-reported depression or anxiety.',
    links: [
      {
        label: 'Read the study',
        href: 'https://pubmed.ncbi.nlm.nih.gov/31348510/',
      },
    ],
  },
  {
    type: 'Randomized intervention',
    title: 'Changing a place can change some reported symptoms',
    cite: 'South et al. · 2018',
    body:
      'A Philadelphia trial randomly assigned blighted vacant lots to greening, cleanup, or no intervention. Residents near greened lots reported less depression and worthlessness, with a larger depression result in below-poverty neighbourhoods.',
    caution:
      'The intervention combined grass, a few trees, fencing, cleanup, and maintenance; overall poor mental health narrowly missed statistical significance.',
    links: [
      {
        label: 'Read the study',
        href: 'https://doi.org/10.1001/jamanetworkopen.2018.0298',
      },
    ],
  },
  {
    type: 'Systematic review',
    title: 'Several pathways are plausible, but not settled',
    cite: 'Callaghan et al. · 2021',
    body:
      'Across 26 observational studies, stress reduction, physical activity, social connection, and mitigation of environmental harms emerged as possible pathways between green space and mental well-being.',
    caution:
      'Evidence for diagnosed mental illness was equivocal, and the authors called for more longitudinal and experimental work.',
    links: [
      {
        label: 'Read the review',
        href: 'https://pubmed.ncbi.nlm.nih.gov/33933490/',
      },
    ],
  },
  {
    type: 'Repeated cross-section',
    title: 'The study in the feedback supports caution',
    cite: 'Zhang et al. · 2022',
    body:
      'Across 15 Beijing residential areas, more canopy was associated with lower adjusted odds of psychological distress before and during the COVID-19 period.',
    caution:
      'It used different samples across two waves and lacked individual income, occupation, and physical-health data. It cannot isolate a tree effect.',
    links: [
      {
        label: 'Open-access article',
        href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8603199/',
      },
      {
        label: 'Publisher page',
        href: 'https://www.sciencedirect.com/science/article/pii/S0013935121010896',
      },
    ],
  },
]

const EXPLAINERS = [
  {
    label: 'Canadian Psychological Association',
    href: 'https://cpa.ca/psychology-works-fact-sheet-benefits-of-nature-exposure/',
  },
  {
    label: 'Tree Canada research explainer',
    href: 'https://treecanada.ca/article/the-mental-health-benefits-of-urban-trees-a-deep-dive-into-recent-research/',
  },
  {
    label: 'Canopy public explainer',
    href: 'https://canopy.org/blog/impacts-of-trees-on-mental-health/',
  },
]

function pearson(rows, a, b) {
  const pairs = rows
    .map((row) => [Number(row[a]), Number(row[b])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

  if (pairs.length < 3) return null
  const meanX = pairs.reduce((sum, [x]) => sum + x, 0) / pairs.length
  const meanY = pairs.reduce((sum, [, y]) => sum + y, 0) / pairs.length
  let numerator = 0
  let sumX = 0
  let sumY = 0

  pairs.forEach(([x, y]) => {
    const dx = x - meanX
    const dy = y - meanY
    numerator += dx * dy
    sumX += dx * dx
    sumY += dy * dy
  })

  const denominator = Math.sqrt(sumX * sumY)
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

export default function EvidenceBridge({ geo }) {
  const result = useMemo(() => {
    const rows = geo.features.map((feature) => feature.properties)
    const canopyCalls = pearson(rows, 'crisis_per1k', 'treecanopy')
    const incomeCalls = pearson(rows, 'crisis_per1k', 'pctpov')
    const canopyIncome = pearson(rows, 'treecanopy', 'pctpov')

    return {
      n: rows.length,
      canopyCalls,
      incomeCalls,
      canopyIncome,
      canopyAdjusted: partialCorrelation(canopyCalls, incomeCalls, canopyIncome),
      incomeAdjusted: partialCorrelation(incomeCalls, canopyCalls, canopyIncome),
    }
  }, [geo])

  return (
    <section className="evidence" id="meaning">
      <div className="section-head">
        <span className="section-num">A2</span>
        <div>
          <h2 className="section-title">Is it really trees or income?</h2>
          <p className="section-lede">
            In this dataset, income is the stronger signal. Canopy still carries information, but
            much less once the two are considered together. That changes the story from
            “trees prevent crises” to “structural conditions overlap, and green space may be one
            useful buffer.”
          </p>
        </div>
      </div>

      <div className="evidence-body">
        <div className="signal-grid" aria-label="Key neighbourhood correlations">
          <article className="signal-card signal-card--income">
            <span className="signal-kicker">Strongest pairwise signal</span>
            <strong className="signal-value">{formatR(result.incomeCalls)}</strong>
            <h3>Low-income share ↔ crisis-call rate</h3>
            <p>
              Neighbourhoods with a higher share of residents below the low-income measure tend to
              record more police-attended calls per resident.
            </p>
          </article>

          <article className="signal-card">
            <span className="signal-kicker">Smaller pairwise signal</span>
            <strong className="signal-value">{formatR(result.canopyCalls)}</strong>
            <h3>Tree canopy ↔ crisis-call rate</h3>
            <p>
              Neighbourhoods with more canopy tend to record fewer calls per resident, before
              considering how canopy and income overlap.
            </p>
          </article>

          <article className="signal-card signal-card--adjusted">
            <span className="signal-kicker">Basic income adjustment</span>
            <strong className="signal-value">{formatR(result.canopyAdjusted)}</strong>
            <h3>Canopy ↔ calls, holding low income constant</h3>
            <p>
              The canopy association roughly halves. This partial correlation controls one
              neighbourhood measure, not the many other differences between places.
            </p>
          </article>
        </div>

        <div className="evidence-answer">
          <div>
            <span className="evidence-label">Plain-language answer</span>
            <h3>Income explains part of the apparent canopy pattern.</h3>
          </div>
          <div>
            <p>
              Low-income share and canopy are themselves correlated (
              <strong>r = {formatR(result.canopyIncome)}</strong>). After controlling for canopy,
              low income remains more closely related to calls (
              <strong>partial r = {formatR(result.incomeAdjusted)}</strong>) than canopy does after
              controlling for low income.
            </p>
            <p>
              That does not make trees irrelevant. It means this map cannot rank trees against
              income supports, or show that changing canopy would change crisis calls.
            </p>
          </div>
        </div>

        <div className="relationship-panel">
          <div className="relationship-head">
            <div>
              <span className="evidence-label">How the variables may connect</span>
              <h3>Two pathways, two different kinds of evidence</h3>
            </div>
            <p>
              Solid links are observed in these {result.n} neighbourhoods. Dashed links are
              plausible mechanisms from prior research, not relationships tested by this app.
            </p>
          </div>

          <div className="relationship-paths" role="list">
            <div className="relationship-path" role="listitem">
              <div className="relation-node">
                <small>Observed condition</small>
                <strong>Low-income share</strong>
              </div>
              <div className="relation-arrow">
                <span>r = {formatR(result.incomeCalls)}</span>
                <i aria-hidden="true" />
              </div>
              <div className="relation-node relation-node--outcome">
                <small>Observed outcome</small>
                <strong>Recorded crisis-call rate</strong>
              </div>
            </div>

            <div className="relationship-path relationship-path--conceptual" role="listitem">
              <div className="relation-node">
                <small>Observed condition</small>
                <strong>Low-income share</strong>
              </div>
              <div className="relation-arrow">
                <span>travels with less canopy</span>
                <i aria-hidden="true" />
              </div>
              <div className="relation-node">
                <small>Place-based condition</small>
                <strong>Canopy &amp; green-space access</strong>
              </div>
              <div className="relation-arrow relation-arrow--dashed">
                <span>may support</span>
                <i aria-hidden="true" />
              </div>
              <div className="relation-node relation-node--mechanism">
                <small>Suggested pathways</small>
                <strong>Cooling · restoration · activity · connection</strong>
              </div>
              <div className="relation-arrow relation-arrow--dashed">
                <span>possible buffer</span>
                <i aria-hidden="true" />
              </div>
              <div className="relation-node">
                <small>Not measured here</small>
                <strong>Mental health &amp; well-being</strong>
              </div>
            </div>
          </div>

          <p className="relationship-note">
            Housing stability, service locations, population change, density, reporting, and police
            response may also shape recorded call rates. This conceptual map is not a fitted causal
            model.
          </p>
        </div>

        <div className="research-head">
          <div>
            <span className="evidence-label">What prior research adds</span>
            <h3>Green space is a plausible complement, not a proven cause of fewer calls</h3>
          </div>
          <p>
            These studies examine distress, symptoms, or well-being. None establishes that Toronto
            tree canopy reduced the police-attended events mapped here.
          </p>
        </div>

        <div className="research-grid">
          {RESEARCH.map((study) => (
            <article className="research-card" key={study.title}>
              <span className="research-type">{study.type}</span>
              <h3>{study.title}</h3>
              <span className="research-cite">{study.cite}</span>
              <p>{study.body}</p>
              <p className="research-caution">
                <strong>Read carefully:</strong> {study.caution}
              </p>
              <div className="research-links">
                {study.links.map((link) => (
                  <a
                    href={link.href}
                    key={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="explainer-links">
          <span>Accessible summaries, not additional primary studies</span>
          <div>
            {EXPLAINERS.map((link) => (
              <a href={link.href} key={link.href} target="_blank" rel="noreferrer">
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>

        <details className="evidence-method">
          <summary>Why the adjusted number still is not a causal estimate</summary>
          <div>
            <p>
              It is a partial Pearson correlation across neighbourhoods, controlling only for 2021
              low-income share. The small remaining canopy association is sensitive to reasonable
              modelling choices, including population weighting, influential downtown
              neighbourhoods, and additional demographic controls.
            </p>
            <p>
              The measures also use different time frames: 2018 canopy, 2021 demographics, and
              calls pooled across 2014–2024 using 2021 population. The app measures overhead
              canopy, not park access, quality, use, or individual nature exposure.
            </p>
            <p>
              “Low income” is the neighbourhood share below the 2021 after-tax Low Income Measure.
              It is not a measure of the full income distribution or income inequality.
            </p>
          </div>
        </details>
      </div>
    </section>
  )
}
