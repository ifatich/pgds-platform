<template>
  <div>
    <PageHeader 
      title="All Requests" 
      :subtitle="`${filteredItems.length} requests ditemukan`"
      actionLabel="+ New Request"
      @action="openNewRequestModal"
    />

    <!-- Filters -->
    <div class="row g-2 mb-4">
      <div class="col-12 col-sm-auto flex-grow-1">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">🔍</span>
          <input 
            type="text" 
            class="form-control border-start-0 p-2" 
            v-model="search" 
            placeholder="Search title, component..."
          >
        </div>
      </div>
      <div class="col-6 col-sm-auto">
        <Dropdown 
          :model-value="filterRequestType"
          :options="requestTypeOptions"
          placeholder="All Request Types"
          variant="outline-secondary"
          size="sm"
          @update:model-value="filterRequestType = $event"
        />
      </div>
      <div class="col-6 col-sm-auto">
        <Dropdown 
          :model-value="filterStatus"
          :options="statusOptions"
          placeholder="All Status"
          variant="outline-secondary"
          size="sm"
          @update:model-value="filterStatus = $event"
        />
      </div>
    </div>

    <!-- Loading State -->
    <EmptyState 
      v-if="reqStore.loading"
      icon="⏳"
      message="Loading..."
    />

    <!-- Empty State -->
    <EmptyState 
      v-else-if="filteredItems.length === 0"
      icon="📋"
      message="Tidak ada request ditemukan"
    />

    <!-- Request Cards Grid -->
    <div v-else class="row g-3">
      <div v-for="req in paginated" :key="req.id" class="col-12">
        <div class="card card-hover cursor-pointer">
          <div class="card-body pb-2">
            <!-- Header: Title and Status Badge -->
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="flex-grow-1" @click="handleCardClick(req)">
                <h5 class="card-title fw-bold mb-1">{{ req.title || req.projectName }}</h5>
                
                <p class="card-text text-secondary small mb-0">
                  <span>{{ req.componentName || req.whatWeHelp || req.requestType?.replace(/_/g,' ') }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ formatDate(req.updatedAt) }}</span>
                </p>
              </div>
              <span class="badge ms-2" :class="statusBadgeClass(req)">
                {{ getStatusLabel(req) }}
              </span>
            </div>

            <!-- Badges Row -->
            <div class="d-flex flex-wrap gap-2 mb-3">
              <span class="badge badge-pill" :class="'b-'+req.requestType">
                {{ req.requestType?.replace(/_/g,' ') }}
              </span>
              <span v-if="req.priority" class="badge badge-pill" :class="'b-'+(req.priority||'').toLowerCase()">
                {{ req.priority }}
              </span>
              <span v-if="req.platform" class="badge badge-pill bg-light text-dark border">
                {{ req.platform }}
              </span>
              <span v-if="req.timelineQuarter" class="badge badge-pill bg-light text-dark border">
                {{ req.timelineQuarter }}
              </span>
              
              <span class="badge badge-pill" :class="'b-'+req.requesterRole">
                {{ req.requesterRole || 'User' }}
              </span>
              
              <!-- Requester -->
              <span 
                v-if="getRequesterName(req)" 
                class="badge badge-pill"
                style="background: var(--s100); color: var(--s600);"
              >
                📝 {{ getRequesterName(req) }}
              </span>
            </div>

            <!-- Actions -->
            <div v-if="getAvailableActions(req).length > 0" class="d-flex flex-wrap gap-2" @click.stop>
              <button 
                v-for="act in getAvailableActions(req)" 
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
            <RequestForm ref="formRef" @submit="handleCreate" @cancel="() => { const modal = bootstrap.Modal.getInstance(document.getElementById('newRequestModal')); modal.hide(); }" />
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useResearchStore } from '@/stores/research'
import { useDataMasterStore } from '@/stores/dataMaster'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import RequestForm from '@/components/requests/RequestForm.vue'
import ActionModal from '@/components/requests/ActionModal.vue'
import { PageHeader, EmptyState, Dropdown } from '@/components/ui'
import { Modal as BootstrapModal } from 'bootstrap'

const router         = useRouter()
const auth           = useAuthStore()
const reqStore       = useRequestsStore()
const researchStore  = useResearchStore()
const dmStore        = useDataMasterStore()
const ui             = useUiStore()

