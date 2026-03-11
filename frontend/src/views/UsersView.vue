<template>
  <div>
    <div class="sh">
      <div><h2>User Management</h2><p>{{ userStore.items.length }} registered users</p></div>
      <button class="btn btn-primary" @click="openModal(null)">+ New User</button>
    </div>

    <!-- KPI -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px">
      <div class="kpi green"><div class="kpi-icon">👥</div><div class="kpi-val" style="color:var(--g)">{{ userStore.items.length }}</div><div class="kpi-lbl">Total Users</div></div>
      <div class="kpi purple"><div class="kpi-icon">🎨</div><div class="kpi-val" style="color:var(--purple)">{{ byRole('designer') }}</div><div class="kpi-lbl">Designers</div></div>
      <div class="kpi blue"><div class="kpi-icon">⚙️</div><div class="kpi-val" style="color:var(--blue)">{{ byRole('engineer') }}</div><div class="kpi-lbl">Engineers</div></div>
      <div class="kpi orange"><div class="kpi-icon">💻</div><div class="kpi-val" style="color:var(--orange)">{{ byRole('developer') }}</div><div class="kpi-lbl">Developers</div></div>
    </div>

    <!-- Filters -->
    <div class="fbar" style="margin-bottom:16px">
      <div class="search-wrap"><span class="s-ic">🔍</span><input class="fi" v-model="search" placeholder="Search name, email, team..."></div>
      <select class="fs" style="width:130px" v-model="filterRole"><option value="">All Roles</option><option value="designer">Designer</option><option value="engineer">Engineer</option><option value="developer">Developer</option></select>
      <select class="fs" style="width:120px" v-model="filterStatus"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select>
    </div>

    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Team</th><th>Email</th><th>Status</th><th>Joined</th><th>Last Active</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-if="filtered.length === 0"><td colspan="8"><div class="empty"><div class="ei">👥</div><p>No users found</p></div></td></tr>
            <tr v-for="u in filtered" :key="u.id">
              <td>
                <div style="display:flex;align-items:center;gap:9px">
                  <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0"
                    :style="{ background: u.role==='designer'?'var(--purple)':u.role==='engineer'?'var(--blue)':'var(--orange)' }">
                    {{ userInitials(u.name) }}
                  </div>
                  <div><div style="font-weight:600;font-size:13px">{{ u.name }}</div><div style="font-size:11px;color:var(--s400)">@{{ u.username }}</div></div>
                </div>
              </td>
              <td><span class="badge" :class="'b-'+u.role" style="font-size:10.5px">{{ u.role }}</span></td>
              <td style="font-size:12.5px;color:var(--s600)">{{ u.team || '—' }}</td>
              <td style="font-size:12px;color:var(--s600)">{{ u.email }}</td>
              <td>
                <span class="badge" style="font-size:10.5px"
                  :style="u.status==='active'?'background:var(--gl);color:var(--gd)':u.status==='suspended'?'background:var(--redl);color:var(--red)':'background:var(--s100);color:var(--s500)'">
                  {{ u.status==='active'?'✅ Active':u.status==='suspended'?'🚫 Suspended':'⏸ Inactive' }}
                </span>
              </td>
              <td style="font-size:11.5px;color:var(--s500)">{{ formatDate(u.created_at) }}</td>
              <td style="font-size:11.5px;color:var(--s500)">{{ formatDate(u.last_active) }}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-icon btn-sm" @click="openModal(u)" title="Edit">✏️</button>
                  <button class="btn btn-ghost btn-icon btn-sm" @click="toggleStatus(u)" :title="u.status==='active'?'Deactivate':'Activate'">{{ u.status==='active'?'⏸':'▶️' }}</button>
                  <button class="btn btn-danger btn-icon btn-sm" @click="doDelete(u)" title="Delete">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="overlay" @click.self="showModal=false">
          <div class="modal lg">
            <div class="mh"><h2>{{ editUser ? 'Edit User' : 'New User' }}</h2><button class="btn btn-ghost btn-icon" @click="showModal=false">✕</button></div>
            <div class="mb">
              <div class="fr">
                <div class="fg"><label class="fl">Full Name <span class="req">*</span></label><input class="fi" v-model="uf.name"><div class="fe" v-if="ue.name">{{ ue.name }}</div></div>
                <div class="fg"><label class="fl">Email <span class="req">*</span></label><input class="fi" type="email" v-model="uf.email"><div class="fe" v-if="ue.email">{{ ue.email }}</div></div>
              </div>
              <div class="fr">
                <div class="fg"><label class="fl">Role <span class="req">*</span></label>
                  <select class="fs" v-model="uf.role"><option value="">Select</option><option value="designer">🎨 Designer</option><option value="engineer">⚙️ Engineer</option><option value="developer">💻 Developer</option></select>
                  <div class="fe" v-if="ue.role">{{ ue.role }}</div>
                </div>
                <div class="fg"><label class="fl">Team / Division</label><input class="fi" v-model="uf.team" placeholder="Design System, Mobile, Web..."></div>
              </div>
              <div class="fr">
                <div class="fg"><label class="fl">Phone</label><input class="fi" v-model="uf.phone" placeholder="+62 8xx-xxxx-xxxx"></div>
                <div class="fg"><label class="fl">Status</label>
                  <select class="fs" v-model="uf.status"><option value="active">✅ Active</option><option value="inactive">⏸ Inactive</option><option value="suspended">🚫 Suspended</option></select>
                </div>
              </div>
              <div class="fg"><label class="fl">Bio</label><textarea class="ft" style="min-height:70px" v-model="uf.bio" placeholder="Short bio..."></textarea></div>
              <div class="fr" v-if="!editUser">
                <div class="fg"><label class="fl">Password <span class="req">*</span></label><input class="fi" type="password" v-model="uf.password"><div class="fe" v-if="ue.password">{{ ue.password }}</div></div>
                <div class="fg"><label class="fl">Confirm Password <span class="req">*</span></label><input class="fi" type="password" v-model="uf.confirm"><div class="fe" v-if="ue.confirm">{{ ue.confirm }}</div></div>
              </div>
            </div>
            <div class="mf">
              <button class="btn btn-sec" @click="showModal=false">Cancel</button>
              <button class="btn btn-primary" @click="save">{{ editUser ? 'Save Changes' : 'Create User' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'

const userStore = useUsersStore(); const ui = useUiStore()
const search = ref(''); const filterRole = ref(''); const filterStatus = ref('')
const showModal = ref(false); const editUser = ref(null)
const uf = ref({ name:'', email:'', role:'', team:'', phone:'', status:'active', bio:'', password:'', confirm:'' })
const ue = ref({})

const filtered = computed(() => userStore.items.filter(u => {
  const q = search.value.toLowerCase()
  if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !(u.team||'').toLowerCase().includes(q)) return false
  if (filterRole.value && u.role !== filterRole.value) return false
  if (filterStatus.value && u.status !== filterStatus.value) return false
  return true
}))

const byRole = (r) => userStore.items.filter(u => u.role === r).length
const userInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

function openModal(u) {
  editUser.value = u; ue.value = {}
  uf.value = u ? { ...u, password:'', confirm:'' } : { name:'', email:'', role:'', team:'', phone:'', status:'active', bio:'', password:'', confirm:'' }
  showModal.value = true
}

async function save() {
  const errs = {}
  if (!uf.value.name) errs.name = 'Required'
  if (!uf.value.email) errs.email = 'Required'
  else if (!/^[^@]+@[^@]+\.[^@]+$/.test(uf.value.email)) errs.email = 'Invalid email'
  if (!uf.value.role) errs.role = 'Required'
  if (!editUser.value) {
    if (!uf.value.password || uf.value.password.length < 8) errs.password = 'Min 8 characters'
    if (uf.value.password !== uf.value.confirm) errs.confirm = 'Passwords do not match'
  }
  ue.value = errs; if (Object.keys(errs).length) return
  try {
    if (editUser.value) { await userStore.update(editUser.value.id, uf.value); ui.showToast('✅ User updated') }
    else { await userStore.create({ ...uf.value, password: uf.value.password }); ui.showToast('✅ User created') }
    showModal.value = false
  } catch (e) { ui.showToast(e.message, 'err') }
}
async function toggleStatus(u) {
  try { await userStore.toggleStatus(u.id, u.status); ui.showToast(u.status==='active' ? '⏸ Deactivated' : '▶️ Activated') }
  catch (e) { ui.showToast(e.message, 'err') }
}
async function doDelete(u) {
  if (!confirm('Delete user ' + u.name + '?')) return
  try { await userStore.remove(u.id); ui.showToast('🗑 User deleted') }
  catch (e) { ui.showToast(e.message, 'err') }
}
</script>
