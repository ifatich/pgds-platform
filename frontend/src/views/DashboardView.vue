<template>
  <div>
    <!-- KPI grid -->
    <div class="kpi-grid">
      <div class="kpi green">
        <div class="kpi-icon">✅</div>
        <div class="kpi-val" style="color:var(--g)">{{ stats.done }}</div>
        <div class="kpi-lbl">Published Components</div>
        <div class="kpi-sub up">All time</div>
      </div>
      <div class="kpi blue">
        <div class="kpi-icon">🔄</div>
        <div class="kpi-val" style="color:var(--blue)">{{ stats.active }}</div>
        <div class="kpi-lbl">Active Requests</div>
        <div class="kpi-sub info">In progress</div>
      </div>
      <div class="kpi orange">
        <div class="kpi-icon">⏳</div>
        <div class="kpi-val" style="color:var(--orange)">{{ stats.myTasks }}</div>
        <div class="kpi-lbl">{{ auth.role === 'developer' ? 'My Active Requests' : 'My Pending Tasks' }}</div>
        <div class="kpi-sub warn">Needs action</div>
      </div>
      <div class="kpi purple">
        <div class="kpi-icon">📦</div>
        <div class="kpi-val" style="color:var(--purple)">{{ compStore.items.filter(c => c.status === 'done').length }}</div>
        <div class="kpi-lbl">Total Components</div>
        <div class="kpi-sub info">In library</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
      <!-- Request Status Overview -->
      <div class="card">
        <div class="card-hd"><h3>{{ auth.role === 'developer' ? 'My Request Status' : 'Request Status Overview' }}</h3></div>
        <div class="card-bd">
          <div v-for="s in topStatuses" :key="s.key" class="sp-row">
            <span class="badge" :class="'b-'+s.key" style="min-width:140px;justify-content:center;font-size:10.5px">{{ s.label }}</span>
            <div class="sp-bar"><div class="sp-fill" style="background:var(--g)" :style="{ width: pct(s.key)+'%' }"></div></div>
            <span class="sp-cnt">{{ count(s.key) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-hd">
          <h3>Recent Activity</h3>
          <div style="display:flex;border:1px solid var(--s200);border-radius:6px;overflow:hidden;font-size:11.5px">
            <button @click="activitySort='newest'" :style="{ background: activitySort==='newest' ? 'var(--g)' : 'transparent', color: activitySort==='newest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600 }">Terbaru</button>
            <button @click="activitySort='oldest'" :style="{ background: activitySort==='oldest' ? 'var(--g)' : 'transparent', color: activitySort==='oldest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600, borderLeft:'1px solid var(--s200)' }">Terlama</button>
          </div>
        </div>
        <div class="card-bd" style="padding:0">
          <div v-if="activityList.length === 0" class="empty" style="padding:28px"><div class="ei">📋</div><p>No activity yet</p></div>
          <div style="max-height:300px;overflow-y:auto">
            <div v-for="log in sortedActivityList.slice(0,50)" :key="log.id"
              style="display:flex;align-items:flex-start;gap:10px;padding:11px 16px;border-bottom:1px solid var(--s100)">
              <span style="font-size:16px;margin-top:1px">{{ log.icon }}</span>
              <div style="min-width:0">
                <div style="font-size:12.5px;color:var(--s700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ log.message }}</div>
                <div style="font-size:11px;color:var(--s400)">{{ log.actor }} · {{ formatDate(log.at || log.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3 + Card 4: My Requests & My Submitted Requests -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">

      <!-- Card 3: My Requests / My Tasks Right Now -->
      <div class="card">
        <div class="card-hd">
          <h3>{{ auth.role === 'developer' ? 'My Requests' : 'My Tasks Right Now' }}</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="display:flex;border:1px solid var(--s200);border-radius:6px;overflow:hidden;font-size:11.5px">
              <button @click="myRequestsSort='newest'" :style="{ background: myRequestsSort==='newest' ? 'var(--g)' : 'transparent', color: myRequestsSort==='newest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600 }">Terbaru</button>
              <button @click="myRequestsSort='oldest'" :style="{ background: myRequestsSort==='oldest' ? 'var(--g)' : 'transparent', color: myRequestsSort==='oldest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600, borderLeft:'1px solid var(--s200)' }">Terlama</button>
            </div>
            <RouterLink
              :to="{ name: auth.role === 'developer' ? 'requests' : 'my_tasks' }"
              style="font-size:12px;color:var(--g);text-decoration:none;font-weight:600">View All →</RouterLink>
          </div>
        </div>
        <div class="card-bd" style="padding:0">
          <div v-if="myRequestsItems.length === 0" class="empty" style="padding:28px">
            <div class="ei">🎉</div>
            <p>{{ auth.role === 'developer' ? 'No active requests' : 'No pending tasks!' }}</p>
          </div>
          <div style="max-height:300px;overflow-y:auto">
            <div v-for="req in sortedMyRequestsItems.slice(0, 50)" :key="req.id"
              style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--s100);cursor:pointer"
              @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
              <div style="flex:1;min-width:0">
                <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ req.title }}</div>
                <div style="font-size:11px;color:var(--s500)">{{ req.componentName || req.component_name }}</div>
              </div>
              <span class="badge" :class="'b-'+req.status" style="font-size:10.5px">{{ reqStore.statusLabel(req.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 4: My Submitted Requests / Portfolio / Component Library -->
      <div class="card">
        <div class="card-hd">
          <h3>{{ portfolioTitle }}</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <template v-if="auth.role !== 'super_admin'">
              <span style="font-size:11.5px;color:var(--s400)">{{ portfolioItems.length }} total</span>
              <div style="display:flex;border:1px solid var(--s200);border-radius:6px;overflow:hidden;font-size:11.5px">
                <button @click="portfolioSort='newest'" :style="{ background: portfolioSort==='newest' ? 'var(--g)' : 'transparent', color: portfolioSort==='newest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600 }">Terbaru</button>
                <button @click="portfolioSort='oldest'" :style="{ background: portfolioSort==='oldest' ? 'var(--g)' : 'transparent', color: portfolioSort==='oldest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600, borderLeft:'1px solid var(--s200)' }">Terlama</button>
              </div>
            </template>
            <RouterLink v-else :to="{ name:'components' }" style="font-size:12px;color:var(--g);text-decoration:none;font-weight:600">View →</RouterLink>
          </div>
        </div>

        <!-- super_admin: component library atomic breakdown -->
        <div v-if="auth.role === 'super_admin'" class="card-bd">
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px">
            <div v-for="lv in ATOMIC_LEVELS" :key="lv"
              style="padding:12px 8px;border-radius:10px;border:1px solid var(--s200);text-align:center;background:var(--s100)">
              <div style="font-weight:800;font-size:20px" :style="{ color: atomicColor(lv) }">{{ compStore.items.filter(c => c.atomicLevel === lv && c.status === 'done').length }}</div>
              <div style="font-size:11px;color:var(--s500);margin-top:2px;text-transform:capitalize">{{ lv }}</div>
            </div>
          </div>
          <div style="border-top:1px solid var(--s100);padding-top:12px">
            <div v-for="rt in REQUEST_TYPES.slice(0, 4)" :key="rt.value" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span class="badge" :class="'b-'+rt.value" style="min-width:130px;justify-content:center;font-size:10.5px">{{ rt.label }}</span>
              <div class="sp-bar" style="flex:1"><div class="sp-fill" style="background:var(--g)" :style="{ width: rtPct(rt.value)+'%' }"></div></div>
              <span style="font-size:11.5px;color:var(--s400);min-width:20px;text-align:right">{{ rtCount(rt.value) }}</span>
            </div>
          </div>
        </div>

        <!-- other roles: list of submitted/portfolio requests -->
        <div v-else class="card-bd" style="padding:0">
          <div v-if="portfolioItems.length === 0" class="empty" style="padding:28px">
            <div class="ei">📋</div>
            <p>No submitted requests yet.</p>
          </div>
          <div style="max-height:300px;overflow-y:auto">
            <div v-for="req in sortedPortfolioItems.slice(0, 50)" :key="req.id"
              style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--s100);cursor:pointer"
              @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
              <div style="flex:1;min-width:0">
                <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ req.title }}</div>
                <div style="font-size:11px;color:var(--s500)">{{ req.componentName || req.component_name }}</div>
              </div>
              <span class="badge" :class="'b-'+req.status" style="font-size:10.5px">{{ reqStore.statusLabel(req.status) }}</span>
              <span v-if="reqStore.getEngineerOwner(req) === auth.user?.name" title="Anda yang mengerjakan development ini" style="font-size:13px">⚙️</span>
              <span v-else-if="reqStore.getDesignerOwner(req) === auth.user?.name" title="Anda yang mengerjakan design ini" style="font-size:13px">🎨</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Flow Monitoring -->
    <div class="card">
      <div class="card-hd">
        <div style="display:flex;align-items:center;gap:10px">
          <h3>📡 Flow Monitoring</h3>
          <span style="font-size:11.5px;color:var(--s400)">{{ sortedFlowItems.length }} active in scope</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="display:flex;border:1px solid var(--s200);border-radius:6px;overflow:hidden;font-size:11.5px">
            <button @click="flowSort='newest'" :style="{ background: flowSort==='newest' ? 'var(--g)' : 'transparent', color: flowSort==='newest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600 }">Terbaru</button>
            <button @click="flowSort='oldest'" :style="{ background: flowSort==='oldest' ? 'var(--g)' : 'transparent', color: flowSort==='oldest' ? '#fff' : 'var(--s500)', border:'none', padding:'4px 10px', cursor:'pointer', fontWeight:600, borderLeft:'1px solid var(--s200)' }">Terlama</button>
          </div>
          <RouterLink :to="{ name: 'requests' }" class="btn btn-ghost btn-sm" style="text-decoration:none;font-size:12px">View All →</RouterLink>
        </div>
      </div>
      <div v-if="sortedFlowItems.length === 0" class="empty" style="padding:30px 20px"><div class="ei">✅</div><p>No active flows in your scope.</p></div>
      <div style="max-height:300px;overflow-y:auto">
        <div v-for="req in sortedFlowItems" :key="req.id"
          style="padding:9px 18px;border-bottom:1px solid var(--s100);cursor:pointer;display:flex;align-items:center;gap:10px"
          :style="{ background: hoveredFlow === req.id ? 'var(--s100)' : '' }"
          @mouseenter="hoveredFlow = req.id" @mouseleave="hoveredFlow = null"
          @click="$router.push({ name:'request-detail', params:{ id:req.id } })">
          <div style="flex:1;min-width:0">
            <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ req.title }}</div>
            <!-- Segmented workflow progress bar -->
            <div style="display:flex;gap:3px;align-items:center;margin-top:5px">
              <div v-for="(step, i) in reqStore.getWorkflowSteps(req.workflow)" :key="i"
                style="height:3px;flex:1;border-radius:2px"
                :style="{ background: reqStore.pipeClass(step.status, req.status) === 'done' ? 'var(--g)' : reqStore.pipeClass(step.status, req.status) === 'active' ? 'var(--gold)' : 'var(--s200)' }">
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
            <span class="badge" :class="'b-'+req.status" style="font-size:10px">{{ reqStore.statusLabel(req.status) }}</span>
            <span style="font-size:10.5px;color:var(--s400)">{{ req.componentName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useComponentsStore } from '@/stores/components'
import { formatDate } from '@/composables/useFormat'
import { api } from '@/composables/useApi'

const auth      = useAuthStore()
const reqStore  = useRequestsStore()
const compStore = useComponentsStore()

const activityList    = ref([])
const activitySort    = ref('newest')
const myRequestsSort  = ref('newest')
const portfolioSort   = ref('newest')
const flowSort        = ref('newest')
const hoveredFlow     = ref(null)

// ── Recent Activity sort ─────────────────────────────────────────────────
const sortedActivityList = computed(() => {
  const list = [...activityList.value]
  return list.sort((a, b) => {
    const da = new Date(a.at || a.created_at || 0).getTime()
    const db = new Date(b.at || b.created_at || 0).getTime()
    return activitySort.value === 'newest' ? db - da : da - db
  })
})

// ── Card 3: My Requests ───────────────────────────────────────────────────
const myRequestsItems = computed(() => {
  const role = auth.role
  if (role === 'developer') {
    return reqStore.items
      .filter(r => r.requesterRole === 'developer' && r.status !== 'done')
      .sort((a, b) => new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0))
  }
  return reqStore.myTasks(role, auth.user?.name, auth.user?.id)
})

