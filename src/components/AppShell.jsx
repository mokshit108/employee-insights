import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AppShell() {
  const location = useLocation()
  const auth = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--sp-8)' }}>
            <div className="logo-box" style={{ width: '40px', height: '40px', background: 'var(--color-accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
              <span style={{ margin: 'auto' }}>E</span>
            </div>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Enterprise</p>
              <h1 className="sidebar-title" style={{ margin: 0, fontSize: '1.2rem' }}>Insights</h1>
            </div>
          </div>

          <nav className="nav-links">
            <Link className={location.pathname === '/list' ? 'active' : ''} to="/list">
              <span className="nav-icon">📊</span> Employee Ledger
            </Link>
            <Link
              className={location.pathname.startsWith('/details') ? 'active' : ''}
              to="/details/1"
            >
              <span className="nav-icon">🛡</span> Verify Identity
            </Link>
            <Link className={location.pathname === '/analytics' ? 'active' : ''} to="/analytics">
              <span className="nav-icon">📈</span> Market Intelligence
            </Link>
          </nav>
        </div>

        <div className="auth-card">
          <p className="auth-label">Active Operator</p>
          <strong className="auth-username" style={{ fontSize: '1rem', color: 'var(--color-accent)' }}>{auth.username}</strong>
          <button className="secondary-button full-width" onClick={auth.logout} style={{ marginTop: 'var(--sp-2)', fontSize: '0.8rem', padding: 'var(--sp-2)' }}>
            Terminate Session
          </button>
        </div>
      </aside>

      <main className="page-content">
        <div className="content-glow" />
        <Outlet />
      </main>

      <style>{`
        .content-glow {
          position: fixed;
          top: -10%;
          right: -10%;
          width: 50%;
          height: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .nav-links a {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-links a.active {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </div>
  )
}
