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
          <button v-if="activeKey !== 'requestPipelines' && activeKey !== 'requestPipelinesByType'" class="btn btn-primary btn-sm" @click="openModal(null)">+ Tambah</button>
        </div>

        <div v-if="activeKey === 'requestPipelinesByType'" class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:40px; font-size: 12px">#</th>
                  <th style="font-size: 12px">Request Type</th>
                  <th style="width:120px; font-size: 12px">Kategori</th>
                  <th style="width:200px; font-size: 12px">Pipeline Stages</th>
                  <th style="width:90px; font-size: 12px">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="local.requestTypes.length === 0">
                  <td colspan="5" class="text-center py-5 text-secondary">
                    Belum ada request types yang dikonfigurasi
                  </td>
                </tr>
                <tr v-for="(reqType, idx) in local.requestTypes" :key="idx">
                  <td style="color: var(--s400); font-size: 12px">{{ idx + 1 }}</td>
                  <td style="font-weight: 500">{{ reqType.label }}</td>
                  <td>
                    <span class="badge" style="font-size: 11px; font-weight: 600; padding: 4px 8px; text-transform: capitalize"
                      :style="reqType.category === 'engineer' ? 'background: rgba(99, 102, 241, 0.15); color: rgb(99, 102, 241)' :
                              reqType.category === 'designer' ? 'background: rgba(236, 72, 153, 0.15); color: rgb(236, 72, 153)' :
                              reqType.category === 'illustrator' ? 'background: rgba(168, 85, 247, 0.15); color: rgb(168, 85, 247)' :
                              'background: rgba(34, 197, 94, 0.15); color: rgb(34, 197, 94)'">
                      {{ reqType.category }}
                    </span>
                  </td>
                  <td style="font-size: 12px">
                    <span v-if="local.requestPipelinesByType[reqType.value]?.length" style="color: var(--s500)">
                      {{ local.requestPipelinesByType[reqType.value].length }} stages
                    </span>
                    <span v-else style="color: var(--s300)">belum dikonfigurasi</span>
                  </td>
                  <td style="white-space: nowrap">
                    <button class="btn btn-outline-primary btn-sm" @click="openPipelineModal(reqType.value, reqType.label)" title="Edit Pipeline" style="font-size: 12px">⚙️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeKey === 'formFields'" class="row g-3">
          <div v-for="cat in categoryOptions.filter(o => o.value)" :key="cat.value" class="col-12">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center py-2" style="background: var(--s100)">
                <h6 class="mb-0" style="font-size: 13px; font-weight: 600">{{ cat.label }} Fields</h6>
                <button class="btn btn-primary btn-sm px-2 py-0" style="font-size: 11px" @click="openFormFieldModal(cat.value)">+ Add Field</button>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width:40px; font-size: 11px">#</th>
                      <th style="font-size: 11px">Key</th>
                      <th style="font-size: 11px">Label</th>
                      <th style="font-size: 11px">Type</th>
                      <th style="width:60px; font-size: 11px">Req</th>
                      <th style="width:90px; font-size: 11px">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!local.formFields[cat.value]?.length">
                      <td colspan="6" class="text-center py-3 text-secondary" style="font-size: 12px">No fields configured</td>
                    </tr>
                    <tr v-for="(field, fIdx) in local.formFields[cat.value]" :key="fIdx">
                      <td style="color: var(--s400); font-size: 11px">{{ fIdx + 1 }}</td>
                      <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px">{{ field.key }}</td>
                      <td style="font-size: 12px; font-weight: 500">{{ field.label }}</td>
                      <td style="font-size: 11px">
                        <span class="badge bg-light text-dark border">{{ field.type }}</span>
                      </td>
                      <td style="font-size: 12px">{{ field.required ? '✅' : '—' }}</td>
                      <td>
                        <button class="btn btn-outline-secondary btn-sm p-1" @click="openFormFieldModal(cat.value, fIdx)" style="font-size: 10px">✏️</button>
                        <button class="btn btn-outline-danger btn-sm p-1" @click="deleteFormField(cat.value, fIdx)" style="font-size: 10px">🗑</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeKey === 'requestPipelines'" class="card">
          <div class="card-body">
            <div class="alert alert-info py-2" style="font-size: 12px">
              Gunakan separator <strong>-&gt;</strong> atau koma untuk memisahkan status.
              Contoh: <em>backlog -&gt; in_design -&gt; done</em>
            </div>
            <div class="row g-3">
              <div v-for="role in pipelineRoles" :key="role.key" class="col-12">
                <label class="form-label" style="font-weight: 600">{{ role.label }} Pipeline</label>
                <input
                  type="text"
                  class="form-control"
                  :value="getPipelineText(role.key)"
                  @input="updatePipelineText(role.key, $event.target.value)"
                  :placeholder="`Contoh: backlog -> in_design -> done (${role.key})`"
                />
              </div>
            </div>
            <div class="d-flex justify-content-end mt-3">
              <button class="btn btn-primary btn-sm" @click="savePipelines">Simpan Pipeline</button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div v-else class="card">
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

    <!-- Modal Add / Edit (Standard) -->
    <Modal v-if="activeKey !== 'requestPipelines' && activeKey !== 'requestPipelinesByType' && activeKey !== 'formFields'" 
      v-model="modal.show" :title="`${modal.editIdx === null ? 'Tambah' : 'Edit'} ${activeCategory?.title}`" confirmLabel="Save" @confirm="confirmModal">
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

    <!-- Form Field Editor Modal -->
    <Modal v-model="formFieldModal.show" :title="`${formFieldModal.editIdx === null ? 'Add' : 'Edit'} Form Field`" size="lg" confirmLabel="Save" @confirm="saveFormField">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Key <span class="text-danger">*</span></label>
          <input type="text" class="form-control" v-model="formFieldModal.f.key" placeholder="e.g. componentName" style="font-family: 'JetBrains Mono', monospace" />
        </div>
        <div class="col-md-6">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Label <span class="text-danger">*</span></label>
          <input type="text" class="form-control" v-model="formFieldModal.f.label" placeholder="e.g. Component Name" />
        </div>
        <div class="col-md-6">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Type <span class="text-danger">*</span></label>
          <Dropdown
            v-model="formFieldModal.f.type"
            :options="fieldTypeOptions"
            placeholder="Select Type"
            variant="outline-secondary"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Required?</label>
          <div class="form-check form-switch mt-1">
            <input class="form-check-input" type="checkbox" v-model="formFieldModal.f.required">
            <label class="form-check-label">{{ formFieldModal.f.required ? 'Yes' : 'No' }}</label>
          </div>
        </div>
        <div class="col-12" v-if="['text', 'textarea', 'url'].includes(formFieldModal.f.type)">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Placeholder</label>
          <input type="text" class="form-control" v-model="formFieldModal.f.placeholder" placeholder="Hint for user..." />
        </div>
        <div class="col-12" v-if="formFieldModal.f.type === 'textarea'">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Rows</label>
          <input type="number" class="form-control" v-model="formFieldModal.f.rows" />
        </div>
        <div class="col-12" v-if="['dropdown', 'multi-select'].includes(formFieldModal.f.type)">
          <label class="form-label" style="font-size: 12px; font-weight: 600">Options (Array or Reference)</label>
          <textarea class="form-control" v-model="formFieldModal.f.options" placeholder="e.g. Option A, Option B OR reference key like 'priorities'"></textarea>
          <small class="text-muted">Use comma to separate options, or enter a reference name from Data Master.</small>
        </div>
      </div>
      <div v-if="formFieldModal.err" class="alert alert-danger mt-3 py-2" style="font-size: 12px">{{ formFieldModal.err }}</div>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="formFieldModal.show = false">Batal</button>
        <button type="button" class="btn btn-primary" @click="saveFormField">Simpan Field</button>
      </template>
    </Modal>

    <!-- Pipeline Editor Modal -->
    <Modal v-model="pipelineModal.show" :title="`Konfigurasi Pipeline: ${pipelineModal.editTypeLabel}`" size="lg">
      <div v-if="pipelineModal.err" class="alert alert-danger py-2" style="font-size: 12px">{{ pipelineModal.err }}</div>
      
      <!-- Stages Table -->
      <div class="table-responsive mb-3">
        <table class="table table-sm table-hover">
          <thead class="table-light">
            <tr>
              <th style="width:30px; font-size: 11px">#</th>
              <th style="font-size: 11px">Status</th>
              <th style="font-size: 11px">Label</th>
              <th style="font-size: 11px">On Fail Status</th>
              <th style="width:80px; font-size: 11px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pipelineModal.stages.length === 0">
              <td colspan="5" class="text-center py-3 text-secondary" style="font-size: 12px">
                Belum ada stages. Klik "Tambah Stage" untuk menambahkan.
              </td>
            </tr>
            <tr v-for="(stage, idx) in pipelineModal.stages" :key="idx">
              <td style="color: var(--s400); font-size: 11px">{{ idx + 1 }}</td>
              <td style="font-size: 12px; font-weight: 500">
                <code style="background: var(--s100); color: var(--s600); padding: 2px 6px; border-radius: 3px; font-family: 'JetBrains Mono', monospace">{{ stage.status }}</code>
              </td>
              <td style="font-size: 12px">{{ stage.label }}</td>
              <td style="font-size: 12px">
                <span v-if="stage.onFailStatus" style="background: rgba(255, 193, 7, 0.1); color: #ff9800; padding: 2px 8px; border-radius: 3px; font-size: 11px">
                  {{ stage.onFailStatus }}
                </span>
                <span v-else style="color: var(--s300); font-size: 11px">-</span>
              </td>
              <td style="white-space: nowrap">
                <button class="btn btn-outline-secondary btn-sm" @click="openStageEditor(idx)" title="Edit" style="font-size: 11px; padding: 2px 6px">✏️</button>
                <button class="btn btn-outline-danger btn-sm" @click="deleteStage(idx)" title="Delete" style="font-size: 11px; padding: 2px 6px">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stage Editor Inline Form -->
      <div v-if="pipelineModal.editStageIdx >= 0 || pipelineModal.editStageIdx === null" class="card mb-3">
        <div class="card-header" style="background: var(--s100); padding: 8px 12px">
          <h6 class="mb-0" style="font-size: 12px; font-weight: 600">{{ pipelineModal.editStageIdx === null ? 'Tambah' : 'Edit' }} Stage</h6>
        </div>
        <div class="card-body" style="padding: 12px">
          <div class="row g-2">
            <div class="col-12 col-md-4">
              <label class="form-label" style="font-size: 11px; font-weight: 600">Status <span style="color: red">*</span></label>
              <input type="text" class="form-control form-control-sm" v-model="pipelineModal.editStageStatus" placeholder="backlog" style="font-size: 12px"/>
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label" style="font-size: 11px; font-weight: 600">Label <span style="color: red">*</span></label>
              <input type="text" class="form-control form-control-sm" v-model="pipelineModal.editStageLabel" placeholder="Backlog" style="font-size: 12px"/>
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label" style="font-size: 11px; font-weight: 600">On Fail Status</label>
              <select class="form-select form-select-sm" v-model="pipelineModal.editStageOnFailStatus" style="font-size: 12px">
                <option value="">-- Tidak ada recovery --</option>
                <option v-for="status in getAllStatuses()" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>
          </div>
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-primary btn-sm" @click="saveStage" style="font-size: 12px">{{ pipelineModal.editStageIdx === null ? 'Tambah' : 'Update' }}</button>
            <button class="btn btn-outline-secondary btn-sm" @click="closeStageEditor" style="font-size: 12px">Batal</button>
          </div>
          <div v-if="pipelineModal.err" class="alert alert-danger mt-2 py-2" style="font-size: 11px">{{ pipelineModal.err }}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex gap-2 pt-2" v-if="!pipelineModal.editStageIdx && pipelineModal.editStageIdx !== null || pipelineModal.editStageIdx === null">
        <button v-if="pipelineModal.editStageIdx === null || pipelineModal.editStageIdx < 0" class="btn btn-outline-primary btn-sm" @click="openStageEditor(null)" style="font-size: 12px">+ Tambah Stage</button>
      </div>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closePipelineModal">Batal</button>
        <button type="button" class="btn btn-primary" @click="savePipelineType">Simpan Pipeline</button>
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
  { key: 'formFields',          icon: '📝', title: 'Form Config',          desc: 'Atur field yang muncul di modal pengajuan berdasarkan kategori' },
  { key: 'requestPipelinesByType', icon: '🛤️', title: 'Pipeline Config',    desc: 'Konfigurasi pipeline per tipe request dengan on-fail flow' },
  { key: 'requestPipelines',    icon: '🏛️', title: 'Legacy Pipeline',      desc: 'Pipeline per role (hanya untuk backward compatibility)' },
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
  requestPipelines: {
    engineer: [],
    designer: [],
    illustrator: [],
    researcher: [],
  },
  requestPipelinesByType: {},
  formFields: {
    engineer: [],
    designer: [],
    illustrator: [],
    researcher: [],
  },
})