const sortedMyRequestsItems = computed(() => {
  const items = [...myRequestsItems.value]
  return items.sort((a, b) => {
    const da = new Date(a.updatedAt || a.updated_at || 0).getTime()
    const db = new Date(b.updatedAt || b.updated_at || 0).getTime()
    return myRequestsSort.value === 'newest' ? db - da : da - db
  })
})

// ── Card 4: My Submitted Requests / Portfolio ─────────────────────────────
const portfolioTitle = computed(() => {
  const role = auth.role
  if (role === 'developer') return 'My Submitted Requests'
  if (role === 'designer')  return 'Design Portfolio'
  if (role === 'engineer')  return 'Engineer Portfolio'
  return 'Component Library'
})

const portfolioItems = computed(() => {
  const role = auth.role
  const name = auth.user?.name
  const uid  = auth.user?.id
  if (role === 'developer') return reqStore.items.filter(r => r.requesterRole === 'developer' && r.status === 'done')
  if (role === 'designer')  return reqStore.items.filter(r =>
    r.status === 'done' &&
    (r.logs || []).some(l => ['start_design','finish_design','approve_validation','start_review','approve_review','request_revision','start_audit','require_redesign','audit_pass','start_redesign','finish_redesign'].includes(l.action) && (l.actorId && uid ? l.actorId === uid : l.actor === name))
  )
  if (role === 'engineer')  return reqStore.items.filter(r =>
    r.status === 'done' &&
    (r.logs || []).some(l => ['start_dev','finish_dev','submit_revision','publish'].includes(l.action) && (l.actorId && uid ? l.actorId === uid : l.actor === name))
  )
  return []
})

