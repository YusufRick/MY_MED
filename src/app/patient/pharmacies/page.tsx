'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { formatMYR } from '@/lib/utils'
import type { Pharmacy, PharmacyMedicationPrice } from '@/types'

export default function PharmaciesPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selected, setSelected] = useState<Pharmacy | null>(null)
  const [prices, setPrices] = useState<PharmacyMedicationPrice[]>([])
  const [pricesLoading, setPricesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(true)

  // Fetch prices and update the info window content
  const openPharmacyPopup = useCallback(async (pharmacy: Pharmacy, marker: any, InfoWindow: any) => {
    setSelected(pharmacy)
    setPricesLoading(true)
    setPrices([])

    // Show loading state in popup immediately
    if (infoWindowRef.current) infoWindowRef.current.close()
    const iw = new InfoWindow({ content: buildPopupHTML(pharmacy, [], true) })
    infoWindowRef.current = iw
    iw.open({ anchor: marker, map: mapInstanceRef.current })

    const data: PharmacyMedicationPrice[] = await fetch(`/api/pharmacies/${pharmacy.id}/prices`)
      .then(r => r.json())
      .catch(() => [])

    setPrices(data)
    setPricesLoading(false)

    // Re-render popup with actual prices
    iw.setContent(buildPopupHTML(pharmacy, data, false))
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocating(false)
        fetchNearby(coords.lat, coords.lng)
        initMap(coords)
      },
      () => {
        const fallback = { lat: 3.1390, lng: 101.6869 }
        setLocating(false)
        fetchNearby(fallback.lat, fallback.lng)
        initMap(fallback)
      }
    )
  }, [])

  async function fetchNearby(lat: number, lng: number) {
    const res = await fetch(`/api/pharmacies/nearby?lat=${lat}&lng=${lng}`)
    const data = await res.json()
    setPharmacies(data)
    setLoading(false)
  }

  async function initMap(center: { lat: number; lng: number }) {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
    })

    const { Map, InfoWindow } = await loader.importLibrary('maps') as any
    const { AdvancedMarkerElement, PinElement } = await loader.importLibrary('marker') as any

    if (!mapRef.current) return

    const map = new Map(mapRef.current, {
      center,
      zoom: 14,
      mapId: 'medconnect_map',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    })
    mapInstanceRef.current = map

    // User location pin (blue dot)
    const userDot = document.createElement('div')
    userDot.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)'
    new AdvancedMarkerElement({ map, position: center, content: userDot, title: 'Your location' })

    // Close info window on map click
    map.addListener('click', () => {
      if (infoWindowRef.current) infoWindowRef.current.close()
      setSelected(null)
    })

    // Fetch pharmacies and drop pins
    const nearby: Pharmacy[] = await fetch(`/api/pharmacies/nearby?lat=${center.lat}&lng=${center.lng}`)
      .then(r => r.json())
      .catch(() => [])

    setPharmacies(nearby)
    setLoading(false)

    nearby.forEach((pharmacy) => {
      // Pine-green custom pin
      const pin = new PinElement({
        background: '#1e6b4f',
        borderColor: '#185540',
        glyphColor: '#ffffff',
        glyph: '🏥',
        scale: 1.1,
      })

      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: pharmacy.lat, lng: pharmacy.lng },
        content: pin.element,
        title: pharmacy.name,
      })

      markersRef.current.push(marker)

      marker.addListener('click', () => {
        openPharmacyPopup(pharmacy, marker, InfoWindow)
      })
    })
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-screen overflow-hidden">

      {/* Left sidebar */}
      <div className="md:w-80 flex flex-col bg-white border-r border-pine-100 overflow-hidden shrink-0">
        <div className="p-4 border-b border-pine-100">
          <h1 className="font-display text-pine-900 text-lg font-bold">Hospital Pharmacies</h1>
          <p className="text-pine-400 text-xs mt-0.5">
            {locating ? 'Getting your location...' : loading ? 'Loading...' : `${pharmacies.length} found near you`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-pine-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-2">
                <div className="h-4 bg-pine-100 rounded w-3/4" />
                <div className="h-3 bg-pine-50 rounded w-1/2" />
              </div>
            ))
          ) : pharmacies.length === 0 ? (
            <div className="p-6 text-center text-pine-300 text-sm">No pharmacies found nearby.</div>
          ) : pharmacies.map(p => (
            <div
              key={p.id}
              className={`p-4 cursor-pointer hover:bg-pine-50 transition-colors duration-100 ${selected?.id === p.id ? 'bg-pine-50 border-l-2 border-pine-500' : ''}`}
              onClick={() => {
                // Pan map to pharmacy
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.panTo({ lat: p.lat, lng: p.lng })
                  mapInstanceRef.current.setZoom(15)
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-pine-900 font-medium text-sm truncate">{p.name}</p>
                  <p className="text-pine-400 text-xs mt-0.5 leading-snug">{p.address}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  {p.distance_km !== undefined && (
                    <p className="text-pine-500 text-xs font-medium">{p.distance_km.toFixed(1)} km</p>
                  )}
                  {p.has_locker && (
                    <span className="badge badge-green text-[10px]">Locker</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected pharmacy price panel in sidebar */}
        {selected && (
          <div className="border-t border-pine-100 bg-pine-50 p-4 max-h-72 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-pine-800 font-semibold text-sm truncate">{selected.name}</h3>
              <button onClick={() => { setSelected(null); if (infoWindowRef.current) infoWindowRef.current.close() }} className="text-pine-300 hover:text-pine-500 ml-2 shrink-0">✕</button>
            </div>
            <p className="text-pine-400 text-xs mb-3 uppercase tracking-wide font-medium">Medication prices</p>
            {pricesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between animate-pulse">
                    <div className="h-3 bg-pine-200 rounded w-28" />
                    <div className="h-3 bg-pine-200 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : prices.length === 0 ? (
              <p className="text-pine-300 text-xs">No prices listed yet.</p>
            ) : (
              <div className="space-y-2">
                {prices.map(price => (
                  <div key={price.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-pine-700 text-xs font-medium truncate">{price.medication?.name}</p>
                      <p className="text-pine-400 text-[10px]">{price.medication?.strength}</p>
                    </div>
                    <span className="text-pine-600 text-xs font-semibold shrink-0">{formatMYR(price.price_myr)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <a
                href={`/patient/orders/new?pharmacy=${selected.id}`}
                className="btn-primary text-xs py-2 px-3 flex-1 text-center"
              >
                Order here
              </a>
              {selected.has_locker && (
                <a
                  href={`/patient/orders/new?pharmacy=${selected.id}&fulfilment=locker`}
                  className="btn-outline text-xs py-2 px-3 flex-1 text-center"
                >
                  Book locker
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 bg-pine-100" />
    </div>
  )
}

// ─── Build the Google Maps InfoWindow HTML popup ──────────────
function buildPopupHTML(pharmacy: Pharmacy, prices: PharmacyMedicationPrice[], loading: boolean): string {
  const distanceTag = pharmacy.distance_km !== undefined
    ? `<span style="color:#2d8463;font-size:11px;font-weight:600">${pharmacy.distance_km.toFixed(1)} km away</span>`
    : ''

  const lockerBadge = pharmacy.has_locker
    ? `<span style="background:#d9ede5;color:#0f6e56;font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;margin-left:6px">Locker</span>`
    : ''

  const priceRows = loading
    ? `<div style="color:#80c0a8;font-size:12px;padding:8px 0">Loading prices...</div>`
    : prices.length === 0
    ? `<div style="color:#b3dbcc;font-size:12px;padding:8px 0">No prices listed.</div>`
    : prices.slice(0, 5).map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:0.5px solid #f0f7f4">
          <div>
            <div style="font-size:12px;font-weight:500;color:#113828">${p.medication?.name ?? ''}</div>
            <div style="font-size:10px;color:#4da083">${p.medication?.strength ?? ''}</div>
          </div>
          <span style="font-size:12px;font-weight:700;color:#1e6b4f">RM ${p.price_myr.toFixed(2)}</span>
        </div>
      `).join('') + (prices.length > 5 ? `<div style="font-size:11px;color:#80c0a8;padding-top:4px">+${prices.length - 5} more medications</div>` : '')

  return `
    <div style="font-family:-apple-system,sans-serif;min-width:220px;max-width:260px;padding:4px 2px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:14px;font-weight:700;color:#113828;line-height:1.3;flex:1">${pharmacy.name}</div>
      </div>
      <div style="font-size:11px;color:#4da083;margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${distanceTag}${lockerBadge}
      </div>
      <div style="font-size:11px;color:#80c0a8;margin-bottom:10px">${pharmacy.address}</div>

      <div style="font-size:10px;font-weight:600;color:#4da083;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Medication prices</div>
      ${priceRows}

      <div style="display:flex;gap:6px;margin-top:10px">
        <a href="/patient/orders/new?pharmacy=${pharmacy.id}"
           style="flex:1;background:#1e6b4f;color:white;text-align:center;padding:7px 10px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;display:block">
          Order here
        </a>
        ${pharmacy.has_locker ? `
        <a href="/patient/orders/new?pharmacy=${pharmacy.id}&fulfilment=locker"
           style="flex:1;border:1.5px solid #1e6b4f;color:#1e6b4f;text-align:center;padding:7px 10px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;display:block">
          Book locker
        </a>` : ''}
      </div>
    </div>
  `
}
