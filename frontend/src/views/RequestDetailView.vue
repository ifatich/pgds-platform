<template>
  <div v-if="req">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
      <button class="btn btn-ghost btn-sm" @click="$router.back()">← Back</button>
      <h2 style="font-size:18px;font-weight:800;flex:1">{{ req.title }}</h2>
      <span class="badge" :class="'b-'+req.status" style="font-size:12px">{{ reqStore.statusLabel(req.status) }}</span>
      <!-- Assignee indicators -->
      <span v-if="req && reqStore.getDesignerOwner(req)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;background:var(--purplel,#f3e8ff);color:var(--purple,#7c3aed);border-radius:20px;padding:3px 10px;font-weight:600">
        🎨 {{ reqStore.getDesignerOwner(req) }}
      </span>
      <span v-if="req && reqStore.getEngineerOwner(req)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;background:var(--bluel,#dbeafe);color:var(--blue,#1d4ed8);border-radius:20px;padding:3px 10px;font-weight:600">
        ⚙️ {{ reqStore.getEngineerOwner(req) }}
      </span>
      <button v-if="auth.isAdmin" class="btn btn-sec btn-sm" @click="showOverride = true">⚡ Override</button>
    </div>

    <!-- Pipeline -->
    <div class="card" style="margin-bottom:18px">
      <div class="card-bd" style="padding:12px 18px">
        <div style="font-size:11px;font-weight:700;color:var(--s400);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">{{ wfLabel }} Pipeline</div>
        <div class="pipeline">
          <div v-for="(step, i) in wfSteps" :key="step.status" class="pipe-step">
            <div class="pipe-node" :class="reqStore.pipeClass(step.status, req.status)">{{ step.label }}</div>
            <div v-if="i < wfSteps.length-1" class="pipe-arrow"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Actions -->
    <div v-if="availableActions.length > 0" class="card" style="margin-bottom:18px">
      <div class="card-bd" style="padding:14px 18px;display:flex;gap:9px;flex-wrap:wrap;align-items:center">
        <span style="font-size:12px;font-weight:600;color:var(--s600)">Actions:</span>
        <button v-for="act in availableActions" :key="act.action"
          class="btn btn-sm" :class="act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-sec'"
          @click="openAction(act)">
          {{ act.icon }} {{ act.label }}
        </button>
      </div>
    </div>

    <div class="detail-grid">
      <!-- LEFT: Detail + Timeline -->
      <div>
        <!-- Meta -->
        <div class="card" style="margin-bottom:18px">
          <div class="card-hd"><h3>Request Detail</h3></div>
          <div class="card-bd">
            <div class="detail-sec">
              <h4>Request Info</h4>
              <div class="meta-g">
                <div><div class="mk">Nama Komponen</div><div class="mv" style="font-weight:600">{{ req.componentName }}</div></div>
                <div><div class="mk">Type</div><div class="mv"><span class="badge" :class="'b-'+req.requestType">{{ req.requestType?.replace(/_/g,' ') }}</span></div></div>
                <div><div class="mk">Priority</div><div class="mv"><span class="badge" :class="'b-'+(req.priority||'').toLowerCase()">{{ req.priority }}</span></div></div>
                <div><div class="mk">Platform</div><div class="mv">{{ req.platform }}</div></div>
                <div><div class="mk">Requester</div><div class="mv" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="badge" :class="'b-'+req.requesterRole">{{ req.requesterRole }}</span><span style="font-size:12.5px;color:var(--s700);font-weight:600">{{ reqStore.getRequesterName(req) }}</span><span v-if="reqStore.getRequesterTeam(req)" style="font-size:11px;background:var(--s100);color:var(--s500);border-radius:20px;padding:2px 8px;font-weight:500">{{ reqStore.getRequesterTeam(req) }}</span></div></div>
                <div><div class="mk">Created</div><div class="mv">{{ formatDate(req.createdAt) }}</div></div>
                <div><div class="mk">Updated</div><div class="mv">{{ formatDate(req.updatedAt) }}</div></div>
              </div>
            </div>
            <div class="detail-sec" v-if="req.componentDescription">
              <h4>Component Description</h4>
              <p style="font-size:13px;color:var(--s700);line-height:1.6">{{ req.componentDescription }}</p>
            </div>
            <div class="detail-sec" v-if="req.useCase">
              <h4>Use Case</h4>
              <p style="font-size:13px;color:var(--s700);line-height:1.6">{{ req.useCase }}</p>
            </div>
            <div class="detail-sec" v-if="req.designReferenceLink">
              <h4>Design Reference</h4>
              <a :href="req.designReferenceLink" target="_blank" class="ext-link">🎨 Open Figma ↗</a>
            </div>
            <div class="detail-sec" v-if="req.stateRequirements?.length">
              <h4>State Requirements</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                <span v-for="s in req.stateRequirements" :key="s" class="tag">{{ s }}</span>
              </div>
            </div>
            <div class="detail-sec" v-if="req.responsiveBehaviour">
              <h4>Responsive Behaviour</h4>
              <span class="tag">{{ req.responsiveBehaviour }}</span>
            </div>
            <div class="detail-sec" v-if="req.accessibilityRequirement">
              <h4>Accessibility</h4>
              <span class="tag" style="background:var(--bluel,#dbeafe);color:var(--blue,#1d4ed8)">✓ WCAG Accessibility Required</span>
            </div>
            <div class="detail-sec" v-if="req.affectedProducts?.length">
              <h4>Affected Products</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                <span v-for="p in req.affectedProducts" :key="p" class="tag">{{ p }}</span>
              </div>
            </div>
            <div class="detail-sec" v-if="req.referenceProduct">
              <h4>Reference Product</h4>
              <p style="font-size:13px;color:var(--s700);line-height:1.6">{{ req.referenceProduct }}</p>
            </div>
            <div class="detail-sec" v-if="req.interactionBehaviour">
              <h4>Interaction Behaviour</h4>
              <p style="font-size:13px;color:var(--s700);line-height:1.6">{{ req.interactionBehaviour }}</p>
            </div>
            <div class="detail-sec" v-if="req.deadline">
              <h4>Deadline</h4>
              <span style="font-size:13px;color:var(--s700);font-weight:600">{{ req.deadline }}</span>
            </div>
            <div class="detail-sec" v-if="req.additionalNotes">
              <h4>Additional Notes</h4>
              <p style="font-size:13px;color:var(--s700);line-height:1.6">{{ req.additionalNotes }}</p>
            </div>
            <!-- Request Done section -->
            <div v-if="req.status === 'done'" style="margin-top:4px;border-top:2px solid #22c55e;padding-top:16px">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:12px">
                <span style="font-size:15px">🏁</span>
                <h4 style="margin:0;color:#16a34a;font-size:14px;font-weight:700">Request Done</h4>
              </div>
              <div class="meta-g">
                <div>
                  <div class="mk">Nama Komponen</div>
                  <div class="mv" style="font-weight:600">{{ publishLog?.componentName || req.componentName }}</div>
                </div>
                <div v-if="publishLog?.library">
                  <div class="mk">Library</div>
                  <div class="mv"><span class="tag">{{ publishLog.library }}</span></div>
                </div>
                <div v-if="publishLog?.version">
                  <div class="mk">Version</div>
                  <div class="mv" style="font-weight:600">v{{ publishLog.version }}</div>
                </div>
              </div>
              <div v-if="publishLog?.docLink" style="margin-top:12px">
                <a :href="publishLog.docLink" target="_blank" class="btn btn-sec btn-sm" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none">📄 Lihat Dokumentasi ↗</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <div class="card-hd"><h3>Activity Timeline</h3></div>
          <div class="card-bd">
            <div class="empty" v-if="!req.logs?.length"><div class="ei">📋</div><p>No activity yet</p></div>
            <ul class="tl">
              <li v-for="log in req.logs" :key="log.id" class="tl-item">
                <div class="tl-dot" :class="log.dotClass">{{ log.icon }}</div>
                <div class="tl-content">
                  <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px">
                    <span class="tl-actor">{{ log.actor }}</span>
                    <span class="badge" :class="log.badge?.class || ''" style="font-size:10.5px">{{ log.badge?.text }}</span>
                    <span class="tl-date">{{ formatDate(log.at) }}</span>
                  </div>
                  <div class="tl-note" v-if="log.note">{{ log.note }}</div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
                    <a v-if="log.figmaLink" :href="log.figmaLink" target="_blank" class="ext-link">🎨 Figma ↗</a>
                    <a v-if="log.previewLink" :href="log.previewLink" target="_blank" class="ext-link">🔗 Preview ↗</a>
                    <span v-if="log.screenshotName" class="ext-link" style="cursor:pointer" @click="previewImg = log.screenshotDataUrl">🖼 {{ log.screenshotName }}</span>
                    <a v-if="log.docLink" :href="log.docLink" target="_blank" class="ext-link">📄 Dokumentasi ↗</a>
                    <span v-if="log.score != null" style="font-size:12px;color:var(--s500)">📊 Score: {{ log.score }}/10</span>
                    <span v-if="log.version" style="font-size:12px;color:var(--s500)">🏷 v{{ log.version }}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- RIGHT: Team + Gates + meta -->
      <div>
        <!-- Team & Ownership -->
        <div class="card" style="margin-bottom:18px">
          <div class="card-hd"><h3>👥 Team & Ownership</h3></div>
          <div class="card-bd" style="padding:0">
            <div v-for="member in ownershipList" :key="member.label"
              style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--s100)">
              <span style="font-size:16px;width:22px;text-align:center;flex-shrink:0">{{ member.icon }}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:10.5px;color:var(--s400);font-weight:700;text-transform:uppercase;letter-spacing:.6px">{{ member.label }}</div>
                <div style="font-size:13px;font-weight:600" :style="{ color: member.name ? 'var(--s800)' : 'var(--s300)' }">{{ member.name || '—' }}</div>
                <div v-if="member.sub" style="font-size:11px;color:var(--s400);margin-top:1px">{{ member.sub }}</div>
              </div>
              <span v-if="member.name" class="badge" :class="member.badgeClass" style="font-size:10px;white-space:nowrap;flex-shrink:0">{{ member.badgeText }}</span>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom:18px">
          <div class="card-hd"><h3>Checklist Gates</h3></div>
          <div class="card-bd" style="padding:12px 18px">
            <div v-for="gate in reqStore.getGates(req)" :key="gate.label" class="gate-item">
              <div class="gate-dot" :class="gate.pass ? 'pass' : 'fail'">{{ gate.pass ? '✓' : '○' }}</div>
              <div>
                <div style="font-size:13px">{{ gate.label }}</div>
                <div v-if="gate.by" style="font-size:11px;color:var(--s400)">by {{ gate.by }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" v-if="req.impactLevel || req.businessGoal">
          <div class="card-hd"><h3>Business Context</h3></div>
          <div class="card-bd">
            <div v-if="req.impactLevel" class="fg"><div class="mk">Impact Level</div><span class="badge" style="background:var(--orangel);color:var(--orange)">{{ req.impactLevel }}</span></div>
            <div v-if="req.businessGoal"><div class="mk" style="font-size:11px;color:var(--s400);margin-bottom:4px">Business Goal</div><p style="font-size:13px;color:var(--s700);line-height:1.55">{{ req.businessGoal }}</p></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <ActionModal v-if="actionState.show" :state="actionState" @confirm="handleAction" @cancel="actionState.show = false" />

    <!-- Override Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showOverride" class="overlay" @click.self="showOverride = false">
          <div class="modal sm">
            <div class="mh"><h2>⚡ Override Status</h2><button class="btn btn-ghost btn-icon" @click="showOverride = false">✕</button></div>
            <div class="mb">
              <div style="padding:10px 14px;background:var(--orangel);border-radius:var(--r8);margin-bottom:14px;font-size:12.5px;color:var(--orange);font-weight:500">⚠️ Super Admin override — use with care.</div>
              <div class="fg">
                <label class="fl">New Status <span class="req">*</span></label>
                <select class="fs" v-model="overrideForm.status">
                  <option value="">Select status</option>
                  <option v-for="s in reqStore.ALL_STATUSES" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
              <div class="fg"><label class="fl">Note</label><textarea class="ft" v-model="overrideForm.note" placeholder="Reason for override..."></textarea></div>
            </div>
            <div class="mf">
              <button class="btn btn-sec" @click="showOverride = false">Cancel</button>
              <button class="btn btn-danger" @click="doOverride">Override</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Image preview -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="previewImg" @click="previewImg=null" style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out">
          <img :src="previewImg" style="max-width:90vw;max-height:80vh;border-radius:var(--r12);object-fit:contain" @click.stop>
        </div>
      </transition>
    </Teleport>
  </div>
  <div v-else class="empty"><div class="ei">⏳</div><p>Loading...</p></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import ActionModal from '@/components/requests/ActionModal.vue'

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
