import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null)
  const [token, setToken] = useState(null)
  const [ready, setReady] = useState(false)

  // Rehydrate from localStorage on first load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('fa_token')
      const storedUser  = localStorage.getItem('fa_user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (_) {}
    setReady(true)
  }, [])

  function login(tokenData) {
    const userObj = {
      id:    tokenData.user_id,
      name:  tokenData.name,
      email: tokenData.email,
    }
    setToken(tokenData.access_token)
    setUser(userObj)
    localStorage.setItem('fa_token', tokenData.access_token)
    localStorage.setItem('fa_user',  JSON.stringify(userObj))
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('fa_token')
    localStorage.removeItem('fa_user')
  }

  if (!ready) return null   // avoid flash of unauthenticated content

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
