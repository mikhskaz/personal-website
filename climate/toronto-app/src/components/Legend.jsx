// Horizontal gradient legend for the active map layer.
export default function Legend({ layer, domain }) {
  const gradient = `linear-gradient(90deg, ${layer.ramp.join(', ')})`
  const isDiv = layer.type === 'diverging'

  return (
    <div className="legend">
      <div className="legend-head">
        <span className="legend-title">{layer.label}</span>
        <span className="legend-unit">{layer.unit}</span>
      </div>
      <div className="legend-bar" style={{ background: gradient }} />
      <div className="legend-scale">
        <span>{layer.fmt(domain[0])}</span>
        {isDiv && <span>{layer.fmt(0)}</span>}
        <span>{layer.fmt(domain[domain.length - 1])}</span>
      </div>
    </div>
  )
}
