<!-- DataMasterView.vue -->
<template>
  <div>
    <PageHeader 
      title="Data Master" 
      subtitle="Kelola nilai dropdown yang muncul saat pengisian form request"
    />

    <!-- Loading state -->
    <EmptyState 
      v-if="dmStore.loading"
      icon="⏳"
      message="Loading..."
    />

    <!-- Main layout -->
    <div v-else class="row g-3">
      <!-- LEFT: category list -->
      <div class="col-12 col-md-3">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0" style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--s400)">Kategori</h6>
          </div>
          <div class="list-group list-group-flush">
            <button v-for="cat in CATEGORIES" :key="cat.key"
              class="list-group-item list-group-item-action d-flex align-items-center gap-2"
              :class="{ active: activeKey === cat.key }"
              @click="activeKey = cat.key"
              style="border: none; padding: 10px 14px; transition: background .12s">
              <span style="font-size: 16px; flex-shrink: 0">{{ cat.icon }}</span>
              <div style="flex: 1; min-width: 0; text-align: left">
                <div style="font-size: 13px; font-weight: 500">{{ cat.title }}</div>
                <div style="font-size: 11px; color: var(--s400)">{{ itemCount(cat.key) }} item</div>
              </div>
              <svg style="width: 14px; height: 14px; color: currentColor; flex-shrink: 0; transform: rotate(0deg); transition: transform .2s" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: CRUD table for active category -->
      <div class="col-12 col-md-9" v-if="activeCategory">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h5 class="mb-1">{{ activeCategory.icon }} {{ activeCategory.title }}</h5>
            <p class="mb-0 text-secondary" style="font-size: 12px">{{ activeCategory.desc }}</p>
          </div>
          <button class="btn btn-primary btn-sm" @click="openModal(null)">+ Tambah</button>
        </div>

        <!-- Table -->
        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:40px; font-size: 12px">#</th>
                  <th style="font-size: 12px">{{ activeCategory.isKv ? 'Label (Tampil)' : 'Nilai' }}</th>
                  <th v-if="activeCategory.isKv" style="width:120px; font-size: 12px">Key (Value)</th>
                  <th v-if="activeKey === 'requestTypes'" style="width:120px; font-size: 12px">Kategori</th>
                  <th style="width:90px; font-size: 12px">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="currentItems.length === 0">
                  <td :colspan="activeKey === 'requestTypes' ? 5 : (activeCategory.isKv ? 4 : 3)" class="text-center py-5 text-secondary">
                    Belum ada data. Klik "+ Tambah" untuk menambahkan.
                  </td>
                </tr>
                <tr v-for="(item, idx) in currentItems" :key="idx">
                  <td style="color: var(--s400); font-size: 12px">{{ idx + 1 }}</td>
                  <td style="font-weight: 500">{{ activeCategory.isKv ? item.label : item }}</td>
                  <td v-if="activeCategory.isKv">
                    <code style="background: var(--s100); color: var(--s600); padding: 2px 8px; border-radius: 4px; font-size: 11.5px; font-family: 'JetBrains Mono', monospace">{{ item.value }}</code>
                  </td>
                  <td v-if="activeKey === 'requestTypes'">
                    <span class="badge" style="font-size: 11px; font-weight: 600; padding: 4px 8px; text-transform: capitalize" :title="item.category"
                      :style="item.category === 'engineer' ? 'background: rgba(99, 102, 241, 0.15); color: rgb(99, 102, 241)' :
                              item.category === 'designer' ? 'background: rgba(236, 72, 153, 0.15); color: rgb(236, 72, 153)' :
                              item.category === 'illustrator' ? 'background: rgba(168, 85, 247, 0.15); color: rgb(168, 85, 247)' :
                              'background: rgba(34, 197, 94, 0.15); color: rgb(34, 197, 94)'">
                      {{ item.category }}
                    </span>
                  </td>
                  <td style="white-space: nowrap">
                    <button class="btn btn-outline-secondary btn-sm" @click="openModal(idx)" title="Edit" style="font-size: 12px">✏️</button>
                    <button class="btn btn-outline-danger btn-sm" @click="doDelete(idx)" title="Hapus" style="font-size: 12px">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Add / Edit -->
    <Modal v-model="modal.show" :title="`${modal.editIdx === null ? 'Tambah' : 'Edit'} ${activeCategory?.title}`" confirmLabel="Save" @confirm="confirmModal">
      <div class="mb-3">
        <label class="form-label">{{ activeCategory?.isKv ? 'Label (tampil di dropdown)' : 'Nilai' }} <span style="color: var(--danger)">*</span></label>
        <input type="text" class="form-control" v-model="modal.label" :placeholder="activeCategory?.isKv ? 'Contoh: New Component' : 'Contoh: Web'" autofocus
          @input="activeCategory?.isKv && autoValue()" :class="{ 'is-invalid': modal.err && !modal.label.trim() }" />
        <div class="invalid-feedback d-block" v-if="modal.err">{{ modal.err }}</div>
      </div>
      <div class="mb-3" v-if="activeCategory?.isKv">
        <label class="form-label">Key / Value <span style="font-size:11px;color:var(--s400)">(otomatis dari label)</span></label>
        <input type="text" class="form-control" v-model="modal.value" placeholder="Contoh: new_component" style="font-family:'JetBrains Mono',monospace;font-size:13px" />
      </div>
      <div class="mb-3" v-if="activeKey === 'requestTypes'">
        <label class="form-label">Kategori <span style="color: var(--danger)">*</span></label>
        <Dropdown
          v-model="modal.category"
          :options="categoryOptions"
          placeholder="Pilih Kategori"
          variant="outline-secondary"
          size="sm"
          :class="{ 'is-invalid': modal.err && activeKey === 'requestTypes' && !modal.category.trim() }"
        />
        <div class="invalid-feedback d-block" v-if="modal.err">Kategori wajib dipilih</div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="modal.show = false">Batal</button>
        <button type="button" class="btn btn-primary" @click="confirmModal">{{ modal.editIdx === null ? 'Tambah' : 'Simpan' }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useDataMasterStore } from '@/stores/dataMaster'
