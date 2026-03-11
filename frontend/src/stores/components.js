// src/stores/components.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/composables/useApi'

export const useComponentsStore = defineStore('components', () => {
  const items   = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try { items.value = await api.get('/components') }
    finally { loading.value = false }
  }

  async function create(payload) {
    const c = await api.post('/components', payload)
    items.value.unshift(c)
    return c
  }

  async function update(id, payload) {
    const c = await api.put(`/components/${id}`, payload)
    const idx = items.value.findIndex(x => x.id === id)
    if (idx >= 0) items.value[idx] = c
    return c
  }

  async function remove(id) {
    await api.delete(`/components/${id}`)
    items.value = items.value.filter(x => x.id !== id)
  }

  return { items, loading, fetchAll, create, update, remove }
})
