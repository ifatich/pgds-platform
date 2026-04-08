<!-- MyTasksView.vue -->
<template>
  <div>
    <PageHeader 
      title="My Tasks" 
      :subtitle="taskFilter === 'active' ? `${activeTasks.length} tugas membutuhkan perhatian` : `${completedTasks.length} tugas telah diselesaikan`"
    />

    <!-- Filter Tabs (Bootstrap buttons) -->
    <div class="btn-group mb-4" role="group">
      <button type="button" class="btn" :class="taskFilter === 'active' ? 'btn-success' : 'btn-outline-secondary'" @click="taskFilter = 'active'">
        🔔 Belum Selesai
        <span class="badge bg-light text-dark ms-1">{{ activeTasks.length }}</span>
      </button>
      <button type="button" class="btn" :class="taskFilter === 'done' ? 'btn-success' : 'btn-outline-secondary'" @click="taskFilter = 'done'">
        ✅ Sudah Diselesaikan
        <span class="badge bg-light text-dark ms-1">{{ completedTasks.length }}</span>
      </button>
    </div>

    <!-- Empty State -->
    <EmptyState 
      v-if="displayedTasks.length === 0"
      :icon="taskFilter === 'active' ? '🎉' : '📭'"
      :message="taskFilter === 'active' ? 'Tidak ada tugas aktif. Kamu sudah beres!' : 'Belum ada tugas yang diselesaikan.'"
    />

    <!-- Task Cards -->
    <div class="row g-3">
      <div v-for="req in displayedTasks" :key="req.id" class="col-12">
        <div class="card h-100" style="cursor: pointer" @click="$router.push({ name:'request-detail', params:{ id: req.id } })">
          <div class="card-body">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div style="flex: 1; min-width: 0">
                <h5 class="mb-1">{{ req.title }}</h5>
                <div class="text-secondary" style="font-size: 12px">
                  <span>{{ req.componentName }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ formatDate(req.updatedAt) }}</span>
                </div>
              </div>
              <span class="badge" :class="'b-'+req.status" style="margin-left: 8px">{{ reqStore.statusLabel(req.status) }}</span>
            </div>

            <!-- Badges -->
            <div class="mb-3">
              <span class="badge" :class="'b-'+req.requestType" style="margin-right: 6px">{{ req.requestType?.replace(/_/g,' ') }}</span>
              <span class="badge" :class="'b-'+(req.priority||'').toLowerCase()">{{ req.priority }}</span>
            </div>

            <!-- Actions or Done Info -->
            <div v-if="taskFilter === 'active'" class="d-flex flex-wrap gap-2" @click.stop>
              <button v-for="act in reqStore.getAvailableActions(req, auth.role, auth.user?.name, auth.user?.id)" :key="act.action"
                class="btn btn-sm" :class="act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-outline-secondary'"
                @click="openAction(req, act)">{{ act.icon }} {{ act.label }}</button>
            </div>
            <div v-else class="text-success">
              <span style="font-weight: 600">🏁 Selesai {{ formatDate(req.updatedAt) }}</span>
            </div>
          </div>
        </div>
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
import { PageHeader, EmptyState } from '@/components/ui'

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
