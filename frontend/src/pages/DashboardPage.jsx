import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth.jsx'
import { authApi } from '../utils/api.js'

const s = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at top, #1a1f35 0%, #0f1117 70%)',
    padding: '32px 16px',
  },
  nav: {
    maxWidth: '860px',
    margin: '0 auto 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { fontSize: '20px', fontWeight: '700', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' },
  logoutBtn: {
    padding: '8px 18px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '13px',
    cursor: 'pointer',
  },
  grid: {
    maxWidth: '860px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '28px',
  },
  welcome: {
    maxWidth: '860px',
    margin: '0 auto 24px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '16px',
    padding: '28px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    flexShrink: 0,
  },
  cardTitle: { fontSize: '13px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cardValue: { fontSize: '22px', fontWeight: '700', color: '#f1f5f9' },
  cardSub: { fontSize: '13px', color: '#475569', marginTop: '4px' },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: '20px',
    background: color === 'green' ? 'rgba(74,222,128,0.15)' : 'rgba(99,102,241,0.15)',
    border: `1px solid ${color === 'green' ? 'rgba(74,222,128,0.3)' : 'rgba(99,102,241,0.3)'}`,
    fontSize: '12px',
    color: color === 'green' ? '#86efac' : '#a5b4fc',
    marginTop: '12px',
  }),
  featureList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  featureItem: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    fontSize: '13px', color: '#94a3b8', lineHeight: '1.5',
  },
}

function initials(name) {
  return name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await authApi.logout() } catch (_) {}
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const loginTime = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.brand}>🔐 FaceAuth</div>
        <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
      </nav>

      {/* Welcome banner */}
      <div style={s.welcome}>
        <div style={s.avatar}>{initials(user?.name)}</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            You are successfully authenticated
          </div>
          <div style={s.badge('green')}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
            Session active
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div style={s.grid}>

        {/* Profile card */}
        <div style={s.card}>
          <div style={s.cardTitle}>Your profile</div>
          <div style={s.cardValue}>{user?.name}</div>
          <div style={s.cardSub}>{user?.email}</div>
          <div style={s.badge('purple')}>
            👤 User ID #{user?.id}
          </div>
        </div>

        {/* Session card */}
        <div style={s.card}>
          <div style={s.cardTitle}>Current session</div>
          <div style={s.cardValue} style={{ fontSize: '15px', color: '#f1f5f9', fontWeight: '600' }}>{loginTime}</div>
          <div style={s.cardSub}>Session expires in 60 minutes</div>
          <div style={s.badge('purple')}>
            🔑 JWT authenticated
          </div>
        </div>

        {/* Security features card */}
        <div style={s.card}>
          <div style={s.cardTitle}>Security features</div>
          <ul style={s.featureList}>
            <li style={s.featureItem}>
              <span>👁</span>
              <span>Eye blink liveness detection active</span>
            </li>
            <li style={s.featureItem}>
              <span>🎭</span>
              <span>Anti-photo spoof protection via texture analysis</span>
            </li>
            <li style={s.featureItem}>
              <span>🔄</span>
              <span>Head movement verification required</span>
            </li>
            <li style={s.featureItem}>
              <span>🧬</span>
              <span>128-dimensional face encoding stored</span>
            </li>
            <li style={s.featureItem}>
              <span>⚡</span>
              <span>Rate-limited API — 8 face-login attempts/min</span>
            </li>
            <li style={s.featureItem}>
              <span>🔒</span>
              <span>Password bcrypt-hashed, never stored in plain text</span>
            </li>
          </ul>
        </div>

        {/* How face login works */}
        <div style={s.card}>
          <div style={s.cardTitle}>How your face login works</div>
          <ul style={s.featureList}>
            <li style={s.featureItem}>
              <span style={{ color: '#818cf8', fontWeight: '700', minWidth: '18px' }}>1</span>
              <span>Camera records ~30 frames over 3.5 seconds</span>
            </li>
            <li style={s.featureItem}>
              <span style={{ color: '#818cf8', fontWeight: '700', minWidth: '18px' }}>2</span>
              <span>Liveness checks run: blink, head motion, texture</span>
            </li>
            <li style={s.featureItem}>
              <span style={{ color: '#818cf8', fontWeight: '700', minWidth: '18px' }}>3</span>
              <span>Face encoding compared against all registered users</span>
            </li>
            <li style={s.featureItem}>
              <span style={{ color: '#818cf8', fontWeight: '700', minWidth: '18px' }}>4</span>
              <span>Best match below 0.5 distance threshold is selected</span>
            </li>
            <li style={s.featureItem}>
              <span style={{ color: '#818cf8', fontWeight: '700', minWidth: '18px' }}>5</span>
              <span>JWT token issued — email & name auto-filled, no typing needed</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
