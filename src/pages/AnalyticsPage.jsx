import { useEffect, useMemo, useRef } from 'react'
import { useEmployeeData } from '../contexts/DataContext'
import { CITY_COORDINATES } from '../constants'

export default function AnalyticsPage() {
  const { employees, auditImages } = useEmployeeData()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  const salaryByCity = useMemo(() => {
    const grouped = employees.reduce((acc, emp) => {
      if (!acc[emp.city]) acc[emp.city] = { totalSalary: 0, count: 0 }
      acc[emp.city].totalSalary += emp.salary
      acc[emp.city].count += 1
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([city, values]) => ({
        city,
        averageSalary: values.totalSalary / values.count,
        count: values.count,
      }))
      .sort((a, b) => b.averageSalary - a.averageSalary)
      .slice(0, 8)
  }, [employees])

  const maxSalary = salaryByCity[0]?.averageSalary || 1

  const verifiedEntries = useMemo(() => {
    return Object.entries(auditImages)
      .map(([id, image]) => {
        const emp = employees.find((e) => e.id === id)
        return { id, image, name: emp?.name || 'Unknown' }
      })
      .reverse()
      .slice(0, 4)
  }, [auditImages, employees])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Create map instance using global L from CDN
    const L = window.L
    if (!L) return

    mapInstance.current = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 4,
      scrollWheelZoom: false,
      attributionControl: false
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current)

    // Add markers for cities
    salaryByCity.forEach(entry => {
      const coords = CITY_COORDINATES[entry.city]
      if (coords && coords.lat && coords.lng) {
        const marker = L.circleMarker([coords.lat, coords.lng], {
          radius: 8 + (entry.count / 10),
          fillColor: '#3b82f6',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.6
        })
        
        marker.bindTooltip(`<strong>${entry.city}</strong><br/>${entry.count} Employees`, {
          permanent: false,
          direction: 'top'
        })
        
        marker.addTo(mapInstance.current)
      }
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [salaryByCity])

  return (
    <section className="page" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Data Intelligence</p>
          <h2>Operational Analytics & Audit</h2>
          <p className="muted">
            High-fidelity visualization of salary distribution and geographic density.
          </p>
        </div>
      </div>

      <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px' }}>
        <div className="main-stats">
          <div className="panel chart-panel">
            <div className="panel-header" style={{ marginBottom: 'var(--sp-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Salary Allocation (Raw SVG)</h3>
                <p className="muted" style={{ fontSize: '0.8rem' }}>Average distribution across top markets</p>
              </div>
              <div className="chart-stat">
                <span className="muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Max Peak</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                   ₹{Math.round(maxSalary / 1000)}k
                </strong>
              </div>
            </div>

            <div className="chart-container" style={{ position: 'relative', height: '300px' }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 300"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 25, 50, 75, 100].map(p => {
                  const y = 250 - (p / 100) * 200
                  return (
                    <g key={p}>
                      <line x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.05)" />
                      <text x="-10" y={y + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'rgba(255,255,255,0.3)' }}>
                        {Math.round((maxSalary * p) / 100000)}k
                      </text>
                    </g>
                  )
                })}

                {salaryByCity.map((entry, i) => {
                  const height = (entry.averageSalary / maxSalary) * 200
                  const width = 60
                  const x = 50 + i * (700 / salaryByCity.length)
                  const y = 250 - height
                  return (
                    <g key={entry.city} className="bar-group">
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="url(#barGradient)"
                        rx="4"
                      />
                      <text
                        x={x + width / 2}
                        y="275"
                        textAnchor="middle"
                        style={{ fontSize: '11px', fill: 'var(--color-text-secondary)', fontWeight: 600 }}
                      >
                        {entry.city}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y - 10}
                        textAnchor="middle"
                        style={{ fontSize: '10px', fill: 'var(--color-accent)', fontWeight: 700 }}
                      >
                         ₹{Math.round(entry.averageSalary / 1000)}k
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          <div className="panel map-panel" style={{ height: '400px', padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#0b0e14' }} />
            <div className="map-info-overlay" style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', maxWidth: '240px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem' }}>Geospatial Mapping</h4>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                Leaflet-driven projection. City-to-coordinate mapping is handled via 
                static lat/lng lookup in <code>constants.js</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="audit-feed">
          <div className="panel audit-panel" style={{ height: '100%' }}>
            <div className="panel-header" style={{ marginBottom: 'var(--sp-6)' }}>
              <h3>Verification Feed</h3>
              <p className="muted" style={{ fontSize: '0.8rem' }}>Recent identity audit manifests</p>
            </div>

            <div className="feed-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {verifiedEntries.length > 0 ? (
                verifiedEntries.map(entry => (
                  <div key={entry.id} className="feed-item" style={{ animation: 'popIn 0.5s ease-out' }}>
                    <div className="audit-frame" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative', aspectRatio: '4/3' }}>
                      <img src={entry.image} alt={entry.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="audit-overlay-label" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {entry.name}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                  <p className="muted">No audits captured yet.</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Captures from the verification terminal will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .bar-group:hover rect {
          fill: var(--color-accent);
          filter: brightness(1.2);
        }

        .leaflet-container {
          filter: grayscale(1) invert(1) hue-rotate(180deg);
        }
      `}</style>
    </section>
  )
}