const search         = ref('')
const filterRequestType = ref('') // 'component', 'research', atau ''
const filterStatus   = ref('')
const page           = ref(1)
const PAGE_SIZE      = 12
const actionState    = ref({ show: false })
const formRef         = ref(null)

const canCreate = computed(() => ['developer','designer','super_admin'].includes(auth.role))

// Dropdown options for selects
const requestTypeOptions = computed(() => [
  { value: '', label: 'All Request Types' },
  { value: 'component', label: '⚙️ Component Requests' },
  { value: 'research', label: '📚 Research Requests' }
])

const statusOptions = computed(() => [
  { value: '', label: 'All Status' },
  ...(filterRequestType.value === 'research' 
    ? researchStore.ALL_STATUSES?.map(s => ({ value: s.key, label: s.label })) || []
    : reqStore.ALL_STATUSES?.map(s => ({ value: s.key, label: s.label })) || []
  )
])

// Combine requests from both stores
const allRequests = computed(() => {
  const components = (reqStore.items || []).map(r => ({ ...r, _type: 'component' }))
  const research = (researchStore.items || []).map(r => ({ ...r, _type: 'research' }))
  return [...components, ...research].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const filteredItems = computed(() => {
  return allRequests.value.filter(r => {
    // Filter by request type (component vs research)
    if (filterRequestType.value === 'component' && r._type !== 'component') return false
    if (filterRequestType.value === 'research' && r._type !== 'research') return false
    
    // Filter by search
    if (search.value) {
      const searchLower = search.value.toLowerCase()
      const searchIn = r._type === 'component' 
        ? `${r.title} ${r.componentName}`.toLowerCase()
        : `${r.projectName} ${r.whatWeHelp}`.toLowerCase()
      if (!searchIn.includes(searchLower)) return false
    }
    
    // Filter by status
    if (filterStatus.value && r.status !== filterStatus.value) return false
    
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))
const paginated  = computed(() => filteredItems.value.slice((page.value-1)*PAGE_SIZE, page.value*PAGE_SIZE))
const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

// Helper functions
function isComponentRequest(req) {
  return req._type === 'component'
}

function statusBadgeClass(req) {
  return req._type === 'component'
    ? 'b-' + req.status
    : 'b-' + (researchStore.statusBadgeClass?.(req.status) || req.status)
}

function getStatusLabel(req) {
  return req._type === 'component'
    ? reqStore.statusLabel(req.status)
    : researchStore.statusLabel?.(req.status) || req.status
}

function getRequesterName(req) {
  if (req._type === 'component') {
    return reqStore.getRequesterName?.(req)
  } else {
    return req.requesterName || req.requesterId
  }
}

function getAvailableActions(req) {
  if (req._type === 'component') {
    return reqStore.getAvailableActions(req, auth.role, auth.user?.name, auth.user?.id) || []
  }
  return []
}

function handleCardClick(req) {
  // Navigate to detail for both component and research requests
  router.push({ name: 'request-detail', params: { id: req.id } })
}

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
    console.log('📤 Creating unified request with payload:', payload)
    
    // Always use reqStore for new requests to support the dynamic unified architecture
    const result = await reqStore.create(payload)
    console.log('✅ Request created:', result)
    
    ui.showToast('✅ Request submitted successfully!', 'success')
    
    // Close modal after a short delay
    setTimeout(() => {
      const modalElement = document.getElementById('newRequestModal')
      if (modalElement) {
        const modal = BootstrapModal.getInstance(modalElement)
        if (modal) {
          modal.hide()
          console.log('✨ Modal closed')
        }
      }
      
      // Reset form
      if (formRef.value?.resetForm) {
        formRef.value.resetForm()
      }
    }, 500)
    
  } catch (e) {
    console.error('❌ Error creating request:', e)
    ui.showToast(`Error: ${e.message || 'Failed to create request'}`, 'err')
  }
}

function openNewRequestModal() {
  if (!canCreate.value) {
    ui.showToast('You do not have permission to create requests', 'err')
    return
  }
  const modalElement = document.getElementById('newRequestModal')
  const modal = new BootstrapModal(modalElement)
  modal.show()
}

// Load both component and research requests on mount
onMounted(async () => {
  try {
    if (!dmStore.settings.requestTypes?.length) {
      await dmStore.fetchAll?.()
    }
    await Promise.all([
      reqStore.fetchAll?.(),
      researchStore.fetchAll?.()
    ])
  } catch (e) {
    console.error('Error loading requests:', e)
  }
})
</script>
