<!-- MyTasksView.vue -->
<template>
  <div>
    <div class="sh">
      <div>
        <h2>My Tasks</h2>
        <p>{{ taskFilter === 'active' ? activeTasks.length + ' tugas membutuhkan perhatian' : completedTasks.length + ' tugas telah diselesaikan' }}</p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button class="filter-tab" :class="{ active: taskFilter === 'active' }" @click="taskFilter = 'active'">
        🔔 Belum Selesai
        <span class="tab-count">{{ activeTasks.length }}</span>
      </button>
      <button class="filter-tab" :class="{ active: taskFilter === 'done' }" @click="taskFilter = 'done'">
        ✅ Sudah Diselesaikan
        <span class="tab-count">{{ completedTasks.length }}</span>
      </button>
    </div>

    <div v-if="displayedTasks.length === 0" class="empty">
      <div class="ei">{{ taskFilter === 'active' ? '🎉' : '📭' }}</div>
      <p>{{ taskFilter === 'active' ? 'Tidak ada tugas aktif. Kamu sudah beres!' : 'Belum ada tugas yang diselesaikan.' }}</p>
    </div>

    <div v-for="req in displayedTasks" :key="req.id" class="req-card" @click="$router.push({ name:'request-detail', params:{ id: req.id } })">
      <div class="req-card-hd">
        <div>
          <div class="req-title">{{ req.title }}</div>
          <div class="req-meta"><span>{{ req.componentName }}</span><span>·</span><span>{{ formatDate(req.updatedAt) }}</span></div>
        </div>
        <span class="badge" :class="'b-'+req.status">{{ reqStore.statusLabel(req.status) }}</span>
      </div>
      <div class="req-badges">
        <span class="badge" :class="'b-'+req.requestType">{{ req.requestType?.replace(/_/g,' ') }}</span>
        <span class="badge" :class="'b-'+(req.priority||'').toLowerCase()">{{ req.priority }}</span>
      </div>
      <div v-if="taskFilter === 'active'" class="req-actions" @click.stop>
        <button v-for="act in reqStore.getAvailableActions(req, auth.role, auth.user?.name, auth.user?.id)" :key="act.action"
          class="btn btn-sm" :class="act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-sec'"
          @click="openAction(req, act)">{{ act.icon }} {{ act.label }}</button>
      </div>
      <div v-else class="req-done-info">
        <span class="done-label">🏁 Selesai {{ formatDate(req.updatedAt) }}</span>
      </div>
    </div>

    <ActionModal v-if="actionState.show" :state="actionState" @confirm="handleAction" @cancel="actionState.show = false" />
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import ActionModal from '@/components/requests/ActionModal.vue'

const auth = useAuthStore()
const reqStore = useRequestsStore()
const ui = useUiStore()

const taskFilter = ref('active')

const activeTasks    = computed(() => reqStore.myTasks(auth.role, auth.user?.name, auth.user?.id))
const completedTasks = computed(() => reqStore.myCompletedTasks(auth.role, auth.user?.name, auth.user?.id))
const displayedTasks = computed(() => taskFilter.value === 'active' ? activeTasks.value : completedTasks.value)

const actionState = ref({ show: false })
function openAction(req, act) {
  const startLog = act.autoName ? (req.logs||[]).find(l => l.action==='start_design'||l.action==='start_redesign') : null
  actionState.value = { show:true, req, act, actorName: startLog?.actor || '' }
}
async function handleAction(payload) {
  try { await reqStore.doAction(actionState.value.req.id, payload); actionState.value.show = false; ui.showToast('Action completed!') }
  catch (e) { ui.showToast(e.message, 'err') }
}
</script>
<style scoped>
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid var(--border, #e2e8f0);
  background: var(--bg-card, #fff);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab:hover {
  border-color: var(--primary, #6366f1);
  color: var(--primary, #6366f1);
}
.filter-tab.active {
  background: var(--primary, #6366f1);
  border-color: var(--primary, #6366f1);
  color: #fff;
}
.tab-count {
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}
.filter-tab:not(.active) .tab-count {
  background: var(--bg, #f1f5f9);
  color: var(--text-secondary, #64748b);
}
.req-done-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #e2e8f0);
}
.done-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
</style>
