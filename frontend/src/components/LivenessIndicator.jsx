// LivenessIndicator — shows per-check status during face capture

const checks = [
  { key: 'face_detected', label: 'Face detected' },
  { key: 'blink_detected', label: 'Eye blink' },
  { key: 'head_movement', label: 'Head movement' },
  { key: 'texture_ok',    label: 'Liveness texture' },
]

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
  },
  dot: (state) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    background:
      state === 'pass'    ? '#4ade80' :
      state === 'fail'    ? '#f87171' :
      state === 'pending' ? '#facc15' :
      '#4b5563',
    boxShadow:
      state === 'pass'    ? '0 0 6px #4ade8088' :
      state === 'fail'    ? '0 0 6px #f8717188' :
      state === 'pending' ? '0 0 6px #facc1588' :
      'none',
    transition: 'all 0.3s ease',
  }),
  label: (state) => ({
    color:
      state === 'pass'    ? '#86efac' :
      state === 'fail'    ? '#fca5a5' :
      state === 'pending' ? '#fde68a' :
      '#6b7280',
    transition: 'color 0.3s ease',
  }),
}

export default function LivenessIndicator({ result, recording }) {
  function getState(key) {
    if (!result) return recording ? 'pending' : 'idle'
    return result[key] ? 'pass' : 'fail'
  }

  return (
    <div style={styles.wrapper}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Security checks
      </div>
      {checks.map(({ key, label }) => {
        const state = getState(key)
        return (
          <div key={key} style={styles.row}>
            <span style={styles.dot(state)} />
            <span style={styles.label(state)}>{label}</span>
            {state === 'pending' && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b7280' }}>
                analysing…
              </span>
            )}
            {state === 'pass' && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#4ade80' }}>✓</span>
            )}
            {state === 'fail' && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#f87171' }}>✗</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
