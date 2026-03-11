// src/stores/dataMaster.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/composables/useApi'

export const useDataMasterStore = defineStore('dataMaster', () => {
  const settings = ref({
    requestTypes: [],
    platforms: [],
    priorities: [],
    impactLevels: [],
    stateRequirements: [],
    responsiveBehaviours: [],
  })
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try { settings.value = await api.get('/data-master') }
    finally { loading.value = false }
  }

  async function save(payload) {
    settings.value = await api.put('/data-master', payload)
  }

  return { settings, loading, fetchAll, save }
})
