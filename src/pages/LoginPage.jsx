import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LOGIN_USERNAME, LOGIN_PASSWORD } from '../constants'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState(LOGIN_USERNAME)
  const [password, setPassword] = useState(LOGIN_PASSWORD)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/list', { replace: true })
    }
  }, [auth.isAuthenticated, navigate])

  const from = location.state?.from || '/list'

  function handleSubmit(event) {
    event.preventDefault()
    const result = auth.login(username, password)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <section className="login-page">
      <div className="login-card" style={{ animation: 'reveal 0.8s cubic-bezier(0,0,0.2,1)' }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
          <p className="eyebrow">Enterprise Security</p>
          <h2 className="login-heading">Employee Insights</h2>
          <p className="muted">
            Secure access to the identity verification and analytics dashboard.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              placeholder="e.g. testuser"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p className="error-text" style={{ marginTop: 'var(--sp-2)' }}>{error}</p> : null}

          <button className="primary-button login-submit" type="submit" style={{ marginTop: 'var(--sp-4)' }}>
            Sign in to Dashboard
          </button>
        </form>

        <div className="credentials-box">
          <span>Demo Credentials</span>
          <code>testuser / Test123</code>
        </div>
      </div>

      <style>{`
        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }
        .login-card {
          border: 1px solid var(--glass-border);
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </section>
  )
}