function syncFromStore() {
  const s = dmStore.settings
  local.requestTypes        = (s.requestTypes || []).map(t => ({ ...t }))
  local.priorities           = [...(s.priorities || [])]
  local.impactLevels         = [...(s.impactLevels || [])]
  local.stateRequirements    = [...(s.stateRequirements || [])]
  local.responsiveBehaviours = [...(s.responsiveBehaviours || [])]
  local.severityLevels       = [...(s.severityLevels || [])]
  local.requestPipelines     = {
    engineer: [...(s.requestPipelines?.engineer || [])],
    designer: [...(s.requestPipelines?.designer || [])],
    illustrator: [...(s.requestPipelines?.illustrator || [])],
    researcher: [...(s.requestPipelines?.researcher || [])],
  }
  local.requestPipelinesByType = JSON.parse(JSON.stringify(s.requestPipelinesByType || {}))
  local.formFields = JSON.parse(JSON.stringify(s.formFields || {
    engineer: [],
    designer: [],
    illustrator: [],
    researcher: [],
  }))
}

onMounted(syncFromStore)
watch(() => dmStore.settings, syncFromStore, { deep: true })

const currentItems = computed(() => local[activeKey.value] || [])
const itemCount = (key) => {
  if (key === 'requestPipelines') {
    return Object.keys(local.requestPipelines || {}).length
  }
  if (key === 'requestPipelinesByType') {
    return Object.keys(local.requestPipelinesByType || {}).length
  }
  return (local[key] || []).length
}

