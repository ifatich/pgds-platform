<template>
  <div id="app">
    <!-- SIDEBAR -->
    <nav class="sidebar">
      <div class="sb-logo">
        <div class="sb-logo-row">
          <div class="sb-icon">P</div>
          <div class="sb-name">Pegadaian DS<small>Component Platform</small></div>
        </div>
      </div>

      <div class="sb-nav">
        <template v-for="group in (auth.isAdmin ? menu.adminVisibleGroups : menu.visibleGroups)" :key="group.group">
          <div class="sb-label" style="margin-top:6px">{{ group.group }}</div>
          <div v-for="item in group.items" :key="item.id"
            class="sb-item" :class="{ active: isActive(item.view) }"
            :style="item.disabledForAdmin ? 'opacity:.4;pointer-events:none;cursor:not-allowed' : ''"
            :title="item.disabledForAdmin ? item.label + ' (Disabled untuk Admin)' : ''"
            @click="!item.disabledForAdmin && navigate(item.view)">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="menuIcons[item.id]"></svg>
            {{ item.label }}
            <span v-if="item.view === 'requests' && reqStore.myTasks(auth.role).length > 0 && auth.role !== 'developer'" class="sb-badge">{{ reqStore.myTasks(auth.role).length }}</span>
            <span v-if="item.view === 'my_tasks' && reqStore.myTasks(auth.role).length > 0" class="sb-badge">{{ reqStore.myTasks(auth.role).length }}</span>
            <span v-if="item.view === 'audit' && reqStore.auditQueue.value?.length > 0" class="sb-badge warn" style="background:var(--orange)">{{ reqStore.auditQueue.value.length }}</span>
          </div>
        </template>

        <!-- Admin section -->
        <template v-if="auth.isAdmin">
          <div class="sb-label" style="margin-top:6px">Admin</div>
          <div class="sb-item" :class="{ active: isActive('users') }" @click="navigate('users')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            User Management
            <span class="sb-badge green">{{ userStore.items.length }}</span>
          </div>
          <div class="sb-item" :class="{ active: isActive('menu_settings') }" @click="navigate('menu_settings')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h7"/><circle cx="17" cy="18" r="3"/>
            </svg>
            Menu Settings
          </div>
          <div class="sb-item" :class="{ active: isActive('data_master') }" @click="navigate('data_master')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16M4 12h10M4 17h13"/><circle cx="17" cy="17" r="3"/><path d="M17 15v2l1 1"/>
            </svg>
            Data Master
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="sb-footer">
        <div v-if="auth.user" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,.05);border-radius:var(--r8);margin-bottom:10px">
          <div :style="`width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;background:${roleColor}`">
            {{ initials }}
          </div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ auth.user.name }}</div>
            <div style="font-size:10.5px;color:var(--s400)">{{ auth.user.team || auth.role }}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;color:var(--s400);margin-top:4px" @click="logout">
          ← Logout
        </button>
      </div>
    </nav>

    <!-- MAIN -->
    <div class="main">
      <div class="topbar">
        <div class="tb-title">{{ pageTitle }}</div>
        <div class="tb-right">
          <span class="role-pill" :class="auth.role">{{ roleLabel }}</span>
          <div style="display:flex;align-items:center;gap:7px;padding:4px 10px;background:var(--s100);border-radius:20px;border:1px solid var(--s200)">
            <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff" :style="`background:${roleColor}`">{{ initials }}</div>
            <span style="font-size:12.5px;font-weight:600;color:var(--navy)">{{ auth.user?.name }}</span>
          </div>
          <slot name="actions" />
        </div>
      </div>

      <div class="pb">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { useRequestsStore } from '@/stores/requests'
import { useUsersStore } from '@/stores/users'
import { useComponentsStore } from '@/stores/components'
import { useDataMasterStore } from '@/stores/dataMaster'

const router    = useRouter()
const route     = useRoute()
const auth      = useAuthStore()
const menu      = useMenuStore()
const reqStore  = useRequestsStore()
const userStore = useUsersStore()
const compStore = useComponentsStore()
const dmStore   = useDataMasterStore()

// Load data
onMounted(async () => {
  await Promise.all([
    reqStore.fetchAll(),
    compStore.fetchAll(),
    dmStore.fetchAll(),
    auth.isAdmin ? userStore.fetchAll() : Promise.resolve(),
  ])
})

const menuIcons = {
  dashboard:  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  requests:   '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
  my_tasks:   '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
  components: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  audit:      '<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>',
}

const viewTitles = {
  dashboard: 'Dashboard', requests: 'Component Requests', my_tasks: 'My Tasks',
  components: 'Component Library', audit: 'Audit Program', users: 'User Management',
  menu_settings: 'Menu Settings', data_master: 'Data Master',
}

const pageTitle = computed(() => viewTitles[route.name] || '')

const roleLabels = { super_admin:'Super Admin', designer:'Designer', engineer:'Engineer', developer:'Developer' }
const roleLabel  = computed(() => roleLabels[auth.role] || auth.role)

const roleColors = { super_admin:'var(--gd)', designer:'var(--purple)', engineer:'var(--blue)', developer:'var(--orange)' }
const roleColor  = computed(() => roleColors[auth.role] || 'var(--s500)')

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
})

function isActive(viewName) {
  return route.name === viewName || route.name === 'request-detail' && viewName === 'requests'
}

function navigate(viewName) {
  const nameMap = { my_tasks:'my_tasks', menu_settings:'menu_settings' }
  router.push({ name: nameMap[viewName] || viewName })
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
