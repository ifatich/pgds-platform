// src/stores/menu.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'
import { useAuthStore } from './auth'

export const ALL_MENU_ITEMS = [
  { id:'dashboard',  view:'dashboard',  label:'Dashboard',         icon:'🏠', group:'Overview', description:'Ringkasan & KPI dashboard',           required:true  },
  { id:'requests',   view:'requests',   label:'All Requests',      icon:'📋', group:'Requests', description:'Daftar semua component request',      required:true  },
  { id:'my_tasks',   view:'my_tasks',   label:'My Tasks',          icon:'✅', group:'Requests', description:'Task yang perlu ditindaklanjuti',     required:false },
  { id:'components', view:'components', label:'Component Library', icon:'📦', group:'Library',  description:'Library komponen design system',      required:false },
  { id:'audit',      view:'audit',      label:'Audit Program',     icon:'🔍', group:'Audit',    description:'Workflow audit komponen',             required:false },
]

const DEFAULT = {
  designer:  { dashboard:true, requests:true, my_tasks:true, components:true, audit:true },
  engineer:  { dashboard:true, requests:true, my_tasks:true, components:true, audit:true },
  developer: { dashboard:true, requests:true, my_tasks:false, components:true, audit:false },
  admin_disabled: { dashboard:false, requests:false, my_tasks:false, components:false, audit:false },
}

export const useMenuStore = defineStore('menu', () => {
  const settings = ref({ ...DEFAULT })

  async function fetchSettings() {
    try {
      const data = await api.get('/menu-settings')
      if (data && Object.keys(data).length) settings.value = data
    } catch { /* use defaults */ }
  }

  async function saveSettings() {
    await api.put('/menu-settings', settings.value)
  }

  function toggleMenu(role, itemId) {
    settings.value[role][itemId] = !settings.value[role][itemId]
  }

  function toggleAdminDisabled(itemId) {
    if (!settings.value.admin_disabled) settings.value.admin_disabled = {}
    settings.value.admin_disabled[itemId] = !settings.value.admin_disabled[itemId]
  }

  function isAdminDisabled(itemId) {
    return !!(settings.value.admin_disabled || {})[itemId]
  }

  function enableAllAdmin() {
    if (!settings.value.admin_disabled) settings.value.admin_disabled = {}
    ALL_MENU_ITEMS.forEach(m => { settings.value.admin_disabled[m.id] = false })
  }

  function disableAllAdmin() {
    if (!settings.value.admin_disabled) settings.value.admin_disabled = {}
    ALL_MENU_ITEMS.forEach(m => { settings.value.admin_disabled[m.id] = true })
  }

  function enableAll(role) {
    ALL_MENU_ITEMS.forEach(m => { settings.value[role][m.id] = true })
  }

  function disableOptional(role) {
    ALL_MENU_ITEMS.forEach(m => { if (!m.required) settings.value[role][m.id] = false })
  }

  function resetDefaults() {
    settings.value = JSON.parse(JSON.stringify(DEFAULT))
  }

  // Items visible to admin (all items, but carries disabled flag)
  const adminVisibleItems = computed(() => {
    return ALL_MENU_ITEMS.map(m => ({ ...m, disabledForAdmin: isAdminDisabled(m.id) }))
  })

  const adminVisibleGroups = computed(() => {
    const groups = {}
    adminVisibleItems.value.forEach(item => {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    })
    return Object.entries(groups).map(([group, items]) => ({ group, items }))
  })

  const visibleItems = computed(() => {
    const auth = useAuthStore()
    const role = auth.role
    if (role === 'super_admin') return ALL_MENU_ITEMS
    const enabled = settings.value[role] || {}
    return ALL_MENU_ITEMS.filter(m => enabled[m.id])
  })

  const visibleGroups = computed(() => {
    const groups = {}
    visibleItems.value.forEach(item => {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    })
    return Object.entries(groups).map(([group, items]) => ({ group, items }))
  })

  return { settings, visibleItems, visibleGroups, adminVisibleItems, adminVisibleGroups, isAdminDisabled, fetchSettings, saveSettings, toggleMenu, toggleAdminDisabled, enableAll, disableOptional, enableAllAdmin, disableAllAdmin, resetDefaults }
})

// ── UI (toast, etc.) ────────────────────────────────────────────────────────
export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])

  function showToast(message, type = 'ok') {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ id, message, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
  }

  return { toasts, showToast }
})
