import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

// Loads the three static data assets once and exposes them to the app.
export function useData() {
  const [state, setState] = useState({ loading: true, error: null, geo: null, seasonal: null, meta: null })

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch(`${BASE}data/neighbourhoods.geojson`).then((r) => r.json()),
      fetch(`${BASE}data/seasonal.json`).then((r) => r.json()),
      fetch(`${BASE}data/meta.json`).then((r) => r.json()),
    ])
      .then(([geo, seasonal, meta]) => {
        if (alive) setState({ loading: false, error: null, geo, seasonal, meta })
      })
      .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })))
    return () => {
      alive = false
    }
  }, [])

  return state
}
