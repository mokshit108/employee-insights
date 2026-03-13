import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployeeData } from '../contexts/DataContext'

const ROW_HEIGHT = 72
const OVERSCAN = 6

export default function ListPage() {
  const { employees, status, error, fetchEmployees, auditImages } = useEmployeeData()
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [viewportHeight, setViewportHeight] = useState(560)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        setViewportHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const cities = useMemo(() => {
    return ['All', ...new Set(employees.map((e) => e.city))].slice(0, 25)
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase()

    return [...employees]
      .filter((emp) => {
        const matchesQuery =
          q.length === 0 ||
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q)

        const matchesCity = selectedCity === 'All' || emp.city === selectedCity
        return matchesQuery && matchesCity
      })
      .sort((a, b) => {
        if (sortKey === 'salary') return b.salary - a.salary
        return String(a[sortKey]).localeCompare(String(b[sortKey]))
      })
  }, [employees, query, selectedCity, sortKey])

  // --- Virtualization math ---
  const totalHeight = filteredEmployees.length * ROW_HEIGHT
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT)
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(filteredEmployees.length, startIndex + visibleCount + OVERSCAN * 2)
  const visibleRows = filteredEmployees.slice(startIndex, endIndex)
  const offsetY = startIndex * ROW_HEIGHT

  return (
    <section className="page" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="page-header" style={{ alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">Enterprise Grid</p>
          <h2>High-Performance Employee View</h2>
          <p className="muted" style={{ maxWidth: '600px' }}>
            Direct access to the personnel ledger. Select a record to initiate identity 
            verification or view existing audit manifests.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={fetchEmployees}
          style={{ height: 'fit-content' }}
        >
          <span style={{ marginRight: '8px' }}>↻</span> Refresh Records
        </button>
      </div>

      <div className="panel metrics-grid" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)' }}>
        <div className="metric-item">
          <span>Global ID Pool</span>
          <strong style={{ color: 'var(--color-accent)' }}>{employees.length.toLocaleString()}</strong>
        </div>
        <div className="metric-item">
          <span>Match Count</span>
          <strong style={{ color: 'var(--color-text-primary)' }}>{filteredEmployees.length.toLocaleString()}</strong>
        </div>
        <div className="metric-item">
          <span>Sync Status</span>
          <strong className={`status-badge status-${status}`} style={{ width: 'fit-content' }}>
            {status === 'loading' ? 'SYNCHRONIZING' : status === 'error' ? 'OFFLINE_FALLBACK' : 'LIVE_LEDGER'}
          </strong>
        </div>
      </div>

      {error ? (
        <div className="banner warning" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠</span>
          <span style={{ color: 'var(--color-error)' }}>Ledger Connectivity Issue: {error}. Switched to local entropy buffer.</span>
        </div>
      ) : null}

      <div className="panel controls-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <div className="control-group">
          <label>Employee Search</label>
          <input
            placeholder="Search by name, ID, email, or dept..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label>Filter By City</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Sort Order</label>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="name">Alphabetical (A-Z)</option>
            <option value="city">Location</option>
            <option value="department">Role / Department</option>
            <option value="salary">Compensation (Desc)</option>
          </select>
        </div>
      </div>

      <div className="grid-shell" style={{ animation: 'slideUp 0.8s cubic-bezier(0,0,0.2,1)' }}>
        <div className="grid-head" style={{ gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 120px' }}>
          <span>Avatar</span>
          <span>Identity / Record</span>
          <span>Location</span>
          <span>Department</span>
          <span>Annual Revenue</span>
          <span>Status</span>
        </div>

        <div
          className="virtual-viewport"
          ref={containerRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{ scrollBehavior: 'smooth' }}
        >
          {status === 'loading' && employees.length === 0 ? (
            <div className="grid-loading">
              <span className="loading-spinner" />
              <p style={{ marginTop: '16px' }}>Synchronizing local state with remote ledger...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="grid-empty">
              <p style={{ fontSize: '3rem', opacity: 0.1, marginBottom: '8px' }}>∅</p>
              <p style={{ fontWeight: 600 }}>Zero Matches Found</p>
              <p className="muted">Try adjusting your search query or city filter.</p>
            </div>
          ) : (
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
              <div
                className="virtual-inner"
                style={{ transform: `translateY(${offsetY}px)` }}
              >
                {visibleRows.map((emp) => {
                  const auditImg = auditImages[emp.id]
                  return (
                    <button
                      className="grid-row"
                      key={emp.id}
                      onClick={() => navigate(`/details/${emp.id}`)}
                      type="button"
                      style={{ gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 120px' }}
                    >
                      <div className="row-avatar">
                        {auditImg ? (
                          <img src={auditImg} alt="Audit thumbnail" className="audit-thumb" />
                        ) : (
                          <div className="avatar-placeholder">{emp.name.charAt(0)}</div>
                        )}
                      </div>
                      <span className="row-name">
                        <strong>{emp.name}</strong>
                        <small>ID: {emp.id} • {emp.email}</small>
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {emp.city}
                      </span>
                      <span>
                        <span className={`dept-pill dept-${emp.department.toLowerCase()}`}>
                          {emp.department}
                        </span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ₹ {emp.salary.toLocaleString('en-IN')}
                      </span>
                      <span className="row-status">
                        {auditImg ? (
                          <span className="verified-badge">✓ Verified</span>
                        ) : (
                          <span className="action-tag">Unverified</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }
        .row-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-surface-hover);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          border: 1px solid var(--color-border);
        }
        .audit-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid var(--color-accent);
          box-shadow: 0 0 8px var(--color-accent-glow);
        }
        .verified-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .action-tag {
          padding: 4px 12px;
          border-radius: 6px;
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          transition: all 0.2s ease;
          border: 1px solid transparent;
          font-size: 0.75rem;
          text-align: center;
        }
        .grid-row:hover .action-tag {
          background: var(--color-accent);
          color: white;
          box-shadow: 0 0 12px var(--color-accent-glow);
        }
        .status-badge {
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 12px !important;
        }
      `}</style>
    </section>
  )
}
