import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach JWT token from localStorage if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalise error messages
api.interceptors.response.use(
  res => res,
  err => {
    const msg =
      err?.response?.data?.detail ||
      err?.message ||
      'Something went wrong'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
  }
)

// ── Auth endpoints ─────────────────────────────────────────────────────────

export const authApi = {
  signup: (name, email, password, faceImage) =>
    api.post('/auth/signup', { name, email, password, face_image: faceImage }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
}

// ── Face endpoints ─────────────────────────────────────────────────────────

export const faceApi = {
  livenessCheck: (frames) =>
    api.post('/face/liveness-check', { frames }),

  faceLogin: (frames, faceImage) =>
    api.post('/face/login', { frames, face_image: faceImage }),
}

export default api
