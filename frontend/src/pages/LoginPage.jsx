import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi, faceApi } from '../utils/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import FaceCapture from '../components/FaceCapture.jsx'

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    background: 'radial-gradient(ellipse at top, #1a1f35 0%, #0f1117 70%)',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '40px',
    backdropFilter: 'blur(12px)',
  },
  logo: { fontSize: '28px', textAlign: 'center', marginBottom: '6px' },
  heading: { fontSize: '22px', fontWeight: '700', textAlign: 'center', color: '#f1f5f9', marginBottom: '4px' },
  sub: { fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '28px' },
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '28px',
    gap: '4px',
  },
  tab: (active) => ({
    flex: 1,
    padding: '9px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    background: active ? 'rgba(99,102,241,0.3)' : 'transparent',
    color: active ? '#a5b4fc' : '#64748b',
    transition: 'all 0.2s',
  }),
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' },
  input: {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none',
  },
  btn: (disabled) => ({
    width: '100%', padding: '12px',
    background: disabled ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '8px',
  }),
  link: { display: 'block', textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' },
  anchor: { color: '#818cf8', textDecoration: 'none', fontWeight: '500' },
  hint: { fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.6' },
  featurePills: {
    display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px',
  },
  pill: {
    padding: '4px 10px', borderRadius: '20px',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    fontSize: '11px', color: '#a5b4fc',
  },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [tab,      setTab]      = useState('password')  // 'password' | 'face'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handlePasswordLogin(e) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleFaceLogin({ frames, faceImage }) {
    setLoading(true)
    try {
      const { data } = await faceApi.faceLogin(frames, faceImage)
      login(data)
      toast.success(`Welcome back, ${data.name}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Face login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🔐</div>
        <h1 style={s.heading}>Sign in</h1>
        <p style={s.sub}>Use your password or simply look at the camera</p>

        {/* Tab switcher */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'password')} onClick={() => setTab('password')}>
            🔑 Password
          </button>
          <button style={s.tab(tab === 'face')} onClick={() => setTab('face')}>
            🤳 Face Login
          </button>
        </div>

        {/* Password tab */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                style={s.input} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                style={s.input} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" style={s.btn(loading)} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Face login tab */}
        {tab === 'face' && (
          <div>
            <div style={s.featurePills}>
              <span style={s.pill}>👁 Blink detection</span>
              <span style={s.pill}>🎭 Anti-photo guard</span>
              <span style={s.pill}>🔄 Head movement</span>
              <span style={s.pill}>⚡ Auto-fills email</span>
            </div>
            <p style={s.hint}>
              Look at the camera and <strong style={{ color: '#cbd5e1' }}>blink once</strong> when
              recording. Your identity will be detected automatically — no need to type anything.
            </p>
            <FaceCapture onCapture={handleFaceLogin} mode="login" />
            {loading && (
              <p style={{ textAlign: 'center', color: '#818cf8', marginTop: '12px', fontSize: '14px' }}>
                Identifying you…
              </p>
            )}
          </div>
        )}

        <p style={s.link}>
          No account?{' '}
          <Link to="/signup" style={s.anchor}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
