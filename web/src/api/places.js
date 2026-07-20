import client from './client'
import axios from 'axios'

// Geocode directly via Photon (OpenStreetMap) — no API key, no backend cold-start
async function photonAutocomplete(query) {
  const resp = await axios.get('https://photon.komoot.io/api/', {
    params: { q: query, limit: 6, lang: 'en' },
    headers: { 'User-Agent': 'RideCompare/1.0' },
    timeout: 8000,
  })
  const features = resp.data.features || []
  const results = []
  const seen = new Set()
  for (const feat of features) {
    const props = feat.properties || {}
    const coords = feat.geometry?.coordinates || []
    if (coords.length < 2) continue
    const [lng, lat] = coords
    const name = props.name || props.city || props.county || ''
    const city = props.city || props.county || ''
    const state = props.state || ''
    const country = props.country || ''
    const secondary = [city !== name ? city : '', state, country].filter(Boolean).join(', ')
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
    if (seen.has(key) || !name) continue
    seen.add(key)
    results.push({
      place_id: key,
      description: name + (secondary ? `, ${secondary}` : ''),
      main_text: name,
      secondary_text: secondary,
      latitude: lat,
      longitude: lng,
    })
  }
  return results
}

export const placesApi = {
  autocomplete: photonAutocomplete,

  savePlace: (place) =>
    client.post('/places/save', place).then(r => r.data),

  getSaved: () =>
    client.get('/places/saved').then(r => r.data),
}
