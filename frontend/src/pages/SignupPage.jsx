import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../utils/api.js'
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
  logo: {
    fontSize: '28px',
    textAlign: 'center',
    marginBottom: '6px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#f1f5f9',
    marginBottom: '4px',
  },
  sub: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '32px',
  },
  steps: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
  },
  step: (active, done) => ({
    flex: 1,
    height: '3px',
    borderRadius: '2px',
    background: done ? '#6366f1' : active ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
    transition: 'background 0.3s',
  }),
  stepLabel: {
    fontSize: '11px',
    color: '#475569',
    textAlign: 'center',
    marginBottom: '20px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '6px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: (disabled) => ({
    width: '100%',
    padding: '12px',
    background: disabled ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  }),
  link: {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: '#64748b',
  },
  anchor: {
    color: '#818cf8',
    textDecoration: 'none',
    fontWeight: '500',
  },
  hint: {
    fontSize: '12px',
    color: '#475569',
    marginTop: '8px',
    lineHeight: '1.5',
  },
}

export default function SignupPage() {
  const navigate = useNavigate()

  const [step,     setStep]     = useState(1)   // 1 = info, 2 = face
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleInfoSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain an uppercase letter')
      return
    }
    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain a number')
      return
    }
    setStep(2)
  }

  async function handleFaceCapture({ faceImage }) {
    setLoading(true)
    try {
      await authApi.signup(name.trim(), email.trim(), password, faceImage)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🔐</div>
        <h1 style={s.heading}>Create account</h1>
        <p style={s.sub}>Secure login with your face — no passwords to remember</p>

        {/* Step indicator */}
        <div style={s.steps}>
          <div style={s.step(step === 1, step > 1)} />
          <div style={s.step(step === 2, false)} />
        </div>
        <p style={s.stepLabel}>
          Step {step} of 2 — {step === 1 ? 'Your details' : 'Face registration'}
        </p>

        {/* Step 1: Info */}
        {step === 1 && (
          <form onSubmit={handleInfoSubmit}>
            <div style={s.field}>
              <label style={s.label}>Full name</label>
              <input
                style={s.input}
                type="text"
                placeholder="Ravi Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                placeholder="ravi@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                style={s.input}
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" style={s.btn(false)}>
              Next — Register your face →
            </button>
          </form>
        )}

        {/* Step 2: Face */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <p style={s.hint}>
                📋 <strong style={{ color: '#cbd5e1' }}>Instructions:</strong> Look directly at the camera.
                When recording starts, <strong style={{ color: '#cbd5e1' }}>blink once</strong> and make
                a small natural head movement. Good lighting improves accuracy.
              </p>
            </div>
            <FaceCapture onCapture={handleFaceCapture} mode="signup" />
            {loading && (
              <p style={{ textAlign: 'center', color: '#818cf8', marginTop: '12px', fontSize: '14px' }}>
                Creating your account…
              </p>
            )}
            <button
              style={{ ...s.btn(false), background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', marginTop: '12px' }}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
          </div>
        )}

        <p style={s.link}>
          Already have an account?{' '}
          <Link to="/login" style={s.anchor}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
