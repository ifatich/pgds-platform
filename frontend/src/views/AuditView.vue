<template>
  <div>
    <PageHeader 
      title="Audit Program" 
      :subtitle="`${reqStore.auditQueue.length} requests in audit pipeline`"
      :actionLabel="(auth.role === 'designer' || auth.isAdmin) ? '+ Trigger Audit' : null"
      @action="openTriggerAuditModal"
    />

    <!-- Empty State -->
    <EmptyState 
      v-if="reqStore.auditQueue.length === 0"
      icon="🔍"
      message="No active audit requests"
    />

    <!-- Audit Request Cards -->
    <div v-else class="row g-3">
      <div v-for="req in reqStore.auditQueue" :key="req.id" class="col-12">
        <div class="card card-hover cursor-pointer" @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
          <div class="card-body pb-2">
            <!-- Header: Title and Status Badge -->
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="flex-grow-1">
                <h5 class="card-title fw-bold mb-1">{{ req.title }}</h5>
                <p class="card-text text-secondary small mb-0">
                  <span>{{ req.componentName }}</span>
                  <span class="mx-1">·</span>
                  <span v-if="req.auditReason" style="color:var(--orange)">{{ req.auditReason }}</span>
                  <span v-if="req.auditReason" class="mx-1">·</span>
                  <span>{{ formatDate(req.updatedAt) }}</span>
                </p>
              </div>
              <span class="badge ms-2" :class="'b-'+req.status">{{ reqStore.statusLabel(req.status) }}</span>
            </div>

            <!-- Actions -->
            <div class="d-flex flex-wrap gap-2" @click.stop>
              <button 
                v-for="act in reqStore.getAvailableActions(req, auth.role)" 
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

    <!-- Trigger Audit Modal (Pure Bootstrap) -->
    <div class="modal fade" id="triggerAuditModal" tabindex="-1" aria-labelledby="triggerAuditLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="triggerAuditLabel">🔍 Trigger Component Audit</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Component Name -->
            <div class="mb-3">
              <label for="componentName" class="form-label">Component Name <span class="text-danger">*</span></label>
              <input
                id="componentName"
                v-model="triggerForm.componentName"
                type="text"
                class="form-control"
                placeholder="e.g. PgdButton"
                required
              >
            </div>

            <!-- Audit Reason -->
            <div class="mb-3">
              <label class="form-label">Audit Reason <span class="text-danger">*</span></label>
              <Dropdown
                v-model="triggerForm.reason"
                :options="reasonOptions"
                placeholder="Select reason"
                variant="outline-secondary"
                size="sm"
              />
            </div>

            <!-- Priority -->
            <div class="mb-3">
              <label class="form-label">Priority</label>
              <Dropdown
                v-model="triggerForm.priority"
                :options="priorityOptions"
                placeholder="Select priority"
                variant="outline-secondary"
                size="sm"
              />
            </div>

            <!-- Notes -->
            <div class="mb-3">
              <label for="notes" class="form-label">Notes</label>
              <textarea
                id="notes"
                v-model="triggerForm.notes"
                class="form-control"
                rows="3"
                placeholder="Describe the audit scope..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitTrigger">Trigger Audit</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <ActionModal v-if="actionState.show" :state="actionState" @confirm="handleAction" @cancel="actionState.show = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import ActionModal from '@/components/requests/ActionModal.vue'
import { PageHeader, EmptyState, Dropdown } from '@/components/ui'
import { Modal as BootstrapModal } from 'bootstrap'

const auth = useAuthStore()
const reqStore = useRequestsStore()
const ui = useUiStore()

const actionState = ref({ show: false })
const REASONS = ['Token update','UI modernization','Accessibility review','Performance review','Breaking change','Deprecated dependency','Design spec mismatch']
const PRIORITIES = ['Critical','High','Medium','Low']

// Dropdown options
const reasonOptions = computed(() => [
  { value: '', label: 'Select reason' },
  ...REASONS.map(r => ({ value: r, label: r }))
])

const priorityOptions = computed(() =>
  PRIORITIES.map(p => ({ value: p, label: p }))
)

const triggerForm = ref({ componentName:'', reason:'', priority:'Medium', notes:'' })

function openAction(req, act) {
  actionState.value = { show:true, req, act, actorName:'' }
}

async function handleAction(payload) {
  try {
    await reqStore.doAction(actionState.value.req.id, payload)
    actionState.value.show = false
    ui.showToast('Action completed!')
  } catch (e) {
    ui.showToast(e.message, 'err')
  }
}

async function submitTrigger() {
  if (!triggerForm.value.componentName || !triggerForm.value.reason) {
    ui.showToast('Fill required fields', 'err')
    return
  }
  try {
    await reqStore.triggerAudit(triggerForm.value)
    // Close modal using Bootstrap API
    const modalElement = document.getElementById('triggerAuditModal')
    const modal = window.bootstrap.Modal.getInstance(modalElement)
    if (modal) modal.hide()
    triggerForm.value = { componentName:'', reason:'', priority:'Medium', notes:'' }
    ui.showToast('🔍 Audit triggered!')
  } catch (e) {
    ui.showToast(e.message, 'err')
  }
}

function openTriggerAuditModal() {
  if (auth.role !== 'designer' && !auth.isAdmin) {
    ui.showToast('You do not have permission to trigger audits', 'err')
    return
  }
  const modalElement = document.getElementById('triggerAuditModal')
  const modal = new BootstrapModal(modalElement)
  modal.show()
}
</script>
