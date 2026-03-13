import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployeeData } from '../contexts/DataContext'

const ROW_HEIGHT = 72
const OVERSCAN = 6

export default function ListPage() {
  const { employees, status, error, fetchEmployees } = useEmployeeData()
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
          emp.department.toLowerCase().includes(q)

        const matchesCity = selectedCity === 'All' || emp.city === selectedCity
        return matchesQuery && matchesCity
      })
      .sort((a, b) => {
        if (sortKey === 'salary') return b.salary - a.salary
        return String(a[sortKey]).localeCompare(String(b[sortKey]))
      })
  }, [employees, query, selectedCity, sortKey])

  // --- Virtualization math ---
  // totalHeight: the full scrollable height if ALL rows were rendered.
  // visibleCount: how many rows fit inside the current viewport.
  // startIndex: first row index to render, pulled back by overscan so the
  //             buffer above the visible area is always pre-rendered.
  // endIndex:   last row index to render, pushed forward by 2x overscan.
  // offsetY:    CSS translateY applied to the inner container so that only
  //             startIndex..endIndex rows appear at the correct visual position.
  //
  // INTENTIONAL BUG (see README): scrollTop is NOT reset when filters change.
  // If the user is scrolled far down and applies a filter that shrinks the list,
  // startIndex can exceed filteredEmployees.length, making visibleRows empty
  // until the user manually scrolls back up.
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
            Leveraging custom DOM windowing to maintain smooth 60fps performance across thousands of records.
            No external UI or virtualization libraries are used.
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
          <span>Total Database</span>
          <strong style={{ color: 'var(--color-accent)' }}>{employees.length.toLocaleString()}</strong>
        </div>
        <div className="metric-item">
          <span>In Viewset</span>
          <strong style={{ color: 'var(--color-text-primary)' }}>{filteredEmployees.length.toLocaleString()}</strong>
        </div>
        <div className="metric-item">
          <span>System Status</span>
          <strong className={`status-badge status-${status}`} style={{ width: 'fit-content' }}>
            {status.toUpperCase()}
          </strong>
        </div>
      </div>

      {error ? (
        <div className="banner warning" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠</span>
          <span>API disconnected ( {error} ). Using local high-entropy fallback dataset.</span>
        </div>
      ) : null}

      <div className="panel controls-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <div className="control-group">
          <label>Employee Search</label>
          <input
            placeholder="Search by name, email, or dept..."
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
        <div className="grid-head">
          <span>Identity / Record</span>
          <span>Location</span>
          <span>Department</span>
          <span>Annual Revenue</span>
          <span>Action</span>
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
              <p style={{ fontSize: '1.5rem', opacity: 0.3, marginBottom: '8px' }}>∅</p>
              No records found matching your current filter criteria.
            </div>
          ) : (
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
              <div
                className="virtual-inner"
                style={{ transform: `translateY(${offsetY}px)` }}
              >
                {visibleRows.map((emp) => (
                  <button
                    className="grid-row"
                    key={emp.id}
                    onClick={() => navigate(`/details/${emp.id}`)}
                    type="button"
                  >
                    <span className="row-name">
                      <strong>{emp.name}</strong>
                      <small>{emp.email}</small>
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
                    <span className="row-link">
                      <span className="action-tag">Verify</span>
                    </span>
                  </button>
                ))}
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
        .action-tag {
          padding: 4px 12px;
          border-radius: 6px;
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          transition: all 0.2s ease;
          border: 1px solid transparent;
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