const pipelineRoles = [
  { key: 'engineer', label: 'Engineer' },
  { key: 'designer', label: 'Designer' },
  { key: 'illustrator', label: 'Illustrator' },
  { key: 'researcher', label: 'Researcher' },
]

function getPipelineText(role) {
  return (local.requestPipelines?.[role] || []).join(' -> ')
}

function updatePipelineText(role, value) {
  local.requestPipelines[role] = String(value || '')
    .split(/->|,/)
    .map(v => v.trim())
    .filter(Boolean)
}

async function savePipelines() {
  await persist()
}

// ── Modal state ──────────────────────────────────────────────────────────
const modal = reactive({ show: false, editIdx: null, label: '', value: '', category: '', err: '' })

// ── Pipeline Editor Modal state ──────────────────────────────────────────
const pipelineModal = reactive({
  show: false,
  editTypeKey: null,
  editTypeLabel: '',
  stages: [],
  editStageIdx: null,
  editStageStatus: '',
  editStageLabel: '',
  editStageOnFailStatus: '',
  err: '',
})

// ── Form Field Editor Modal state ────────────────────────────────────────
const formFieldModal = reactive({
  show: false,
  activeCategory: 'engineer',
  editIdx: null,
  f: {
    key: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: '', // can be array string or reference
    rows: 3,
  },
  err: ''
})

const fieldTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multi-select', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
]

function openFormFieldModal(category, idx = null) {
  formFieldModal.activeCategory = category
  formFieldModal.editIdx = idx
  formFieldModal.err = ''
  
  if (idx === null) {
    formFieldModal.f = { key: '', label: '', type: 'text', required: false, placeholder: '', options: '', rows: 3 }
  } else {
    const field = local.formFields[category][idx]
    formFieldModal.f = { 
      ...field, 
      options: Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')
    }
  }
  formFieldModal.show = true
}

function saveFormField() {
  const { key, label } = formFieldModal.f
  if (!key.trim() || !label.trim()) {
    formFieldModal.err = 'Key dan Label wajib diisi'
    return
  }
  
  const field = { ...formFieldModal.f }
  // Handle options: if it contains commas, turn into array, else keep as string (reference)
  if (typeof field.options === 'string' && field.options.includes(',')) {
    field.options = field.options.split(',').map(o => o.trim()).filter(Boolean)
  }
  
  if (formFieldModal.editIdx === null) {
    local.formFields[formFieldModal.activeCategory].push(field)
  } else {
    local.formFields[formFieldModal.activeCategory][formFieldModal.editIdx] = field
  }
  
  formFieldModal.show = false
  persist()
}

function deleteFormField(category, idx) {
  if (!confirm('Hapus field ini?')) return
  local.formFields[category].splice(idx, 1)
  persist()
}

