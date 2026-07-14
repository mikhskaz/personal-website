// Small filled line chart used for yearly call-volume trends.
export default function Sparkline({ values, color = '#e2603f' }) {
  const w = 220
  const h = 46
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const x = (i) => (i / (values.length - 1)) * w
  const y = (v) => h - 4 - ((v - min) / (max - min || 1)) * (h - 8)
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none">
      <path d={area} fill={color} opacity="0.14" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3" fill={color} />
    </svg>
  )
}