const sortedPortfolioItems = computed(() => {
  const items = [...portfolioItems.value]
  return items.sort((a, b) => {
    const da = new Date(a.updatedAt || a.updated_at || 0).getTime()
    const db = new Date(b.updatedAt || b.updated_at || 0).getTime()
    return portfolioSort.value === 'newest' ? db - da : da - db
  })
})

const ATOMIC_LEVELS = ['atom','molecule','organism','template','page']
const REQUEST_TYPES = [
  { value:'new_component',        label:'New Component'  },
  { value:'component_variant',    label:'Variant'        },
  { value:'component_enhancement',label:'Enhancement'    },
  { value:'component_redesign',   label:'Redesign'       },
]

function atomicColor(lv) {
  return { atom:'#2563EB', molecule:'#7C3AED', organism:'#C2410C', template:'#0F766E', page:'#DC2626' }[lv] || 'var(--s500)'
}
function rtCount(v) { return reqStore.items.filter(r => r.requestType === v).length }
function rtPct(v)   { const t = reqStore.items.length; return t ? Math.round((rtCount(v) / t) * 100) : 0 }

onMounted(async () => {
  try { activityList.value = await api.get('/activity') } catch {}
})

const topStatuses = computed(() => reqStore.ALL_STATUSES.slice(0, 8))

