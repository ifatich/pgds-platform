<!-- DataMasterView.vue -->
<template>
  <div class="dm-root">
    <div class="sh">
      <div>
        <h2>Data Master</h2>
        <p>Kelola nilai dropdown yang muncul saat pengisian form request</p>
      </div>
    </div>

    <div v-if="dmStore.loading" class="empty"><div class="ei">⏳</div><p>Loading...</p></div>
    <div v-else class="dm-layout">

      <!-- LEFT: category list -->
      <div class="card dm-catlist">
        <div class="dm-catlist-title">Kategori</div>
        <div
          v-for="cat in CATEGORIES" :key="cat.key"
          class="dm-cat-item"
          :class="{ active: activeKey === cat.key }"
          @click="activeKey = cat.key"
        >
          <span class="dm-cat-icon">{{ cat.icon }}</span>
          <div class="dm-cat-info">
            <div class="dm-cat-name">{{ cat.title }}</div>
            <div class="dm-cat-count">{{ itemCount(cat.key) }} item</div>
          </div>
          <svg class="dm-cat-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>

      <!-- RIGHT: CRUD table for active category -->
      <div class="dm-detail" v-if="activeCategory">
        <div class="dm-detail-hd">
          <div>
            <div class="dm-detail-title">{{ activeCategory.icon }} {{ activeCategory.title }}</div>
            <div class="dm-detail-desc">{{ activeCategory.desc }}</div>
          </div>
          <button class="btn btn-primary btn-sm" @click="openModal(null)">+ Tambah</button>
        </div>

        <div class="card" style="padding:0;overflow:hidden">
          <table class="dm-table">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>{{ activeCategory.isKv ? 'Label (Tampil)' : 'Nilai' }}</th>
                <th v-if="activeCategory.isKv" style="width:200px">Key (Value)</th>
                <th style="width:90px">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="currentItems.length === 0">
                <td :colspan="activeCategory.isKv ? 4 : 3" style="text-align:center;padding:32px;color:var(--s400)">
                  Belum ada data. Klik "+ Tambah" untuk menambahkan.
                </td>
              </tr>
              <tr v-for="(item, idx) in currentItems" :key="idx">
                <td class="dm-td-num">{{ idx + 1 }}</td>
                <td class="dm-td-label">{{ activeCategory.isKv ? item.label : item }}</td>
                <td v-if="activeCategory.isKv" class="dm-td-value">
                  <span class="dm-mono-pill">{{ item.value }}</span>
                </td>
                <td class="dm-td-actions">
                  <button class="btn btn-ghost btn-icon btn-sm" @click="openModal(idx)" title="Edit">✏️</button>
                  <button class="btn btn-danger btn-icon btn-sm" @click="doDelete(idx)" title="Hapus">🗑</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Add / Edit -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="modal.show" class="overlay" @click.self="modal.show = false">
          <div class="modal">
            <div class="mh">
              <h2>{{ modal.editIdx === null ? 'Tambah' : 'Edit' }} {{ activeCategory?.title }}</h2>
              <button class="btn btn-ghost btn-icon" @click="modal.show = false">✕</button>
            </div>
            <div class="mb">
              <div class="fg">
                <label class="fl">{{ activeCategory?.isKv ? 'Label (tampil di dropdown)' : 'Nilai' }} <span class="req">*</span></label>
                <input class="fi" v-model="modal.label" :placeholder="activeCategory?.isKv ? 'Contoh: New Component' : 'Contoh: Web'" autofocus
                  @input="activeCategory?.isKv && autoValue()" />
                <div class="fe" v-if="modal.err">{{ modal.err }}</div>
              </div>
              <div class="fg" v-if="activeCategory?.isKv">
                <label class="fl">Key / Value <span style="font-size:11px;color:var(--s400)">(otomatis dari label)</span></label>
                <input class="fi" v-model="modal.value" placeholder="Contoh: new_component" style="font-family:'JetBrains Mono',monospace;font-size:13px" />
              </div>
            </div>
            <div class="mf">
              <button class="btn btn-sec" @click="modal.show = false">Batal</button>
              <button class="btn btn-primary" @click="confirmModal">{{ modal.editIdx === null ? 'Tambah' : 'Simpan' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useDataMasterStore } from '@/stores/dataMaster'
import { useUiStore } from '@/stores/menu'

const dmStore = useDataMasterStore()
const ui      = useUiStore()

const CATEGORIES = [
  { key: 'requestTypes',        icon: '🏷️', title: 'Request Type',          desc: 'Jenis request yang bisa dipilih saat submit', isKv: true },
  { key: 'platforms',           icon: '🖥️', title: 'Platform',              desc: 'Platform target pengembangan komponen' },
  { key: 'priorities',          icon: '🔥', title: 'Priority',              desc: 'Tingkat urgensi request' },
  { key: 'impactLevels',        icon: '📊', title: 'Impact Level',          desc: 'Tingkat dampak terhadap produk' },
  { key: 'stateRequirements',   icon: '🎛️', title: 'State Requirements',    desc: 'State interaksi yang perlu diimplementasi' },
  { key: 'responsiveBehaviours',icon: '📐', title: 'Responsive Behaviour',  desc: 'Perilaku responsif komponen' },
]

const activeKey = ref('requestTypes')
const activeCategory = computed(() => CATEGORIES.find(c => c.key === activeKey.value))

// Local working copy
const local = reactive({
  requestTypes: [], platforms: [], priorities: [],
  impactLevels: [], stateRequirements: [], responsiveBehaviours: [],
})

function syncFromStore() {
  const s = dmStore.settings
  local.requestTypes        = (s.requestTypes || []).map(t => ({ ...t }))
  local.platforms            = [...(s.platforms || [])]
  local.priorities           = [...(s.priorities || [])]
  local.impactLevels         = [...(s.impactLevels || [])]
  local.stateRequirements    = [...(s.stateRequirements || [])]
  local.responsiveBehaviours = [...(s.responsiveBehaviours || [])]
}

onMounted(syncFromStore)
watch(() => dmStore.settings, syncFromStore, { deep: true })

const currentItems = computed(() => local[activeKey.value] || [])
const itemCount = (key) => (local[key] || []).length

// ── Modal state ──────────────────────────────────────────────────────────
const modal = reactive({ show: false, editIdx: null, label: '', value: '', err: '' })

function autoValue() {
  modal.value = modal.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function openModal(idx) {
  modal.editIdx = idx
  modal.err = ''
  if (idx === null) {
    modal.label = ''; modal.value = ''
  } else {
    const item = currentItems.value[idx]
    if (activeCategory.value.isKv) {
      modal.label = item.label; modal.value = item.value
    } else {
      modal.label = item; modal.value = ''
    }
  }
  modal.show = true
}

async function confirmModal() {
  if (!modal.label.trim()) { modal.err = 'Nilai wajib diisi'; return }
  if (activeCategory.value.isKv && !modal.value.trim()) autoValue()

  const key = activeKey.value
  if (modal.editIdx === null) {
    if (activeCategory.value.isKv) local[key].push({ label: modal.label.trim(), value: modal.value.trim() })
    else local[key].push(modal.label.trim())
  } else {
    if (activeCategory.value.isKv) local[key][modal.editIdx] = { label: modal.label.trim(), value: modal.value.trim() }
    else local[key][modal.editIdx] = modal.label.trim()
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
      requestTypes:        local.requestTypes.map(t => ({ ...t })),
      platforms:           [...local.platforms],
      priorities:          [...local.priorities],
      impactLevels:        [...local.impactLevels],
      stateRequirements:   [...local.stateRequirements],
      responsiveBehaviours:[...local.responsiveBehaviours],
    })
    ui.showToast('Disimpan')
  } catch (e) {
    ui.showToast(e.message, 'err')
    syncFromStore() // revert on error
  }
}
</script>

