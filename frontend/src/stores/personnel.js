import { defineStore } from 'pinia'
import api from '@/services/api'

export const usePersonnelStore = defineStore('personnel', {
  state: () => ({
    personnels: [],
    currentPersonnel: null,
    directions: [],
    loading: false,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  }),

  getters: {
    getPersonnelById: (state) => (id) => state.personnels.find(p => p.id === id),
  },

  actions: {
    async fetchPersonnels(params = {}) {
      this.loading = true
      try {
        const response = await api.get('/personnel', { params })
        this.personnels = response.data.data
        this.pagination = {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total,
        }
        return response.data
      } catch (error) {
        throw error.response?.data || error
      } finally {
        this.loading = false
      }
    },

    async fetchDirections() {
      try {
        const response = await api.get('/directions')
        this.directions = response.data
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async createDirection(data) {
      try {
        const response = await api.post('/directions', data)
        this.directions.push(response.data)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async updateDirection(id, data) {
      try {
        const response = await api.put(`/directions/${id}`, data)
        const index = this.directions.findIndex(d => d.id === id)
        if (index !== -1) {
          this.directions[index] = response.data
        }
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async deleteDirection(id) {
      try {
        await api.delete(`/directions/${id}`)
        this.directions = this.directions.filter(d => d.id !== id)
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async fetchPersonnel(id) {
      this.loading = true
      try {
        const response = await api.get(`/personnel/${id}`)
        this.currentPersonnel = response.data
        return response.data
      } catch (error) {
        throw error.response?.data || error
      } finally {
        this.loading = false
      }
    },

    async createPersonnel(data) {
      try {
        const response = await api.post('/personnel', data)
        this.personnels.unshift(response.data.personnel || response.data)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async updatePersonnel(id, data) {
      try {
        const response = await api.put(`/personnel/${id}`, data)
        const index = this.personnels.findIndex(p => p.id === id)
        if (index !== -1) {
          this.personnels[index] = response.data
        }
        if (this.currentPersonnel?.id === id) {
          this.currentPersonnel = response.data
        }
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async deletePersonnel(id) {
      try {
        await api.delete(`/personnel/${id}`)
        this.personnels = this.personnels.filter(p => p.id !== id)
      } catch (error) {
        throw error.response?.data || error
      }
    },
  },
})