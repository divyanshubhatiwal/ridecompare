import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PICKUP_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const DEST_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

export default function MapPicker({ pickup, destination, onPickupChange, onDestChange, mode, onModeChange }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const polylineRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      if (mode === 'pickup') {
        onPickupChange({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
      } else {
        onDestChange({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
      }
    })

    mapInstanceRef.current = map
  }, [])

  // Update map click handler when mode changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    map.off('click')
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      if (mode === 'pickup') {
        onPickupChange({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
      } else {
        onDestChange({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
      }
    })
  }, [mode, onPickupChange, onDestChange])

  // Update pickup marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !pickup?.lat) return
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove()
    pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: PICKUP_ICON })
      .addTo(map)
      .bindPopup('Pickup')
    updatePolyline(map)
    map.setView([pickup.lat, pickup.lng], map.getZoom())
  }, [pickup?.lat, pickup?.lng])

  // Update destination marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !destination?.lat) return
    if (destMarkerRef.current) destMarkerRef.current.remove()
    destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: DEST_ICON })
      .addTo(map)
      .bindPopup('Destination')
    updatePolyline(map)
  }, [destination?.lat, destination?.lng])

  const updatePolyline = (map) => {
    if (polylineRef.current) polylineRef.current.remove()
    const p = pickupMarkerRef.current?.getLatLng()
    const d = destMarkerRef.current?.getLatLng()
    if (p && d) {
      polylineRef.current = L.polyline([p, d], { color: '#6366F1', weight: 3, dashArray: '6 6' }).addTo(map)
      map.fitBounds([p, d], { padding: [40, 40] })
    }
  }

  return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />
}
