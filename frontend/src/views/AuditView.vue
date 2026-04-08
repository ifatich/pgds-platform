<template>
  <div>
    <!-- Section Header -->
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <h2 class="h3 fw-bold mb-1">Audit Program</h2>
        <p class="text-secondary fs-6 mb-0">{{ reqStore.auditQueue.length }} requests in audit pipeline</p>
      </div>
      <button v-if="auth.role === 'designer' || auth.isAdmin" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#triggerAuditModal">
        + Trigger Audit
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="reqStore.auditQueue.length === 0" class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p>No active audit requests</p>
    </div>

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
              <label for="reason" class="form-label">Audit Reason <span class="text-danger">*</span></label>
              <select
                id="reason"
                v-model="triggerForm.reason"
                class="form-select"
                required
              >
                <option value="">Select reason</option>
                <option v-for="r in REASONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>

            <!-- Priority -->
            <div class="mb-3">
              <label for="priority" class="form-label">Priority</label>
              <select
                id="priority"
                v-model="triggerForm.priority"
                class="form-select"
              >
                <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
              </select>
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

const auth = useAuthStore()
const reqStore = useRequestsStore()
const ui = useUiStore()

const actionState = ref({ show: false })
const REASONS = ['Token update','UI modernization','Accessibility review','Performance review','Breaking change','Deprecated dependency','Design spec mismatch']
const PRIORITIES = ['Critical','High','Medium','Low']
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
</script>
