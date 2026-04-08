<template>
  <div>
    <!-- Section Header -->
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <h2 class="h3 fw-bold mb-1">Component Requests</h2>
        <p class="text-secondary fs-6 mb-0">{{ filteredItems.length }} requests ditemukan</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newRequestModal">
        + New Request
      </button>
    </div>

    <!-- Filters -->
    <div class="row g-2 mb-4">
      <div class="col-12 col-sm-auto flex-grow-1">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">🔍</span>
          <input 
            type="text" 
            class="form-control border-start-0" 
            v-model="search" 
            placeholder="Search title, component..."
          >
        </div>
      </div>
      <div class="col-6 col-sm-auto">
        <select class="form-select" v-model="filterStatus">
          <option value="">All Status</option>
          <option v-for="s in reqStore.ALL_STATUSES" :key="s.key" :value="s.key">{{ s.label }}</option>
        </select>
      </div>
      <div class="col-6 col-sm-auto">
        <select class="form-select" v-model="filterType">
          <option value="">All Types</option>
          <option v-for="t in reqTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="col-12 col-sm-auto">
        <select class="form-select" v-model="filterPriority">
          <option value="">All Priority</option>
          <option v-for="p in priorities" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="reqStore.loading" class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <p>Loading...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <div class="empty-state-icon">📋</div>
      <p>Tidak ada request ditemukan</p>
    </div>

    <!-- Request Cards Grid -->
    <div v-else class="row g-3">
      <div v-for="req in paginated" :key="req.id" class="col-12">
        <div class="card card-hover cursor-pointer" @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
          <div class="card-body pb-2">
            <!-- Header: Title and Status Badge -->
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="flex-grow-1">
                <h5 class="card-title fw-bold mb-1">{{ req.title }}</h5>
                <p class="card-text text-secondary small mb-0">
                  <span>{{ req.componentName }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ formatDate(req.updatedAt) }}</span>
                </p>
              </div>
              <span class="badge ms-2" :class="'b-'+req.status">
                {{ reqStore.statusLabel(req.status) }}
              </span>
            </div>

            <!-- Badges Row -->
            <div class="d-flex flex-wrap gap-2 mb-3">
              <span class="badge badge-pill" :class="'b-'+req.requestType">
                {{ req.requestType?.replace(/_/g,' ') }}
              </span>
              <span class="badge badge-pill" :class="'b-'+(req.priority||'').toLowerCase()">
                {{ req.priority }}
              </span>
              <span class="badge badge-pill" :class="'b-'+req.requesterRole">
                {{ req.requesterRole }}
              </span>
              
              <!-- Requester -->
              <span 
                v-if="reqStore.getRequesterName(req)" 
                class="badge badge-pill"
                style="background: var(--s100); color: var(--s600);"
              >
                📝 {{ reqStore.getRequesterName(req) }}
                <span v-if="reqStore.getRequesterTeam(req)" class="opacity-75">
                  · {{ reqStore.getRequesterTeam(req) }}
                </span>
              </span>

              <!-- Designer Owner -->
              <span 
                v-if="reqStore.getDesignerOwner(req)" 
                class="badge badge-pill"
                style="background: var(--purplel); color: var(--purple);"
              >
                🎨 {{ reqStore.getDesignerOwner(req) }}
              </span>

              <!-- Engineer Owner -->
              <span 
                v-if="reqStore.getEngineerOwner(req)" 
                class="badge badge-pill"
                style="background: var(--bluel); color: var(--blue);"
              >
                ⚙️ {{ reqStore.getEngineerOwner(req) }}
              </span>
            </div>

            <!-- Actions -->
            <div v-if="availableActions(req).length > 0" class="d-flex flex-wrap gap-2" @click.stop>
              <button 
                v-for="act in availableActions(req)" 
                :key="act.action"
                class="btn btn-sm"
                :class="[
                  act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-outline-secondary'
                ]"
                @click="openAction(req, act)"
              >
                {{ act.icon }} {{ act.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" aria-label="Page navigation" class="mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-secondary small">
          {{ filteredItems.length }} total · page {{ page }} of {{ totalPages }}
        </span>
      </div>
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: page <= 1 }">
          <button class="page-link" @click="page--">‹ Previous</button>
        </li>
        <li v-for="p in pageNumbers" :key="p" class="page-item" :class="{ active: p === page }">
          <button class="page-link" @click="page = p">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page >= totalPages }">
          <button class="page-link" @click="page++">Next ›</button>
        </li>
      </ul>
    </nav>

    <!-- New Request Modal (Pure Bootstrap) -->
    <div class="modal fade" id="newRequestModal" tabindex="-1" aria-labelledby="newRequestModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="newRequestModalLabel">New Component Request</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <RequestForm @submit="handleCreate" @cancel="() => { const modal = bootstrap.Modal.getInstance(document.getElementById('newRequestModal')); modal.hide(); }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <ActionModal v-if="actionState.show" :state="actionState" @confirm="handleAction" @cancel="actionState.show = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useResearchStore } from '@/stores/research'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import RequestForm from '@/components/requests/RequestForm.vue'
import ActionModal from '@/components/requests/ActionModal.vue'

const auth           = useAuthStore()
const reqStore       = useRequestsStore()
const researchStore  = useResearchStore()
const ui             = useUiStore()

const search         = ref('')
const filterStatus   = ref('')
const filterType     = ref('')
const filterPriority = ref('')
const page           = ref(1)
const PAGE_SIZE      = 12
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
    const isResearch = payload.requestType && payload.requestType.startsWith('research')
    
    if (isResearch) {
      const researchPayload = {
        whatWeHelp: payload.requestType.replace('research_', '').replace(/_/g, ' '),
        projectName: payload.projectName,
        problemDescription: payload.problemDescription,
        timelineQuarter: payload.timelineQuarter,
        department: payload.department || null,
        attachmentName: payload.attachmentName || null,
        attachmentDataUrl: payload.attachmentDataUrl || null,
      }
      await researchStore.create(researchPayload)
    } else {
      await reqStore.create(payload)
    }
    // Close modal
    const modalElement = document.getElementById('newRequestModal')
    const modal = window.bootstrap.Modal.getInstance(modalElement)
    if (modal) modal.hide()
    ui.showToast('✅ Request submitted!')
  } catch (e) { ui.showToast(e.message, 'err') }
}
</script>
