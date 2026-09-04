import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('qx_user')
    const storedAdmin = localStorage.getItem('qx_admin')
    if (storedUser) setUser(JSON.parse(storedUser))
    if (storedAdmin) setAdmin(JSON.parse(storedAdmin))
    setLoading(false)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await api.getUserProfile(user.id)
      if (data?.user) {
        const updated = { ...user, ...data.user }
        setUser(updated)
        localStorage.setItem('qx_user', JSON.stringify(updated))
      }
    } catch {}
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(refreshUser, 30000)
    return () => clearInterval(interval)
  }, [user?.id, refreshUser])

  const loginUser = (userData, token) => {
    localStorage.setItem('qx_token', token)
    localStorage.setItem('qx_user', JSON.stringify(userData))
    setUser(userData)
  }

  const loginAdmin = (adminData, token) => {
    localStorage.setItem('qx_admin_token', token)
    localStorage.setItem('qx_admin', JSON.stringify(adminData))
    setAdmin(adminData)
  }

  const logoutUser = () => {
    localStorage.removeItem('qx_token')
    localStorage.removeItem('qx_user')
    setUser(null)
  }

  const logoutAdmin = () => {
    localStorage.removeItem('qx_admin_token')
    localStorage.removeItem('qx_admin')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ user, admin, loading, loginUser, loginAdmin, logoutUser, logoutAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
