<template>
  <div>
    <div class="sh">
      <div><h2>Component Requests</h2><p>{{ filteredItems.length }} requests ditemukan</p></div>
      <button v-if="canCreate" class="btn btn-primary" @click="showModal = true">+ New Request</button>
    </div>

    <!-- Filters -->
    <div class="fbar">
      <div class="search-wrap">
        <span class="s-ic">🔍</span>
        <input class="fi" v-model="search" placeholder="Search title, component...">
      </div>
      <select class="fs" style="width:150px" v-model="filterStatus">
        <option value="">All Status</option>
        <option v-for="s in reqStore.ALL_STATUSES" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <select class="fs" style="width:150px" v-model="filterType">
        <option value="">All Types</option>
        <option v-for="t in reqTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <select class="fs" style="width:120px" v-model="filterPriority">
        <option value="">All Priority</option>
        <option v-for="p in priorities" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="reqStore.loading" class="empty"><div class="ei">⏳</div><p>Loading...</p></div>

    <!-- Empty -->
    <div v-else-if="filteredItems.length === 0" class="empty"><div class="ei">📋</div><p>Tidak ada request ditemukan</p></div>

    <!-- Cards -->
    <div v-else>
      <div v-for="req in paginated" :key="req.id" class="req-card" @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
        <div class="req-card-hd">
          <div>
            <div class="req-title">{{ req.title }}</div>
            <div class="req-meta">
              <span>{{ req.componentName }}</span>
              <span>·</span>
              <span>{{ formatDate(req.updatedAt) }}</span>
            </div>
          </div>
          <span class="badge" :class="'b-'+req.status">{{ reqStore.statusLabel(req.status) }}</span>
        </div>
        <div class="req-badges">
          <span class="badge" :class="'b-'+req.requestType">{{ req.requestType?.replace(/_/g,' ') }}</span>
          <span class="badge" :class="'b-'+(req.priority||'').toLowerCase()">{{ req.priority }}</span>
          <span class="badge" :class="'b-'+req.requesterRole">{{ req.requesterRole }}</span>
          <!-- Requester name + team -->
          <span v-if="reqStore.getRequesterName(req)" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;background:var(--s100);color:var(--s600);border-radius:20px;padding:2px 8px;font-weight:600">
            📝 {{ reqStore.getRequesterName(req) }}<span v-if="reqStore.getRequesterTeam(req)" style="font-weight:400;opacity:.75">· {{ reqStore.getRequesterTeam(req) }}</span>
          </span>
          <!-- Assignee badges -->
          <span v-if="reqStore.getDesignerOwner(req)" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;background:var(--purplel,#f3e8ff);color:var(--purple,#7c3aed);border-radius:20px;padding:2px 8px;font-weight:600">
            🎨 {{ reqStore.getDesignerOwner(req) }}
          </span>
          <span v-if="reqStore.getEngineerOwner(req)" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;background:var(--bluel,#dbeafe);color:var(--blue,#1d4ed8);border-radius:20px;padding:2px 8px;font-weight:600">
            ⚙️ {{ reqStore.getEngineerOwner(req) }}
          </span>
        </div>
        <!-- Available actions -->
        <div class="req-actions" v-if="availableActions(req).length > 0" @click.stop>
          <button v-for="act in availableActions(req)" :key="act.action"
            class="btn btn-sm" :class="act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-sec'"
            @click="openAction(req, act)">
            {{ act.icon }} {{ act.label }}
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pag">
        <span class="pg-info">{{ filteredItems.length }} total · hal {{ page }} dari {{ totalPages }}</span>
        <button class="pgb" :disabled="page <= 1" @click="page--">‹</button>
        <button v-for="p in pageNumbers" :key="p" class="pgb" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
        <button class="pgb" :disabled="page >= totalPages" @click="page++">›</button>
      </div>
    </div>

    <!-- New Request Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="overlay" @click.self="showModal = false">
          <div class="modal lg">
            <div class="mh"><h2>New Component Request</h2><button class="btn btn-ghost btn-icon" @click="showModal = false">✕</button></div>
            <RequestForm @submit="handleCreate" @cancel="showModal = false" />
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Action Modal -->
    <ActionModal v-if="actionState.show" :state="actionState" @confirm="handleAction" @cancel="actionState.show = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import RequestForm from '@/components/requests/RequestForm.vue'
import ActionModal from '@/components/requests/ActionModal.vue'

const auth     = useAuthStore()
const reqStore = useRequestsStore()
const ui       = useUiStore()

const search         = ref('')
const filterStatus   = ref('')
const filterType     = ref('')
const filterPriority = ref('')
const page           = ref(1)
const PAGE_SIZE      = 12
const showModal      = ref(false)
const actionState    = ref({ show: false })

const canCreate = computed(() => ['developer','designer','super_admin'].includes(auth.role))

const reqTypes = [
  { value:'new_component', label:'New Component' }, { value:'component_variant', label:'Variant' },
  { value:'component_enhancement', label:'Enhancement' }, { value:'component_redesign', label:'Redesign' },
  { value:'component_bug_fix', label:'Bug Fix' }, { value:'documentation_update', label:'Documentation' },
]
const priorities = ['Critical','High','Medium','Low']

const filteredItems = computed(() => reqStore.items.filter(r => {
  if (search.value && !r.title.toLowerCase().includes(search.value.toLowerCase()) && !(r.componentName||'').toLowerCase().includes(search.value.toLowerCase())) return false
  if (filterStatus.value   && r.status !== filterStatus.value)           return false
  if (filterType.value     && r.requestType !== filterType.value)         return false
  if (filterPriority.value && r.priority !== filterPriority.value)        return false
  return true
}))

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))
const paginated  = computed(() => filteredItems.value.slice((page.value-1)*PAGE_SIZE, page.value*PAGE_SIZE))
const pageNumbers= computed(() => {
  const pages = []
  for (let i = Math.max(1, page.value-2); i <= Math.min(totalPages.value, page.value+2); i++) pages.push(i)
  return pages
})

function availableActions(req) { return reqStore.getAvailableActions(req, auth.role, auth.user?.name, auth.user?.id) }

function openAction(req, act) {
  const startLog = act.autoName ? (req.logs||[]).find(l => l.action==='start_design' || l.action==='start_redesign') : null
  actionState.value = { show:true, req, act, actorName: startLog?.actor || '' }
}

async function handleAction(payload) {
  try {
    await reqStore.doAction(actionState.value.req.id, payload)
    actionState.value.show = false
    ui.showToast(`${payload.action} completed!`)
  } catch (e) { ui.showToast(e.message, 'err') }
}

async function handleCreate(payload) {
  try {
    await reqStore.create(payload)
    showModal.value = false
    ui.showToast('✅ Request submitted!')
  } catch (e) { ui.showToast(e.message, 'err') }
}
</script>
