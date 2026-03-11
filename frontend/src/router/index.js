// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('@/views/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '',          redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard',      component: () => import('@/views/DashboardView.vue') },
        { path: 'requests',  name: 'requests',       component: () => import('@/views/RequestsView.vue') },
        { path: 'requests/:id', name: 'request-detail', component: () => import('@/views/RequestDetailView.vue') },
        { path: 'my-tasks',  name: 'my_tasks',       component: () => import('@/views/MyTasksView.vue') },
        { path: 'components',name: 'components',     component: () => import('@/views/ComponentsView.vue') },
        { path: 'audit',     name: 'audit',          component: () => import('@/views/AuditView.vue') },
        { path: 'users',     name: 'users',          component: () => import('@/views/UsersView.vue'),      meta: { adminOnly: true } },
        { path: 'menu-settings', name: 'menu_settings', component: () => import('@/views/MenuSettingsView.vue'), meta: { adminOnly: true } },
        { path: 'data-master',   name: 'data_master',   component: () => import('@/views/DataMasterView.vue'),  meta: { adminOnly: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.adminOnly && !auth.isAdmin) return '/dashboard'
  return true
})

export default router