import { useUiStore } from '@/stores/menu'
import { PageHeader, EmptyState, Modal, Dropdown } from '@/components/ui'

const dmStore = useDataMasterStore()
const ui      = useUiStore()

const CATEGORIES = [
  { key: 'requestTypes',        icon: '🏷️', title: 'Request Type',          desc: 'Jenis request yang bisa dipilih saat submit', isKv: true },
  { key: 'priorities',          icon: '🔥', title: 'Priority',              desc: 'Tingkat urgensi request' },
  { key: 'impactLevels',        icon: '📊', title: 'Impact Level',          desc: 'Tingkat dampak terhadap produk' },
  { key: 'stateRequirements',   icon: '🎛️', title: 'State Requirements',    desc: 'State interaksi yang perlu diimplementasi' },
  { key: 'responsiveBehaviours',icon: '📐', title: 'Responsive Behaviour',  desc: 'Perilaku responsif komponen' },
  { key: 'severityLevels',      icon: '⚠️', title: 'Severity Level',        desc: 'Tingkat keparahan masalah' },
]

const activeKey = ref('requestTypes')
const activeCategory = computed(() => CATEGORIES.find(c => c.key === activeKey.value))

// Dropdown options for requestType categories
const categoryOptions = computed(() => [
  { value: '', label: '-- Pilih Kategori --' },
  { value: 'engineer', label: '⚙️ Engineer' },
  { value: 'designer', label: '🎨 Designer' },
  { value: 'illustrator', label: '🎭 Illustrator' },
  { value: 'researcher', label: '🔬 Researcher' }
])

// Local working copy
const local = reactive({
  requestTypes: [], priorities: [],
  impactLevels: [], stateRequirements: [], responsiveBehaviours: [], severityLevels: [],
})

function syncFromStore() {
  const s = dmStore.settings
  local.requestTypes        = (s.requestTypes || []).map(t => ({ ...t }))
  local.priorities           = [...(s.priorities || [])]
  local.impactLevels         = [...(s.impactLevels || [])]
  local.stateRequirements    = [...(s.stateRequirements || [])]
  local.responsiveBehaviours = [...(s.responsiveBehaviours || [])]
  local.severityLevels       = [...(s.severityLevels || [])]
}

onMounted(syncFromStore)
watch(() => dmStore.settings, syncFromStore, { deep: true })

const currentItems = computed(() => local[activeKey.value] || [])
const itemCount = (key) => (local[key] || []).length

// ── Modal state ──────────────────────────────────────────────────────────
const modal = reactive({ show: false, editIdx: null, label: '', value: '', category: '', err: '' })

function autoValue() {
  modal.value = modal.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function openModal(idx) {
  modal.editIdx = idx
  modal.err = ''
  if (idx === null) {
    modal.label = ''; modal.value = ''; modal.category = ''
  } else {
    const item = currentItems.value[idx]
    if (activeCategory.value.isKv) {
      modal.label = item.label; modal.value = item.value; modal.category = item.category || ''
    } else {
      modal.label = item; modal.value = ''; modal.category = ''
    }
  }
  modal.show = true
}

async function confirmModal() {
  if (!modal.label.trim()) { modal.err = 'Nilai wajib diisi'; return }
  if (activeCategory.value.isKv && !modal.value.trim()) autoValue()
  if (activeKey.value === 'requestTypes' && !modal.category.trim()) { modal.err = 'Kategori wajib dipilih'; return }

  const key = activeKey.value
  if (modal.editIdx === null) {
    if (activeCategory.value.isKv) {
      local[key].push({ label: modal.label.trim(), value: modal.value.trim(), category: modal.category.trim() || '' })
    } else {
      local[key].push(modal.label.trim())
    }
  } else {
    if (activeCategory.value.isKv) {
      local[key][modal.editIdx] = { label: modal.label.trim(), value: modal.value.trim(), category: modal.category.trim() || '' }
    } else {
      local[key][modal.editIdx] = modal.label.trim()
    }
  }
  modal.show = false
  await persist()
}

async function doDelete(idx) {
  if (!confirm('Hapus item ini?')) return
  local[activeKey.value].splice(idx, 1)
  await persist()
}

async function persist() {
  try {
    await dmStore.save({
      requestTypes:        local.requestTypes.map(t => ({ label: t.label, value: t.value, category: t.category || '' })),
      priorities:          [...local.priorities],
      impactLevels:        [...local.impactLevels],
      stateRequirements:   [...local.stateRequirements],
      responsiveBehaviours:[...local.responsiveBehaviours],
      severityLevels:      [...local.severityLevels],
    })
    ui.showToast('Disimpan')
  } catch (e) {
    ui.showToast(e.message, 'err')
    syncFromStore() // revert on error
  }
}
</script>