function getAllStatuses() {
  const statuses = new Set()
  // From category defaults
  for (const stages of Object.values(dmStore.settings.requestPipelines || {})) {
    if (Array.isArray(stages)) stages.forEach(s => statuses.add(s))
  }
  // From existing per-type pipelines
  for (const stages of Object.values(local.requestPipelinesByType || {})) {
    if (Array.isArray(stages)) {
      stages.forEach(s => {
        if (typeof s === 'string') statuses.add(s)
        else if (s?.status) statuses.add(s.status)
      })
    }
  }
  return Array.from(statuses).sort()
}

function autoValue() {
  modal.value = modal.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function openPipelineModal(typeKey, typeLabel) {
  pipelineModal.editTypeKey = typeKey
  pipelineModal.editTypeLabel = typeLabel
  pipelineModal.stages = JSON.parse(JSON.stringify(local.requestPipelinesByType[typeKey] || []))
  pipelineModal.editStageIdx = null
  pipelineModal.editStageStatus = ''
  pipelineModal.editStageLabel = ''
  pipelineModal.editStageOnFailStatus = ''
  pipelineModal.err = ''
  pipelineModal.show = true
}

function closePipelineModal() {
  pipelineModal.show = false
  pipelineModal.editStageIdx = null
}

function openStageEditor(idx = null) {
  if (idx === null) {
    pipelineModal.editStageIdx = null
    pipelineModal.editStageStatus = ''
    pipelineModal.editStageLabel = ''
    pipelineModal.editStageOnFailStatus = ''
  } else {
    const stage = pipelineModal.stages[idx]
    pipelineModal.editStageIdx = idx
    pipelineModal.editStageStatus = stage.status || ''
    pipelineModal.editStageLabel = stage.label || ''
    pipelineModal.editStageOnFailStatus = stage.onFailStatus || ''
  }
  pipelineModal.err = ''
}

function closeStageEditor() {
  pipelineModal.editStageIdx = null
  pipelineModal.editStageStatus = ''
  pipelineModal.editStageLabel = ''
  pipelineModal.editStageOnFailStatus = ''
}

function saveStage() {
  if (!pipelineModal.editStageStatus.trim()) {
    pipelineModal.err = 'Status wajib diisi'
    return
  }
  if (!pipelineModal.editStageLabel.trim()) {
    pipelineModal.err = 'Label wajib diisi'
    return
  }
  
  const stage = {
    status: pipelineModal.editStageStatus.trim(),
    label: pipelineModal.editStageLabel.trim(),
    onFailStatus: pipelineModal.editStageOnFailStatus.trim(),
  }
  
  if (pipelineModal.editStageIdx === null) {
    pipelineModal.stages.push(stage)
  } else {
    pipelineModal.stages[pipelineModal.editStageIdx] = stage
  }
  
  closeStageEditor()
}

function deleteStage(idx) {
  pipelineModal.stages.splice(idx, 1)
}

function savePipelineType() {
  if (pipelineModal.stages.length === 0) {
    pipelineModal.err = 'Minimal ada 1 stage dalam pipeline'
    return
  }
  local.requestPipelinesByType[pipelineModal.editTypeKey] = pipelineModal.stages
  closePipelineModal()
  persist()
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
      requestPipelines:    {
        engineer: [...(local.requestPipelines.engineer || [])],
        designer: [...(local.requestPipelines.designer || [])],
        illustrator: [...(local.requestPipelines.illustrator || [])],
        researcher: [...(local.requestPipelines.researcher || [])],
      },
      requestPipelinesByType: JSON.parse(JSON.stringify(local.requestPipelinesByType)),
      formFields: JSON.parse(JSON.stringify(local.formFields)),
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
