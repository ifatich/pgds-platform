<template>
  <div>
    <!-- Header using PageHeader component -->
    <PageHeader
      title="Component Library"
      :subtitle="`${doneComponents.length} komponen dirilis`"
      :actionLabel="canEdit ? '+ Add Component' : null"
      @action="openModal(null)"
      :showAction="canEdit"
    />

    <!-- Library stats using StatGrid component -->
    <StatGrid :stats="kpiStats" :columns="4" marginBottom="24px" />

    <!-- Filters (search + selects) -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <div class="input-group" style="max-width: 300px">
        <span class="input-group-text">🔍</span>
        <input type="text" class="form-control" v-model="search" placeholder="Cari nama komponen...">
      </div>
      <Dropdown 
        v-model="filterLibrary"
        :options="libraryOptions"
        placeholder="All Libraries"
        variant="outline-secondary"
        size="sm"
        style="min-width: 150px"
      />
      <Dropdown 
        v-model="filterLevel"
        :options="levelOptions"
        placeholder="All Levels"
        variant="outline-secondary"
        size="sm"
        style="min-width: 140px"
      />
    </div>

    <!-- Loading / Table -->
    <div v-if="compStore.loading" class="empty-state">
      <div style="font-size: 32px; margin-bottom: 8px">⏳</div>
      <p>Loading...</p>
    </div>
    <div v-else>
      <!-- Table Card -->
      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Nama Komponen</th>
                <th>Level</th>
                <th>Library</th>
                <th>Versi Terakhir</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginated.length === 0">
                <td colspan="6">
                  <div class="empty-state" style="padding: 40px 20px">
                    <div style="font-size: 32px; margin-bottom: 8px">📦</div>
                    <p>Belum ada komponen yang dirilis</p>
                  </div>
                </td>
              </tr>
              <tr v-for="c in paginated" :key="c.id">
                <td>
                  <div class="fw-bold" style="font-size: 13px">{{ c.name }}</div>
                  <div v-if="c.description" class="text-muted" style="font-size: 11px; margin-top: 2px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ c.description }}</div>
                </td>
                <td>
                  <span v-if="c.atomicLevel" class="badge" :class="'b-'+c.atomicLevel">{{ c.atomicLevel }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span v-if="c.library" class="badge bg-secondary" style="font-size: 10.5px; font-family: 'JetBrains Mono', monospace">{{ c.library }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span v-if="c.version" style="font-family: 'JetBrains Mono', monospace; font-size: 12px">v{{ c.version }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-muted" style="font-size: 11.5px">{{ formatDate(c.updatedAt) }}</td>
                <td>
                  <div class="btn-group btn-group-sm" role="group">
                    <a v-if="c.docLink" :href="c.docLink" target="_blank" class="btn btn-outline-secondary" title="Lihat Dokumentasi">📄</a>
                    <button v-if="canEdit" class="btn btn-outline-secondary" @click="openModal(c)" title="Edit">✏️</button>
                    <button v-if="canEdit" class="btn btn-outline-danger" @click="doDelete(c)" title="Hapus">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="mt-4 d-flex justify-content-between align-items-center">
        <span class="text-muted">{{ filtered.length }} total</span>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: page <= 1 }">
            <button class="page-link" @click="page--">‹ Previous</button>
          </li>
          <li v-for="p in pageNums" :key="p" class="page-item" :class="{ active: p === page }">
            <button class="page-link" @click="page = p">{{ p }}</button>
          </li>
          <li class="page-item" :class="{ disabled: page >= totalPages }">
            <button class="page-link" @click="page++">Next ›</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Modal Component -->
    <Modal v-model="showModal" :title="editItem ? 'Edit Component' : 'Tambah Component'" size="lg" confirmLabel="Save" @confirm="save">
      <!-- Row 1: Name + Slug -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <label for="compName" class="form-label">Nama Komponen <span class="text-danger">*</span></label>
          <input id="compName" type="text" class="form-control" v-model="cf.name" @input="autoSlug">
          <div v-if="ce.name" class="invalid-feedback d-block">{{ ce.name }}</div>
        </div>
        <div class="col-12 col-md-6">
          <label for="compSlug" class="form-label">Slug <span class="text-danger">*</span></label>
          <input id="compSlug" type="text" class="form-control" v-model="cf.slug">
          <div v-if="ce.slug" class="invalid-feedback d-block">{{ ce.slug }}</div>
        </div>
      </div>

      <!-- Row 2: Atomic Level + Library -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Atomic Level <span class="text-muted" style="font-size: 11px">(opsional)</span></label>
          <Dropdown 
            v-model="cf.atomicLevel"
            :options="[{ value: '', label: '— (variant / belum ditentukan)' }, ...LEVELS.map(l => ({ value: l, label: l }))]"
            placeholder="Select level"
            variant="outline-secondary"
            size="sm"
          />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Library</label>
          <Dropdown 
            v-model="cf.library"
            :options="[{ value: '', label: '— (tanpa library)' }, ...availableLibraries.map(lib => ({ value: lib, label: lib })), { value: '__custom__', label: '+ Lainnya...' }]"
            placeholder="Select library"
            variant="outline-secondary"
            size="sm"
          />
          <input v-if="cf.library === '__custom__'" type="text" class="form-control mt-2" v-model="cf.customLibrary" placeholder="Nama library...">
        </div>
      </div>

      <!-- Row 3: Version + Doc Link -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <label for="version" class="form-label">Version</label>
          <input id="version" type="text" class="form-control" v-model="cf.version" placeholder="1.0.0">
        </div>
        <div class="col-12 col-md-6">
          <label for="docLink" class="form-label">Link Dokumentasi</label>
          <input id="docLink" type="text" class="form-control" v-model="cf.docLink" placeholder="https://storybook.../docs">
        </div>
      </div>

      <!-- Description -->
      <div class="mb-3">
        <label for="description" class="form-label">Description</label>
        <textarea id="description" class="form-control" v-model="cf.description" placeholder="Deskripsi singkat komponen..." rows="2"></textarea>
      </div>

      <!-- Figma + Storybook URLs -->
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label for="figmaUrl" class="form-label">Figma URL</label>
          <input id="figmaUrl" type="text" class="form-control" v-model="cf.figmaUrl" placeholder="https://figma.com/...">
        </div>
        <div class="col-12 col-md-6">
          <label for="storybookUrl" class="form-label">Storybook URL</label>
          <input id="storybookUrl" type="text" class="form-control" v-model="cf.storybookUrl" placeholder="https://storybook.io/...">
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="save">{{ editItem ? 'Simpan' : 'Tambah' }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useComponentsStore } from '@/stores/components'
import { useUiStore } from '@/stores/menu'
import { formatDate, LIBRARIES } from '@/composables/useFormat'
import { PageHeader, StatGrid, Modal, Dropdown } from '@/components/ui'

const auth      = useAuthStore()
const compStore = useComponentsStore()
const ui        = useUiStore()

const LEVELS = ['atom','molecule','organism','template','page']

const search        = ref('')
const filterLevel   = ref('')
const filterLibrary = ref('')
const page          = ref(1)
const PAGE_SIZE     = 10
const showModal     = ref(false)
const editItem      = ref(null)
const cf = ref({ name:'', slug:'', atomicLevel:'', library:'', customLibrary:'', version:'', docLink:'', description:'', figmaUrl:'', storybookUrl:'' })
const ce = ref({})

const canEdit = computed(() => ['engineer','super_admin'].includes(auth.role))

const doneComponents = computed(() => compStore.items.filter(c => c.status === 'done' && c.isActive))

// KPI Stats for StatGrid
const kpiStats = computed(() => {
  const baseStats = [
    { id: 'total', icon: '📦', value: doneComponents.value.length, label: 'Total Components', color: 'var(--purple)' },
  ]
  return [...baseStats, ...libraryStats.value.map(lib => ({
    id: lib.name,
    icon: '📚',
    value: lib.count,
    label: lib.name,
    color: 'var(--blue)',
  }))]
})

const filtered = computed(() => doneComponents.value.filter(c => {
  if (search.value && !c.name.toLowerCase().includes(search.value.toLowerCase())) return false
  if (filterLevel.value && c.atomicLevel !== filterLevel.value) return false
  if (filterLibrary.value && c.library !== filterLibrary.value) return false
  return true
}))

const availableLibraries = computed(() => {
  const fromData = doneComponents.value.map(c => c.library).filter(Boolean)
  return [...new Set([...LIBRARIES, ...fromData])].sort()
})

// Dropdown options for filter and modal
const levelOptions = computed(() => [
  { value: '', label: 'All Levels' },
  ...LEVELS.map(l => ({ value: l, label: l }))
])

const libraryOptions = computed(() => [
  { value: '', label: 'All Libraries' },
  ...availableLibraries.value.map(lib => ({ value: lib, label: lib })),
  { value: '__custom__', label: '+ Lainnya...' }
])

const libraryStats = computed(() => {
  const map = {}
  doneComponents.value.forEach(c => {
    const k = c.library || 'No Library'
    map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*PAGE_SIZE, page.value*PAGE_SIZE))
const pageNums   = computed(() => { const p = []; for (let i=Math.max(1,page.value-2); i<=Math.min(totalPages.value,page.value+2); i++) p.push(i); return p })

function openModal(c) {
  editItem.value = c; ce.value = {}
  const libVal = c ? (LIBRARIES.includes(c.library) ? c.library : c.library ? '__custom__' : '') : ''
  const customLib = c ? (LIBRARIES.includes(c.library) ? '' : c.library || '') : ''
  cf.value = c
    ? { name: c.name, slug: c.slug, atomicLevel: c.atomicLevel || '', library: libVal, customLibrary: customLib, version: c.version || '', docLink: c.docLink || '', description: c.description || '', figmaUrl: c.figmaUrl || '', storybookUrl: c.storybookUrl || '' }
    : { name:'', slug:'', atomicLevel:'', library:'', customLibrary:'', version:'', docLink:'', description:'', figmaUrl:'', storybookUrl:'' }
  showModal.value = true
}

function autoSlug() {
  if (!editItem.value) {
    cf.value.slug = cf.value.name
      .replace(/([A-Z])/g, (m,l,i) => i > 0 ? '-'+l.toLowerCase() : l.toLowerCase())
      .replace(/^-/, '').replace(/\s+/g, '-')
  }
}

async function save() {
  const errs = {}
  if (!cf.value.name) errs.name = 'Required'
  if (!cf.value.slug) errs.slug = 'Required'
  ce.value = errs
  if (Object.keys(errs).length) return
  const payload = {
    name: cf.value.name,
    slug: cf.value.slug,
    atomicLevel: cf.value.atomicLevel || null,
    library: (cf.value.library === '__custom__' ? cf.value.customLibrary.trim() : cf.value.library) || null,
    version: cf.value.version || null,
    docLink: cf.value.docLink || null,
    description: cf.value.description || null,
    figmaUrl: cf.value.figmaUrl || null,
    storybookUrl: cf.value.storybookUrl || null,
    status: 'done',
    tags: [],
  }
  try {
    if (editItem.value) { await compStore.update(editItem.value.id, payload); ui.showToast('Component updated') }
    else { await compStore.create(payload); ui.showToast('Component berhasil ditambahkan') }
    showModal.value = false
  } catch (e) { ui.showToast(e.message, 'err') }
}

async function doDelete(c) {
  if (!confirm('Hapus komponen "' + c.name + '"?')) return
  try { await compStore.remove(c.id); ui.showToast('Component deleted') }
  catch (e) { ui.showToast(e.message, 'err') }
}
</script>