<style scoped>
.dm-root { display: flex; flex-direction: column; }
.dm-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  align-items: start;
}
/* Category list */
.dm-catlist {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dm-catlist-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--s400, #94a3b8);
  padding: 6px 8px 10px;
}
.dm-cat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--r8, 8px);
  cursor: pointer;
  transition: background .12s;
}
.dm-cat-item:hover { background: var(--s100, #f1f5f9); }
.dm-cat-item.active { background: var(--primary-soft, #eef2ff); }
.dm-cat-item.active .dm-cat-name { color: var(--primary, #6366f1); font-weight: 700; }
.dm-cat-item.active .dm-cat-chevron { color: var(--primary, #6366f1); }
.dm-cat-icon { font-size: 16px; flex-shrink: 0; }
.dm-cat-info { flex: 1; min-width: 0; }
.dm-cat-name { font-size: 13px; font-weight: 500; color: var(--s800, #1e293b); }
.dm-cat-count { font-size: 11px; color: var(--s400, #94a3b8); }
.dm-cat-chevron { width: 14px; height: 14px; color: var(--s300, #cbd5e1); flex-shrink: 0; }
/* Detail panel */
.dm-detail-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.dm-detail-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--navy, #1e293b);
  margin-bottom: 2px;
}
.dm-detail-desc {
  font-size: 12px;
  color: var(--s500, #64748b);
}
/* Table */
.dm-table {
  width: 100%;
  border-collapse: collapse;
}
.dm-table thead tr { background: var(--s50, #f8fafc); }
.dm-table th {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--s500, #64748b);
  text-align: left;
  border-bottom: 1px solid var(--border, #e2e8f0);
}
.dm-table td {
  padding: 11px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--border, #e2e8f0);
}
.dm-table tbody tr:last-child td { border-bottom: none; }
.dm-table tbody tr:hover { background: var(--s50, #f8fafc); }
.dm-td-num { color: var(--s400, #94a3b8); font-size: 12px; width: 40px; }
.dm-td-label { font-weight: 500; color: var(--s800, #1e293b); }
.dm-td-value { }
.dm-td-actions { white-space: nowrap; }
.dm-mono-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  background: var(--s100, #f1f5f9);
  color: var(--s600, #475569);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
