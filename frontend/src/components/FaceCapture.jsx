import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { faceApi } from '../utils/api.js'
import LivenessIndicator from './LivenessIndicator.jsx'

const CAPTURE_DURATION_MS = 3500   // record for 3.5 seconds
const FRAME_INTERVAL_MS   = 120    // ~8 fps
const MIN_FRAMES          = 10

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cameraWrap: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.08)',
    background: '#0a0c12',
    aspectRatio: '4/3',
  },
  webcam: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',  // mirror view
    display: 'block',
  },
  overlay: (recording) => ({
    position: 'absolute',
    inset: 0,
    border: `3px solid ${recording ? '#f87171' : 'transparent'}`,
    borderRadius: '14px',
    transition: 'border-color 0.3s',
    pointerEvents: 'none',
  }),
  faceGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -55%)',
    width: '140px',
    height: '180px',
    border: '2px dashed rgba(255,255,255,0.25)',
    borderRadius: '50% 50% 45% 45%',
    pointerEvents: 'none',
  },
  recBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: '#f87171',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    letterSpacing: '0.05em',
  },
  recDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#fff',
    animation: 'pulse 1s infinite',
  },
  progressBar: (pct) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
    transition: 'width 0.1s linear',
  }),
  statusText: {
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'center',
    minHeight: '18px',
  },
  btn: (variant, disabled) => ({
    padding: '11px 24px',
    borderRadius: '10px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    background:
      variant === 'primary' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
      variant === 'success' ? 'linear-gradient(135deg, #059669, #10b981)' :
      'rgba(255,255,255,0.07)',
    color: '#fff',
    width: '100%',
  }),
}

export default function FaceCapture({ onCapture, mode = 'login' }) {
  const webcamRef  = useRef(null)
  const timerRef   = useRef(null)
  const intervalRef = useRef(null)

  const [ready,      setReady]      = useState(false)
  const [recording,  setRecording]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [frames,     setFrames]     = useState([])
  const [snapshot,   setSnapshot]   = useState(null)
  const [liveness,   setLiveness]   = useState(null)
  const [checking,   setChecking]   = useState(false)
  const [statusMsg,  setStatusMsg]  = useState('Position your face in the oval and press Start')
  const [error,      setError]      = useState('')

  useEffect(() => () => {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
  }, [])

  const startRecording = useCallback(() => {
    if (!webcamRef.current) return
    setError('')
    setLiveness(null)
    setSnapshot(null)

    const collected = []
    setFrames([])
    setRecording(true)
    setProgress(0)
    setStatusMsg('Recording… look at the camera and blink naturally')

    const startTime = Date.now()

    intervalRef.current = setInterval(() => {
      const shot = webcamRef.current?.getScreenshot({ width: 640, height: 480 })
      if (shot) collected.push(shot)
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / CAPTURE_DURATION_MS) * 100, 100))
    }, FRAME_INTERVAL_MS)

    timerRef.current = setTimeout(async () => {
      clearInterval(intervalRef.current)
      setRecording(false)
      setProgress(100)

      if (collected.length < MIN_FRAMES) {
        setError('Too few frames captured. Check camera permissions and try again.')
        setStatusMsg('Position your face in the oval and press Start')
        setProgress(0)
        return
      }

      // Take a clean final snapshot for identity matching
      const finalShot = webcamRef.current?.getScreenshot({ width: 640, height: 480 })
      setSnapshot(finalShot)

      // Run liveness analysis
      setChecking(true)
      setStatusMsg('Analysing liveness…')
      try {
        const { data } = await faceApi.livenessCheck(collected)
        setLiveness(data)
        setFrames(collected)

        if (data.is_live) {
          setStatusMsg('✓ Liveness confirmed! Press the button below to continue.')
        } else {
          const reasons = []
          if (!data.blink_detected) reasons.push('no blink detected — please blink')
          if (!data.texture_ok)    reasons.push('image looks like a photo')
          if (!data.face_detected) reasons.push('no face found')
          setStatusMsg('')
          setError('Liveness failed: ' + reasons.join(', ') + '. Please try again.')
        }
      } catch (err) {
        setError(err.message || 'Liveness check failed')
        setStatusMsg('')
      } finally {
        setChecking(false)
      }
    }, CAPTURE_DURATION_MS)
  }, [])

  function handleSubmit() {
    if (!liveness?.is_live || !snapshot || frames.length < MIN_FRAMES) return
    onCapture({ frames, faceImage: snapshot })
  }

  function reset() {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
    setRecording(false)
    setProgress(0)
    setFrames([])
    setSnapshot(null)
    setLiveness(null)
    setError('')
    setStatusMsg('Position your face in the oval and press Start')
  }

  const canSubmit = liveness?.is_live && snapshot && !checking

  return (
    <div style={styles.container}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Camera feed */}
      <div style={styles.cameraWrap}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.85}
          videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
          onUserMedia={() => setReady(true)}
          onUserMediaError={() => setError('Camera access denied. Please allow camera permissions.')}
          style={styles.webcam}
          mirrored
        />
        <div style={styles.faceGuide} />
        <div style={styles.overlay(recording)} />
        {recording && (
          <div style={styles.recBadge}>
            <span style={styles.recDot} />
            REC
          </div>
        )}
        <div style={styles.progressBar(progress)} />
      </div>

      {/* Status */}
      {statusMsg && <p style={styles.statusText}>{statusMsg}</p>}
      {error     && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Liveness indicator */}
      {(recording || liveness || checking) && (
        <LivenessIndicator result={liveness} recording={recording || checking} />
      )}

      {/* Action buttons */}
      {!liveness?.is_live && !recording && !checking && (
        <button
          style={styles.btn('primary', !ready)}
          disabled={!ready}
          onClick={startRecording}
        >
          {ready ? '🎥  Start Face Scan' : 'Waiting for camera…'}
        </button>
      )}

      {(recording || checking) && (
        <button style={styles.btn('danger', true)} disabled>
          {checking ? 'Analysing…' : `Recording (${Math.round(progress)}%)`}
        </button>
      )}

      {liveness && !liveness.is_live && !recording && !checking && (
        <button style={styles.btn('primary', false)} onClick={reset}>
          🔄  Try Again
        </button>
      )}

      {canSubmit && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...styles.btn('default', false), flex: 1 }} onClick={reset}>
            Retake
          </button>
          <button style={{ ...styles.btn('success', false), flex: 2 }} onClick={handleSubmit}>
            {mode === 'signup' ? '✓  Use This Photo' : '✓  Login with Face'}
          </button>
        </div>
      )}
    </div>
  )
}
