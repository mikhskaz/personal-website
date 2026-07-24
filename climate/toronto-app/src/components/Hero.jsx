import { useRef } from 'react'
import ChoroplethMap from './ChoroplethMap'
import { heatVintageLabel } from '../lib/colors'

const TYPE_COLORS = {
  'Person in Crisis': '#c9922e',
  'Suicide-related': '#7e8b86',
  Overdose: '#ff3d22',
}

export default function Hero({ geo, meta, scale, onStart, entered = true }) {
  const ref = useRef(null)
  const colorFn = (p) => scale.color(p.crisis_per1k)
  const typeMax = Math.max(...Object.values(meta.type_split))
  const heatVintage = heatVintageLabel(meta)

  return (
    <header className={`hero${entered ? ' is-entered' : ''}`} ref={ref}>
      <div className="hero-map" aria-hidden="true">
        <ChoroplethMap geo={geo} colorFn={colorFn} dim />
        <div className="hero-map-fade" />
      </div>

      <CanopyTree />

      <div className="hero-content">
        <p className="kicker">Toronto · {meta.period}</p>
        <h1 className="hero-title">
          Crisis <span className="amp">&amp;</span> Canopy
        </h1>
        <p className="hero-sub">
          Where do Toronto&apos;s police-attended mental-health crisis calls concentrate, and how do
          low income, 2018 tree canopy, and summer surface heat ({heatVintage}) overlap?
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-big">{meta.pic_total.toLocaleString()}</span>
            <span className="hero-cap">attended crisis calls across 11 years</span>
          </div>
          <div className="hero-stat">
            <span className="hero-big">≈{meta.per_day}</span>
            <span className="hero-cap">every single day</span>
          </div>
        </div>

        <div className="hero-types">
          {Object.entries(meta.type_split).map(([t, v]) => (
            <div className="hero-type" key={t}>
              <div className="hero-type-top">
                <span>{t}</span>
                <span className="mono">{v.toLocaleString()}</span>
              </div>
              <div className="hero-type-track">
                <span style={{ width: `${(v / typeMax) * 100}%`, background: TYPE_COLORS[t] }} />
              </div>
            </div>
          ))}
        </div>

        <button className="hero-cta" onClick={onStart}>
          Begin with the evidence <span aria-hidden="true">↓</span>
        </button>
      </div>
    </header>
  )
}

// Decorative canopy tree that slides in from the right on the hero entrance.
function CanopyTree() {
  return (
    <svg
      className="hero-tree"
      viewBox="0 0 320 460"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="treeTrunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4128" />
          <stop offset="1" stopColor="#2f2116" />
        </linearGradient>
        <radialGradient id="treeCrown" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#86c06a" />
          <stop offset="0.55" stopColor="#5c9a49" />
          <stop offset="1" stopColor="#33702f" />
        </radialGradient>
      </defs>

      {/* trunk + a couple of branches */}
      <path
        d="M150 460 C150 380 140 320 146 268 C129 250 120 214 138 196 M170 460 C170 380 180 322 174 268 C192 252 200 214 182 198 M160 300 C158 250 160 210 160 180"
        fill="none"
        stroke="url(#treeTrunk)"
        strokeWidth="20"
        strokeLinecap="round"
      />

      <g className="tree-crown">
        {/* soft underside shadow, then layered foliage for depth */}
        <ellipse cx="160" cy="205" rx="128" ry="104" fill="#2c5f28" opacity="0.9" />
        <ellipse cx="120" cy="170" rx="78" ry="70" fill="url(#treeCrown)" />
        <ellipse cx="205" cy="185" rx="92" ry="80" fill="url(#treeCrown)" />
        <ellipse cx="160" cy="120" rx="86" ry="72" fill="url(#treeCrown)" />
        <ellipse cx="112" cy="118" rx="52" ry="48" fill="#79b85f" />
        <ellipse cx="196" cy="128" rx="60" ry="52" fill="#69a957" />
        <ellipse cx="150" cy="92" rx="46" ry="40" fill="#8ccb6f" />
      </g>
    </svg>
  )
}
