import React, { createContext, useState, useEffect, useContext } from 'react'
import axiosInstance from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('access_token'))

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchCurrentUser = async () => {
    try {
      const response = await axiosInstance.get('/auth/me')
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = (accessToken, user) => {
    localStorage.setItem('access_token', accessToken)
    setToken(accessToken)
    setCurrentUser(user)
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setCurrentUser(null)
    delete axiosInstance.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
