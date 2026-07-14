import { useEffect, useRef, useState } from 'react'

// Audio lives in public/audio and is served under the app's base path
// (/ in dev, /crisisandcanopy/ in the built sub-app).
const RING_SRC = import.meta.env.BASE_URL + 'audio/oldphonering.mp3'
const PICKUP_SRC = import.meta.env.BASE_URL + 'audio/oldphonepickup.mp3'
const BASE_IMG = import.meta.env.BASE_URL + 'img/phonebase.png'
const HANDSET_IMG = import.meta.env.BASE_URL + 'img/phonehandset.png'

const RING_GAIN = 0.26 // the ring file is hot; keep it well under full volume
const PICKUP_GAIN = 0.7
const PICKUP_MAX = 3 // seconds: play only the first slice of the pickup clip

// Full-screen "answer the call" gate shown before the story.
// The rotary phone rings (handset vibrates + ring audio); clicking the
// receiver plays the pickup clip and reveals the hero underneath.
export default function PhoneIntro({ onAnswer, onDone }) {
  const [leaving, setLeaving] = useState(false)
  const ringRef = useRef(null)
  const pickupRef = useRef(null)
  const answeredRef = useRef(false)

  useEffect(() => {
    const ring = new Audio(RING_SRC)
    ring.loop = true
    ring.volume = RING_GAIN
    ring.preload = 'auto'
    ringRef.current = ring

    const pickup = new Audio(PICKUP_SRC)
    pickup.volume = PICKUP_GAIN
    pickup.preload = 'auto'
    pickupRef.current = pickup
    const capPickup = () => {
      if (pickup.currentTime >= PICKUP_MAX) pickup.pause()
    }
    pickup.addEventListener('timeupdate', capPickup)

    const startRing = () => {
      if (answeredRef.current) return
      const p = ring.play()
      if (p && p.catch) p.catch(() => {}) // autoplay may be blocked until a gesture
    }
    startRing()

    // Browsers block audio until the first user gesture. If a gesture lands
    // anywhere that is not the receiver, start the ring; answering the phone
    // is handled separately.
    const unlock = (e) => {
      if (answeredRef.current) return
      if (e?.target?.closest?.('.phone-3d')) return
      if (ring.paused) startRing()
    }
    const unlockKey = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') unlock(e)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('wheel', unlock, { passive: true })
    window.addEventListener('keydown', unlockKey)

    // Hold the page at the top and forbid scrolling past the ringing phone.
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    return () => {
      pickup.removeEventListener('timeupdate', capPickup)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('wheel', unlock)
      window.removeEventListener('keydown', unlockKey)
      ring.pause()
      document.documentElement.style.overflow = prevOverflow
    }
  }, [])

  const enter = (withSound = true) => {
    if (answeredRef.current) return
    answeredRef.current = true

    const ring = ringRef.current
    if (ring) {
      ring.pause()
      ring.currentTime = 0
    }

    const pickup = pickupRef.current
    if (pickup && withSound) {
      try {
        pickup.currentTime = 0
        const p = pickup.play()
        if (p && p.catch) p.catch(() => {})
      } catch {
        /* ignore */
      }
      // Belt-and-braces stop in case timeupdate does not fire in time.
      setTimeout(() => {
        try {
          pickup.pause()
        } catch {
          /* ignore */
        }
      }, PICKUP_MAX * 1000)
    }

    setLeaving(true)
    onAnswer?.() // hero begins entering as the phone lifts away
    setTimeout(() => onDone?.(), 850)
  }

  const answer = () => enter(true)
  const enterSilently = () => enter(false)

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      answer()
    }
  }

  return (
    <div className={`phone-intro${leaving ? ' is-leaving' : ''}`}>
      <div className="phone-stage">
        <div
          className="phone-3d"
          role="button"
          tabIndex={0}
          aria-label="Answer the call"
          onClick={answer}
          onKeyDown={onKeyDown}
        >
          <RotaryPhone />
        </div>

        <p className="phone-hint">Answer the phone to enter with sound</p>
        <button className="phone-skip" onClick={enterSilently}>
          Enter without audio
        </button>
      </div>
    </div>
  )
}

// Red rotary desk phone built from two transparent PNG renders: the base
// (dial + cradle) and the handset. The handset is placed to rest across the
// cradle and is the piece that rattles while the phone rings.
function RotaryPhone() {
  return (
    <div className="phone-figure">
      <div className="phone-glow" aria-hidden="true" />
      <img className="phone-base" src={BASE_IMG} alt="" draggable="false" />
      {/* vibration lines flick out while ringing */}
      <svg className="ring-lines" viewBox="0 0 150 100" aria-hidden="true" fill="none" stroke="#ff3d22" strokeWidth="2.4" strokeLinecap="round">
        <path className="ring-wave rw1" d="M30,20 A8,8 0 0 0 30,32" />
        <path className="ring-wave rw2" d="M24,15 A13,13 0 0 0 24,37" />
        <path className="ring-wave rw1" d="M120,14 A8,8 0 0 1 120,26" />
        <path className="ring-wave rw2" d="M126,9 A13,13 0 0 1 126,31" />
      </svg>
      {/* outer div carries the resting placement; inner img does the rattle */}
      <div className="phone-handset">
        <img className="handset" src={HANDSET_IMG} alt="" draggable="false" />
      </div>
    </div>
  )
}
