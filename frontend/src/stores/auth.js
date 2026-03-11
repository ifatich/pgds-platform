// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('pgds_user') || 'null'))
  const token = ref(localStorage.getItem('pgds_token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const role       = computed(() => user.value?.role || null)
  const isAdmin    = computed(() => role.value === 'super_admin')

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('pgds_token', data.token)
    localStorage.setItem('pgds_user',  JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value  = null
    localStorage.removeItem('pgds_token')
    localStorage.removeItem('pgds_user')
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const data = await api.get('/auth/me')
      user.value = data
      localStorage.setItem('pgds_user', JSON.stringify(data))
    } catch {
      logout()
    }
  }

  return { user, token, isLoggedIn, role, isAdmin, login, logout, fetchMe }
})
