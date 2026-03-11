<template>
  <div>
    <div class="sh">
      <div><h2>Audit Program</h2><p>{{ reqStore.auditQueue.length }} requests in audit pipeline</p></div>
      <button v-if="auth.role === 'designer' || auth.isAdmin" class="btn btn-primary" @click="showTrigger = true">+ Trigger Audit</button>
    </div>

    <div v-if="reqStore.auditQueue.length === 0" class="empty"><div class="ei">🔍</div><p>No active audit requests</p></div>
    <div v-for="req in reqStore.auditQueue" :key="req.id" class="req-card" @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
      <div class="req-card-hd">
        <div>
          <div class="req-title">{{ req.title }}</div>
          <div class="req-meta"><span>{{ req.componentName }}</span><span>·</span><span v-if="req.auditReason" style="color:var(--orange)">{{ req.auditReason }}</span><span>·</span><span>{{ formatDate(req.updatedAt) }}</span></div>
        </div>
        <span class="badge" :class="'b-'+req.status">{{ reqStore.statusLabel(req.status) }}</span>
      </div>
      <div class="req-actions" @click.stop>
        <button v-for="act in reqStore.getAvailableActions(req, auth.role)" :key="act.action"
          class="btn btn-sm" :class="act.primary ? 'btn-primary' : act.danger ? 'btn-danger' : 'btn-sec'"
          @click="openAction(req, act)">{{ act.icon }} {{ act.label }}</button>
      </div>
    </div>

    <!-- Trigger Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showTrigger" class="overlay" @click.self="showTrigger = false">
          <div class="modal sm">
            <div class="mh"><h2>🔍 Trigger Component Audit</h2><button class="btn btn-ghost btn-icon" @click="showTrigger=false">✕</button></div>
            <div class="mb">
              <div class="fg"><label class="fl">Component Name <span class="req">*</span></label><input class="fi" v-model="triggerForm.componentName" placeholder="e.g. PgdButton"></div>
              <div class="fg"><label class="fl">Audit Reason <span class="req">*</span></label>
                <select class="fs" v-model="triggerForm.reason">
                  <option value="">Select reason</option>
                  <option v-for="r in REASONS" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div class="fg"><label class="fl">Priority</label>
                <select class="fs" v-model="triggerForm.priority">
                  <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
              <div class="fg"><label class="fl">Notes</label><textarea class="ft" v-model="triggerForm.notes" placeholder="Describe the audit scope..."></textarea></div>
            </div>
            <div class="mf">
              <button class="btn btn-sec" @click="showTrigger=false">Cancel</button>
              <button class="btn btn-primary" @click="submitTrigger">Trigger Audit</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

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

const auth = useAuthStore(); const reqStore = useRequestsStore(); const ui = useUiStore()
const showTrigger = ref(false)
const actionState = ref({ show: false })
const REASONS = ['Token update','UI modernization','Accessibility review','Performance review','Breaking change','Deprecated dependency','Design spec mismatch']
const PRIORITIES = ['Critical','High','Medium','Low']
const triggerForm = ref({ componentName:'', reason:'', priority:'Medium', notes:'' })

function openAction(req, act) {
  actionState.value = { show:true, req, act, actorName:'' }
}
async function handleAction(payload) {
  try { await reqStore.doAction(actionState.value.req.id, payload); actionState.value.show = false; ui.showToast('Action completed!') }
  catch (e) { ui.showToast(e.message, 'err') }
}
async function submitTrigger() {
  if (!triggerForm.value.componentName || !triggerForm.value.reason) { ui.showToast('Fill required fields', 'err'); return }
  try { await reqStore.triggerAudit(triggerForm.value); showTrigger.value = false; ui.showToast('🔍 Audit triggered!') }
  catch (e) { ui.showToast(e.message, 'err') }
}
</script>