function count(key) {
  const reqs = auth.role === 'developer' ? reqStore.items.filter(r => r.requesterRole === 'developer') : reqStore.items
  return reqs.filter(r => r.status === key).length
}
function pct(key) {
  const total = auth.role === 'developer' ? reqStore.items.filter(r => r.requesterRole === 'developer').length : reqStore.items.length
  if (!total) return 0
  return (count(key) / total) * 100
}

const stats = computed(() => ({
  done:    compStore.items.filter(c => c.status === 'done').length,
  active:  reqStore.items.filter(r => r.status !== 'done').length,
  myTasks: reqStore.myTasks(auth.role, auth.user?.name, auth.user?.id).length,
}))

const flowItems = computed(() => {
  const role = auth.role
  const name = auth.user?.name
  const uid  = auth.user?.id
  const active = reqStore.items.filter(r => r.status !== 'done')

  const ACTIVE_DESIGNER = ['in_design','on_review_designer','on_audit','in_redesign']
  const ACTIVE_ENGINEER = ['in_progress_code','need_revision','done_review','need_publish']

  if (role === 'developer') return active.filter(r => r.requesterRole === 'developer')
  if (role === 'designer') return active.filter(r => {
    if (ACTIVE_DESIGNER.includes(r.status)) return reqStore.isDesignerOwner(r, uid, name)
    return false
  })
  if (role === 'engineer') return active.filter(r => {
    if (ACTIVE_ENGINEER.includes(r.status)) return reqStore.isEngineerOwner(r, uid, name)
    return false
  })
  return active
})

const sortedFlowItems = computed(() => {
  const items = [...flowItems.value]
  return items.sort((a, b) => {
    const da = new Date(a.updatedAt || a.updated_at || 0).getTime()
    const db = new Date(b.updatedAt || b.updated_at || 0).getTime()
    return flowSort.value === 'newest' ? db - da : da - db
  })
})


</script>
