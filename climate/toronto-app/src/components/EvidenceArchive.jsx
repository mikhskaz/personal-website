import CrisisPrimer from './CrisisPrimer'
import EvidenceBridge from './EvidenceBridge'
import SeasonalPulse from './SeasonalPulse'
import BoroughProfiles from './BoroughProfiles'
import CorrelationStudio from './CorrelationStudio'
import MapExplorer from './MapExplorer'

export default function EvidenceArchive({
  open,
  onToggle,
  geo,
  seasonal,
  meta,
  layers,
  selected,
  onSelect,
}) {
  return (
    <details className="evidence-archive" id="explore" open={open} onToggle={onToggle}>
      <summary>
        <div>
          <span>Evidence desk · optional exploration</span>
          <h2>Explore the evidence and your neighbourhood</h2>
          <p>
            Open the detailed definitions, literature notes, seasonal patterns, borough profiles,
            correlation tools, and neighbourhood map.
          </p>
        </div>
        <i aria-hidden="true" />
      </summary>

      <div className="evidence-archive-content">
        <CrisisPrimer meta={meta} />
        <EvidenceBridge geo={geo} />
        <SeasonalPulse
          geo={geo}
          seasonal={seasonal}
          selected={selected}
          onSelect={onSelect}
        />
        <BoroughProfiles
          geo={geo}
          meta={meta}
          selected={selected}
          onSelect={onSelect}
        />
        <CorrelationStudio geo={geo} onSelect={onSelect} />
        <MapExplorer
          geo={geo}
          layers={layers}
          selected={selected}
          onSelect={onSelect}
        />
      </div>
    </details>
  )
}
