<template>
  <div v-if="req">
    <!-- Header -->
    <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
      <button class="btn btn-outline-secondary btn-sm" @click="$router.back()">← Back</button>
      <h2 class="mb-0 flex-grow-1">{{ req.title }}</h2>
      <span class="badge" :class="'b-'+req.status" style="font-size: 12px">{{ reqStore.statusLabel(req.status) }}</span>
      <!-- Assignee indicators -->
      <span v-if="req && reqStore.getDesignerOwner(req)" class="badge" style="background: var(--purplel, #f3e8ff); color: var(--purple, #7c3aed); font-size: 12px">
        🎨 {{ reqStore.getDesignerOwner(req) }}
      </span>
      <span v-if="req && reqStore.getEngineerOwner(req)" class="badge" style="background: var(--bluel, #dbeafe); color: var(--blue, #1d4ed8); font-size: 12px">
        ⚙️ {{ reqStore.getEngineerOwner(req) }}
      </span>
      <button v-if="auth.isAdmin" class="btn btn-warning btn-sm" @click="showOverride = true">⚡ Override</button>
    </div>

    <!-- Pipeline -->
    <div class="card mb-4">
      <div class="card-body p-3">
        <div class="text-muted" style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px">{{ wfLabel }} Pipeline</div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <div v-for="(step, i) in wfSteps" :key="step.status" class="d-flex align-items-center gap-2">
            <div class="badge" :class="reqStore.pipeClass(step.status, req.status)" style="padding: 8px 12px">{{ step.label }}</div>
            <span v-if="i < wfSteps.length-1" style="color: var(--s300)">→</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Actions -->
    <div v-if="availableActions.length > 0" class="card mb-4">
      <div class="card-body d-flex gap-2 flex-wrap align-items-center">
        <span style="font-size: 12px; font-weight: 600; color: var(--s600)">Actions:</span>
        <button v-for="act in availableActions" :key="act.action"
          class="btn btn-sm" :class="act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-outline-secondary'"
          @click="openAction(act)">
          {{ act.icon }} {{ act.label }}
        </button>
      </div>
    </div>

    <!-- Main Grid: LEFT + RIGHT columns -->
    <div class="row g-4">
      <!-- LEFT: Detail + Timeline -->
      <div class="col-12 col-lg-8">
        <!-- Request Detail Card -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Request Detail</h5>
          </div>
          <div class="card-body">
            <!-- Request Info section -->
            <div class="mb-4">
              <h6 class="mb-3">Request Info</h6>
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Nama Komponen</div>
                  <div class="fw-bold">{{ req.componentName }}</div>
                </div>
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Type</div>
                  <span class="badge" :class="'b-'+req.requestType">{{ req.requestType?.replace(/_/g,' ') }}</span>
                </div>
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Priority</div>
                  <span class="badge" :class="'b-'+(req.priority||'').toLowerCase()">{{ req.priority }}</span>
                </div>
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Platform</div>
                  <div>{{ req.platform }}</div>
                </div>
                <div class="col-12">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Requester</div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge" :class="'b-'+req.requesterRole">{{ req.requesterRole }}</span>
                    <span style="font-size: 12.5px; color: var(--s700); font-weight: 600">{{ reqStore.getRequesterName(req) }}</span>
                    <span v-if="reqStore.getRequesterTeam(req)" style="font-size: 11px; background: var(--s100); color: var(--s500); border-radius: 20px; padding: 2px 8px; font-weight: 500">{{ reqStore.getRequesterTeam(req) }}</span>
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Created</div>
                  <div style="font-size: 13px">{{ formatDate(req.createdAt) }}</div>
                </div>
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Updated</div>
                  <div style="font-size: 13px">{{ formatDate(req.updatedAt) }}</div>
                </div>
              </div>
            </div>

            <hr class="my-4">

            <!-- Component Description -->
            <div v-if="req.componentDescription" class="mb-4">
              <h6 class="mb-2">Component Description</h6>
              <p style="font-size: 13px; color: var(--s700); line-height: 1.6">{{ req.componentDescription }}</p>
            </div>

            <!-- Use Case -->
            <div v-if="req.useCase" class="mb-4">
              <h6 class="mb-2">Use Case</h6>
              <p style="font-size: 13px; color: var(--s700); line-height: 1.6">{{ req.useCase }}</p>
            </div>

            <!-- Design Reference -->
            <div v-if="req.designReferenceLink" class="mb-4">
              <h6 class="mb-2">Design Reference</h6>
              <a :href="req.designReferenceLink" target="_blank" class="btn btn-sm btn-outline-secondary">🎨 Open Figma ↗</a>
            </div>

            <!-- State Requirements -->
            <div v-if="req.stateRequirements?.length" class="mb-4">
              <h6 class="mb-2">State Requirements</h6>
              <div class="d-flex flex-wrap gap-2">
                <span v-for="s in req.stateRequirements" :key="s" class="badge bg-secondary">{{ s }}</span>
              </div>
            </div>

            <!-- Responsive Behaviour -->
            <div v-if="req.responsiveBehaviour" class="mb-4">
              <h6 class="mb-2">Responsive Behaviour</h6>
              <span class="badge bg-secondary">{{ req.responsiveBehaviour }}</span>
            </div>

            <!-- Accessibility -->
            <div v-if="req.accessibilityRequirement" class="mb-4">
              <h6 class="mb-2">Accessibility</h6>
              <span class="badge" style="background: var(--bluel, #dbeafe); color: var(--blue, #1d4ed8)">✓ WCAG Accessibility Required</span>
            </div>

            <!-- Affected Products -->
            <div v-if="req.affectedProducts?.length" class="mb-4">
              <h6 class="mb-2">Affected Products</h6>
              <div class="d-flex flex-wrap gap-2">
                <span v-for="p in req.affectedProducts" :key="p" class="badge bg-secondary">{{ p }}</span>
              </div>
            </div>

            <!-- Reference Product -->
            <div v-if="req.referenceProduct" class="mb-4">
              <h6 class="mb-2">Reference Product</h6>
              <p style="font-size: 13px; color: var(--s700); line-height: 1.6">{{ req.referenceProduct }}</p>
            </div>

            <!-- Interaction Behaviour -->
            <div v-if="req.interactionBehaviour" class="mb-4">
              <h6 class="mb-2">Interaction Behaviour</h6>
              <p style="font-size: 13px; color: var(--s700); line-height: 1.6">{{ req.interactionBehaviour }}</p>
            </div>

            <!-- Deadline -->
            <div v-if="req.deadline" class="mb-4">
              <h6 class="mb-2">Deadline</h6>
              <span style="font-size: 13px; color: var(--s700); font-weight: 600">{{ req.deadline }}</span>
            </div>

            <!-- Additional Notes -->
            <div v-if="req.additionalNotes" class="mb-4">
              <h6 class="mb-2">Additional Notes</h6>
              <p style="font-size: 13px; color: var(--s700); line-height: 1.6">{{ req.additionalNotes }}</p>
            </div>

            <!-- Request Done section -->
            <div v-if="req.status === 'done'" class="mt-3 pt-3 border-top border-success">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span style="font-size: 18px">🏁</span>
                <h6 class="mb-0 text-success">Request Done</h6>
              </div>
              <div class="row g-2">
                <div class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Nama Komponen</div>
                  <div class="fw-bold">{{ publishLog?.componentName || req.componentName }}</div>
                </div>
                <div v-if="publishLog?.library" class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Library</div>
                  <span class="badge bg-secondary">{{ publishLog.library }}</span>
                </div>
                <div v-if="publishLog?.version" class="col-12 col-sm-6">
                  <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Version</div>
                  <div class="fw-bold">v{{ publishLog.version }}</div>
                </div>
              </div>
              <div v-if="publishLog?.docLink" class="mt-3">
                <a :href="publishLog.docLink" target="_blank" class="btn btn-sm btn-outline-secondary">📄 Lihat Dokumentasi ↗</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Activity Timeline</h5>
          </div>
          <div class="card-body" style="padding: 0">
            <div v-if="!req.logs?.length" class="empty-state" style="padding: 28px">
              <div style="font-size: 32px; margin-bottom: 8px">📋</div>
              <p class="text-secondary">No activity yet</p>
            </div>
            <ul class="list-unstyled" v-else style="margin: 0">
              <li v-for="(log, i) in req.logs" :key="log.id" class="d-flex gap-3 p-3" :class="{ 'border-bottom': i < req.logs.length - 1 }">
                <div style="font-size: 20px; flex-shrink: 0; position: relative; padding-left: 12px">
                  {{ log.icon }}
                  <div style="position: absolute; left: 0; top: 24px; width: 2px; background: var(--s300); height: 100%; min-height: 60px" 
                    v-if="i < req.logs.length - 1"></div>
                </div>
                <div style="flex: 1; min-width: 0">
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <span class="fw-bold">{{ log.actor }}</span>
                    <span class="badge" :class="log.badge?.class || ''" style="font-size: 10.5px">{{ log.badge?.text }}</span>
                    <span class="text-muted" style="font-size: 11px">{{ formatDate(log.at) }}</span>
                  </div>
                  <div v-if="log.note" class="text-secondary" style="font-size: 12px">{{ log.note }}</div>
                  <div class="d-flex gap-2 flex-wrap mt-2">
                    <a v-if="log.figmaLink" :href="log.figmaLink" target="_blank" class="btn btn-sm btn-outline-secondary">🎨 Figma ↗</a>
                    <a v-if="log.previewLink" :href="log.previewLink" target="_blank" class="btn btn-sm btn-outline-secondary">🔗 Preview ↗</a>
                    <button v-if="log.screenshotName" class="btn btn-sm btn-outline-secondary" @click="previewImg = log.screenshotDataUrl">🖼 {{ log.screenshotName }}</button>
                    <a v-if="log.docLink" :href="log.docLink" target="_blank" class="btn btn-sm btn-outline-secondary">📄 Dokumentasi ↗</a>
                    <span v-if="log.score != null" style="font-size: 12px; color: var(--s500)">📊 Score: {{ log.score }}/10</span>
                    <span v-if="log.version" style="font-size: 12px; color: var(--s500)">🏷 v{{ log.version }}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- RIGHT: Team + Gates + Context -->
      <div class="col-12 col-lg-4">
        <!-- Team & Ownership -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">👥 Team & Ownership</h5>
          </div>
          <div class="card-body" style="padding: 0">
            <div v-for="(member, i) in ownershipList" :key="member.label"
              class="d-flex align-items-center gap-3 p-3"
              :class="{ 'border-bottom': i < ownershipList.length - 1 }">
              <span style="font-size: 18px; flex-shrink: 0">{{ member.icon }}</span>
              <div style="flex: 1; min-width: 0">
                <div style="font-size: 10.5px; color: var(--s400); font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px">{{ member.label }}</div>
                <div style="font-size: 13px; font-weight: 600" :style="{ color: member.name ? 'var(--s800)' : 'var(--s300)' }">{{ member.name || '—' }}</div>
                <div v-if="member.sub" style="font-size: 11px; color: var(--s400); margin-top: 1px">{{ member.sub }}</div>
              </div>
              <span v-if="member.name" class="badge" :class="member.badgeClass" style="font-size: 10px; white-space: nowrap; flex-shrink: 0">{{ member.badgeText }}</span>
            </div>
          </div>
        </div>

        <!-- Checklist Gates -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Checklist Gates</h5>
          </div>
          <div class="card-body">
            <div v-for="gate in reqStore.getGates(req)" :key="gate.label" class="d-flex align-items-start gap-2 mb-2">
              <span class="badge mt-1" :class="gate.pass ? 'bg-success' : 'bg-light text-muted'">{{ gate.pass ? '✓' : '○' }}</span>
              <div>
                <div style="font-size: 13px">{{ gate.label }}</div>
                <div v-if="gate.by" style="font-size: 11px; color: var(--s400)">by {{ gate.by }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Context -->
        <div v-if="req.impactLevel || req.businessGoal" class="card">
          <div class="card-header">
            <h5 class="mb-0">Business Context</h5>
          </div>
          <div class="card-body">
            <div v-if="req.impactLevel" class="mb-3">
              <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Impact Level</div>
              <span class="badge" style="background: var(--orangel); color: var(--orange)">{{ req.impactLevel }}</span>
            </div>
            <div v-if="req.businessGoal">
              <div style="font-size: 11px; color: var(--s500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px">Business Goal</div>
              <p style="font-size: 13px; color: var(--s700); line-height: 1.55; margin: 0">{{ req.businessGoal }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <ActionModal v-if="actionState.show" :state="actionState" @confirm="handleAction" @cancel="actionState.show = false" />

    <!-- Override Modal -->
    <Modal v-model="showOverride" title="⚡ Override Status" size="sm" confirmLabel="Override">
      <div class="alert alert-warning mb-3">
        ⚠️ Super Admin override — use with care.
      </div>
      <div class="mb-3">
        <label class="form-label">New Status <span class="text-danger">*</span></label>
        <Dropdown
          v-model="overrideForm.status"
          :options="overrideStatusOptions"
          placeholder="Select status"
          variant="outline-secondary"
          size="sm"
        />
      </div>
      <div class="mb-3">
        <label for="overrideNote" class="form-label">Note</label>
        <textarea id="overrideNote" v-model="overrideForm.note" class="form-control" placeholder="Reason for override..." rows="3"></textarea>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showOverride = false">Cancel</button>
        <button type="button" class="btn btn-danger" @click="doOverride">Override</button>
      </template>
    </Modal>

    <!-- Image preview modal -->
    <div v-if="previewImg" @click="previewImg = null" style="position: fixed; inset: 0; background: rgba(0,0,0,.85); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out">
      <img :src="previewImg" style="max-width: 90vw; max-height: 80vh; border-radius: 12px; object-fit: contain" @click.stop>
    </div>
  </div>
  <EmptyState 
    v-else
    icon="⏳"
    message="Loading..."
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import ActionModal from '@/components/requests/ActionModal.vue'
import { Modal, EmptyState, Dropdown } from '@/components/ui'

const route    = useRoute()
const auth     = useAuthStore()
const reqStore = useRequestsStore()
const ui       = useUiStore()

const req           = computed(() => reqStore.items.find(r => r.id === route.params.id))
const showOverride  = ref(false)
const overrideForm  = ref({ status:'', note:'' })
const actionState   = ref({ show:false })
const previewImg    = ref(null)

const wfSteps = computed(() => req.value ? reqStore.getWorkflowSteps(req.value.workflow) : [])
const wfLabel = computed(() => req.value?.workflow === 'designer' ? 'Designer Request' : req.value?.workflow === 'audit' ? 'Audit Workflow' : 'Developer Request')
const availableActions = computed(() => req.value ? reqStore.getAvailableActions(req.value, auth.role, auth.user?.name, auth.user?.id) : [])

const chain = computed(() => req.value ? reqStore.getOwnershipChain(req.value) : {})
const publishLog = computed(() => req.value?.logs?.find(l => l.action === 'publish') || null)
const ownershipList = computed(() => {
  const r = req.value
  if (!r) return []
  const c = chain.value
  const team = reqStore.getRequesterTeam(r)
  const list = [
    { label: 'Requester', icon: '📝', name: c.requester, badgeClass: 'b-' + r.requesterRole, badgeText: r.requesterRole, sub: team },
    { label: 'Designer',  icon: '🎨', name: c.designer,  badgeClass: 'b-designer',            badgeText: 'designer',       sub: null },
    { label: 'Engineer',  icon: '⚙️', name: c.engineer,  badgeClass: 'b-engineer',            badgeText: 'engineer',       sub: null },
    { label: 'Reviewer',  icon: '👁️', name: c.reviewer,  badgeClass: 'b-designer',            badgeText: 'reviewer',       sub: null },
  ]
  if (r.workflow === 'audit' || c.auditor)
    list.push({ label: 'Auditor', icon: '🔍', name: c.auditor, badgeClass: 'b-designer', badgeText: 'auditor', sub: null })
  if (c.publisher)
    list.push({ label: 'Publisher', icon: '🚀', name: c.publisher, badgeClass: 'b-engineer', badgeText: 'engineer', sub: null })
  return list
})

// Dropdown options for override status
const overrideStatusOptions = computed(() =>
  reqStore.ALL_STATUSES.map(s => ({ value: s.key, label: s.label }))
)

function openAction(act) {
  const startLog = act.autoName ? (req.value.logs||[]).find(l => l.action==='start_design'||l.action==='start_redesign') : null
  actionState.value = { show:true, req: req.value, act, actorName: startLog?.actor || '' }
}

async function handleAction(payload) {
  try {
    await reqStore.doAction(req.value.id, payload)
    actionState.value.show = false
    ui.showToast(`${payload.action} completed!`)
  } catch (e) { ui.showToast(e.message, 'err') }
}

async function doOverride() {
  if (!overrideForm.value.status) return
  try {
    await reqStore.override(req.value.id, overrideForm.value.status, overrideForm.value.note)
    showOverride.value = false
    ui.showToast('⚡ Status overridden')
  } catch (e) { ui.showToast(e.message, 'err') }
}
</script>
