// src/stores/users.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'

export const useUsersStore = defineStore('users', () => {
  const items   = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try { items.value = await api.get('/users') }
    finally { loading.value = false }
  }

  async function create(payload) {
    const u = await api.post('/users', payload)
    items.value.unshift(u)
    return u
  }

  async function update(id, payload) {
    const u = await api.put(`/users/${id}`, payload)
    const idx = items.value.findIndex(x => x.id === id)
    if (idx >= 0) items.value[idx] = u
    return u
  }

  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await api.patch(`/users/${id}/status`, { status: newStatus })
    const idx = items.value.findIndex(x => x.id === id)
    if (idx >= 0) items.value[idx].status = newStatus
  }

  async function remove(id) {
    await api.delete(`/users/${id}`)
    items.value = items.value.filter(x => x.id !== id)
  }

  const uniqueTeams = computed(() => [...new Set(items.value.map(u => u.team || 'No Team'))])

  return { items, loading, uniqueTeams, fetchAll, create, update, toggleStatus, remove }
})
