import { useMemo } from 'react'
import { useEmployeeData } from '../contexts/DataContext'
import { CITY_COORDINATES } from '../constants'

export default function AnalyticsPage() {
  const { employees, auditImage } = useEmployeeData()

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

  return (
    <section className="page" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Data Intelligence</p>
          <h2>Operational Analytics & Audit</h2>
          <p className="muted">
            High-fidelity visualization of salary distribution and geographic employee density
            captured through raw SVG projection.
          </p>
        </div>
      </div>

      <div className="analytics-layout">
        <div className="panel audit-panel" style={{ height: 'fit-content' }}>
          <div className="panel-header" style={{ marginBottom: 'var(--sp-6)' }}>
            <h3>Personnel Manifest</h3>
            <p className="muted" style={{ fontSize: '0.8rem' }}>Verified biometric & signature data</p>
          </div>

          {auditImage ? (
            <div style={{ animation: 'popIn 0.5s ease-out' }}>
              <div className="audit-frame" style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <img className="audit-image" src={auditImage} alt="Merged audit result" />
                <div className="scan-line" />
              </div>
              <div className="audit-meta" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                  [ MANIFEST_ID: <strong>AUD-{Math.random().toString(36).substr(2, 9).toUpperCase()}</strong> ]
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ border: '1px dashed var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
              <div className="empty-icon" style={{ fontSize: '3rem', opacity: 0.1 }}>❂</div>
              <p style={{ fontWeight: 500 }}>Manifest Missing</p>
              <p className="muted">Pending identity verification verification.</p>
            </div>
          )}
        </div>

        <div className="panel chart-panel">
          <div className="panel-header" style={{ marginBottom: 'var(--sp-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Salary Allocation</h3>
              <p className="muted" style={{ fontSize: '0.8rem' }}>Average distribution across top markets</p>
            </div>
            <div className="chart-stat">
              <span className="muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Max Peak</span>
              <strong style={{ display: 'block' }}>₹{Math.round(maxSalary / 1000)}k</strong>
            </div>
          </div>

          <div className="chart-scroll">
            <svg
              className="chart-svg"
              viewBox="0 0 640 340"
              role="img"
              aria-label="Average salary by city bar chart"
              style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-accent-dark)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Y-axis */}
              <line x1="60" y1="24" x2="60" y2="288" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              {/* X-axis */}
              <line x1="60" y1="288" x2="620" y2="288" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Gridlines */}
              {[25, 50, 75, 100].map((pct) => {
                const y = 288 - (pct / 100) * 210
                return (
                  <g key={pct}>
                    <line
                      x1="60"
                      y1={y}
                      x2="620"
                      y2={y}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text x="50" y={y + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'var(--color-text-muted)', fontFamily: 'var(--font-family)' }}>
                      {Math.round((maxSalary * pct) / 100 / 1000)}k
                    </text>
                  </g>
                )
              })}

              {salaryByCity.map((entry, index) => {
                const chartHeight = (entry.averageSalary / maxSalary) * 210
                const x = 85 + index * 68
                const y = 288 - chartHeight
                return (
                  <g key={entry.city} className="chart-group">
                    <rect
                      x={x}
                      y={y}
                      width="36"
                      height={chartHeight}
                      rx="4"
                      fill="url(#barGrad)"
                      style={{ transition: 'all 0.4s ease' }}
                    />
                    <rect
                      x={x}
                      y={y}
                      width="36"
                      height="2"
                      fill="#fff"
                      opacity="0.5"
                    />
                    <text
                      x={x + 18}
                      y="315"
                      textAnchor="middle"
                      style={{ fontSize: '10px', fill: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}
                    >
                      {entry.city.slice(0, 3)}
                    </text>
                    <text
                      x={x + 18}
                      y={y - 12}
                      textAnchor="middle"
                      style={{ fontSize: '11px', fill: 'var(--color-text-primary)', fontWeight: 800 }}
                    >
                      {Math.round(entry.averageSalary / 1000)}k
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="chart-legend" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {salaryByCity.map((entry) => (
                <div key={entry.city} className="legend-item" style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span className="legend-dot" style={{ background: entry.averageSalary === maxSalary ? 'var(--color-accent)' : 'var(--color-border-light)' }} />
                  <span style={{ fontWeight: 600 }}>{entry.city}</span>
                  <span className="legend-val" style={{ fontFamily: 'var(--font-mono)' }}>₹{Math.round(entry.averageSalary / 1000)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel map-panel" style={{ overflow: 'hidden' }}>
        <div className="map-header">
          <div>
            <h3>Geospatial Distribution</h3>
            <p className="muted">Mapping workforce density via coordinate projection onto normalized SVG space.</p>
          </div>
          <div className="map-legend" style={{ display: 'flex', gap: '16px' }}>
            <div className="map-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)' }} />
              <span className="muted">Operational Hub</span>
            </div>
          </div>
        </div>

        <div className="map-board" style={{ border: 'none', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
          <svg
            viewBox="0 0 900 440"
            className="map-svg"
            role="img"
            aria-label="India city distribution map"
          >
            <path
              d="M273 65l68-29 108 18 60 66 46 10 30 64-18 52 17 68-45 75-88 31-55-12-51-46-21-57-51-7-49-57-8-71 38-76z"
              fill="rgba(59, 130, 246, 0.05)"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="2"
              strokeDasharray="5 5"
            />

            {salaryByCity.map((entry) => {
              const point = CITY_COORDINATES[entry.city]
              if (!point) return null

              const cx = point.x * 6.5
              const cy = point.y * 4.3
              const radius = 6 + Math.min(12, entry.count * 0.8)

              return (
                <g key={entry.city} style={{ cursor: 'pointer' }}>
                  <circle cx={cx} cy={cy} r={radius * 2} fill="var(--color-accent)" opacity="0.1">
                    <animate attributeName="r" values={`${radius * 1.5};${radius * 3};${radius * 1.5}`} dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r={radius} fill="var(--color-accent)" opacity="0.2" />
                  <circle cx={cx} cy={cy} r="4" fill="#fff" stroke="var(--color-accent)" strokeWidth="2" />
                  <text x={cx + 12} y={cy + 4} style={{ fontSize: '11px', fill: 'var(--color-text-primary)', fontWeight: 700, pointerEvents: 'none', textShadow: '0 0 4px #000' }}>
                    {entry.city}
                  </text>
                  <text x={cx + 12} y={cy + 16} style={{ fontSize: '9px', fill: 'var(--color-text-muted)', fontWeight: 500, pointerEvents: 'none' }}>
                    {entry.count} Personnel
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--color-accent);
          opacity: 0.3;
          box-shadow: 0 0 10px var(--color-accent);
          animation: scan 4s linear infinite;
        }
        
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        
        .chart-group:hover rect {
          opacity: 1;
          filter: brightness(1.2);
          transform: translateY(-5px);
        }
      `}</style>
    </section>
  )
}
