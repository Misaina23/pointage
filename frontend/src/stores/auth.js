import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token') || null,
    isAuthenticated: false,
  }),

  getters: {
    userName: (state) => state.user?.name || '',
    userEmail: (state) => state.user?.email || '',
  },

  actions: {
    async login(credentials) {
      try {
        const response = await api.post('/auth/login', credentials)
        this.setAuth(response.data.user, response.data.token)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async register(userData) {
      try {
        const response = await api.post('/auth/register', userData)
        this.setAuth(response.data.user, response.data.token)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },

    async fetchUser() {
      if (!this.token) return null
      try {
        const response = await api.get('/auth/user')
        this.user = response.data
        this.isAuthenticated = true
        return this.user
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async updatePassword(passwordData) {
      try {
        const response = await api.put('/auth/password', passwordData)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async forgotPassword(data) {
      try {
        const response = await api.post('/auth/forgot-password', data)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async resetPassword(data) {
      try {
        const response = await api.post('/auth/reset-password', data)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async verifyEmail(data) {
      try {
        const response = await api.get(`/auth/verify-email/${data.id}/${data.hash}`)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async sendEmailVerification() {
      try {
        const response = await api.post('/auth/email/verification-notification')
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    setAuth(user, token) {
      this.user = user
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    },

    initializeAuth() {
      const token = localStorage.getItem('auth_token')
      const user = localStorage.getItem('user')
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        this.isAuthenticated = true
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    },
  },
})