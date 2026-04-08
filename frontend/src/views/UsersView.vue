<template>
  <div>
    <!-- Header using PageHeader component -->
    <PageHeader
      title="User Management"
      :subtitle="`${userStore.items.length} registered users`"
      actionLabel="+ New User"
      @action="openModal(null)"
    />

    <!-- KPI Stats using StatGrid component -->
    <StatGrid :stats="kpiStats" :columns="4" marginBottom="24px" />

    <!-- Filters -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <div class="input-group" style="max-width: 300px">
        <span class="input-group-text">🔍</span>
        <input type="text" class="form-control" v-model="search" placeholder="Search name, email, team...">
      </div>
      <Dropdown 
        v-model="filterRole"
        :options="roleOptions"
        placeholder="All Roles"
        variant="outline-secondary"
        size="sm"
        style="min-width: 130px"
      />
      <Dropdown 
        v-model="filterStatus"
        :options="statusFilterOptions"
        placeholder="All Status"
        variant="outline-secondary"
        size="sm"
        style="min-width: 120px"
      />
    </div>

    <!-- Users Table -->
    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Team</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="8">
                <div class="empty-state" style="padding: 40px 20px">
                  <div style="font-size: 32px; margin-bottom: 8px">👥</div>
                  <p>No users found</p>
                </div>
              </td>
            </tr>
            <tr v-for="u in filtered" :key="u.id">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style="width: 34px; height: 34px; font-size: 12px; flex-shrink: 0"
                    :style="{ background: u.role==='designer'?'var(--purple)':u.role==='engineer'?'var(--blue)':'var(--orange)' }">
                    {{ userInitials(u.name) }}
                  </div>
                  <div style="min-width: 0">
                    <div class="fw-bold" style="font-size: 13px">{{ u.name }}</div>
                    <div class="text-muted" style="font-size: 11px">@{{ u.username }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="'b-'+u.role" style="font-size: 10.5px">{{ u.role }}</span>
              </td>
              <td style="font-size: 12.5px">{{ u.team || '—' }}</td>
              <td style="font-size: 12px">{{ u.email }}</td>
              <td>
                <span class="badge" style="font-size: 10.5px"
                  :style="u.status==='active'?'background:var(--gl);color:var(--gd)':u.status==='suspended'?'background:var(--redl);color:var(--red)':'background:var(--s100);color:var(--s500)'">
                  {{ u.status==='active'?'✅ Active':u.status==='suspended'?'🚫 Suspended':'⏸ Inactive' }}
                </span>
              </td>
              <td style="font-size: 11.5px" class="text-muted">{{ formatDate(u.created_at) }}</td>
              <td style="font-size: 11.5px" class="text-muted">{{ formatDate(u.last_active) }}</td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button class="btn btn-outline-secondary" @click="openModal(u)" title="Edit">✏️</button>
                  <button class="btn btn-outline-secondary" @click="toggleStatus(u)" :title="u.status==='active'?'Deactivate':'Activate'">{{ u.status==='active'?'⏸':'▶️' }}</button>
                  <button class="btn btn-outline-danger" @click="doDelete(u)" title="Delete">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Component -->
    <Modal v-model="showModal" :title="editUser ? 'Edit User' : 'New User'" size="lg" confirmLabel="Save" @confirm="save">
      <!-- Row 1: Name + Email -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <label for="userName" class="form-label">Full Name <span class="text-danger">*</span></label>
          <input id="userName" type="text" class="form-control" v-model="uf.name">
          <div v-if="ue.name" class="invalid-feedback d-block">{{ ue.name }}</div>
        </div>
        <div class="col-12 col-md-6">
          <label for="userEmail" class="form-label">Email <span class="text-danger">*</span></label>
          <input id="userEmail" type="email" class="form-control" v-model="uf.email">
          <div v-if="ue.email" class="invalid-feedback d-block">{{ ue.email }}</div>
        </div>
      </div>

      <!-- Row 2: Role + Team -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <label for="userRole" class="form-label">Role <span class="text-danger">*</span></label>
          <div class="d-grid">
            <Dropdown 
              id="userRole"
              v-model="uf.role"
              :options="roleModalOptions"
              placeholder="Select"
              variant="outline-secondary"
              size="sm"
            />
          </div>
          <div v-if="ue.role" class="invalid-feedback d-block">{{ ue.role }}</div>
        </div>
        <div class="col-12 col-md-6">
          <label for="userTeam" class="form-label">Team / Division</label>
          <input id="userTeam" type="text" class="form-control" v-model="uf.team" placeholder="Design System, Mobile, Web...">
        </div>
      </div>

      <!-- Row 3: Phone + Status -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <label for="userPhone" class="form-label">Phone</label>
          <input id="userPhone" type="text" class="form-control" v-model="uf.phone" placeholder="+62 8xx-xxxx-xxxx">
        </div>
        <div class="col-12 col-md-6">
          <label for="userStatus" class="form-label">Status</label>
          <div class="d-grid">
            <Dropdown 
              id="userStatus"
              v-model="uf.status"
              :options="statusModalOptions"
              placeholder="Select"
              variant="outline-secondary"
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Bio -->
      <div class="mb-3">
        <label for="userBio" class="form-label">Bio</label>
        <textarea id="userBio" class="form-control" v-model="uf.bio" placeholder="Short bio..." rows="2"></textarea>
      </div>

      <!-- Password fields (only for new users) -->
      <div v-if="!editUser" class="row g-3">
        <div class="col-12 col-md-6">
          <label for="userPassword" class="form-label">Password <span class="text-danger">*</span></label>
          <input id="userPassword" type="password" class="form-control" v-model="uf.password">
          <div v-if="ue.password" class="invalid-feedback d-block">{{ ue.password }}</div>
        </div>
        <div class="col-12 col-md-6">
          <label for="userConfirm" class="form-label">Confirm Password <span class="text-danger">*</span></label>
          <input id="userConfirm" type="password" class="form-control" v-model="uf.confirm">
          <div v-if="ue.confirm" class="invalid-feedback d-block">{{ ue.confirm }}</div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="save">{{ editUser ? 'Save Changes' : 'Create User' }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/menu'
import { formatDate } from '@/composables/useFormat'
import { PageHeader, StatGrid, Modal, Dropdown } from '@/components/ui'

const userStore = useUsersStore(); const ui = useUiStore()
const search = ref(''); const filterRole = ref(''); const filterStatus = ref('')
const showModal = ref(false); const editUser = ref(null)
const uf = ref({ name:'', email:'', role:'', team:'', phone:'', status:'active', bio:'', password:'', confirm:'' })
const ue = ref({})

// KPI Stats for StatGrid
const kpiStats = computed(() => [
  { id: 'total', icon: '👥', value: userStore.items.length, label: 'Total Users', color: 'var(--g)' },
  { id: 'designers', icon: '🎨', value: byRole('designer'), label: 'Designers', color: 'var(--purple)' },
  { id: 'engineers', icon: '⚙️', value: byRole('engineer'), label: 'Engineers', color: 'var(--blue)' },
  { id: 'developers', icon: '💻', value: byRole('developer'), label: 'Developers', color: 'var(--orange)' },
])

// Dropdown options
const roleOptions = computed(() => [
  { value: '', label: 'All Roles' },
  { value: 'designer', label: 'Designer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'developer', label: 'Developer' },
])

const statusFilterOptions = computed(() => [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
])

const roleModalOptions = computed(() => [
  { value: '', label: 'Select' },
  { value: 'designer', label: '🎨 Designer' },
  { value: 'engineer', label: '⚙️ Engineer' },
  { value: 'developer', label: '💻 Developer' },
])

const statusModalOptions = computed(() => [
  { value: 'active', label: '✅ Active' },
  { value: 'inactive', label: '⏸ Inactive' },
  { value: 'suspended', label: '🚫 Suspended' },
])

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
