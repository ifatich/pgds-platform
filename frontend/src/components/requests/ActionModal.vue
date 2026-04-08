<template>
  <div v-if="state" class="modal fade show d-block" tabindex="-1" role="dialog" style="background: rgba(11, 22, 40, 0.55);">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        
        <!-- Modal Header -->
        <div class="modal-header">
          <h1 class="modal-title fs-5">{{ state.act?.title || state.act?.label }}</h1>
          <button type="button" class="btn-close" aria-label="Close" @click="$emit('cancel')"></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          
          <!-- Actor name (auto dari user login) -->
          <div v-if="state.act.needsName" class="alert alert-info d-flex align-items-center gap-2 mb-3">
            <span>👤</span>
            <span class="fw-semibold">{{ auth.user?.name }}</span>
            <span class="ms-auto badge bg-success">{{ auth.role }}</span>
          </div>

          <!-- Component name (publish — optional rename) -->
          <div v-if="state.act.needsComponentName" class="mb-3">
            <label for="componentName" class="form-label">Nama Komponen</label>
            <input 
              id="componentName"
              v-model="form.componentName"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.componentName }"
              :placeholder="state.req?.componentName || 'Nama komponen...'"
            >
            <div v-if="errors.componentName" class="invalid-feedback d-block">
              {{ errors.componentName }}
            </div>
          </div>

          <!-- Library + Version side by side (publish) -->
          <div v-if="state.act.needsLibrary || state.act.needsVersion" class="row g-3 mb-3">
            
            <div v-if="state.act.needsLibrary" class="col-md-6">
              <label for="library" class="form-label">Library <span class="text-danger">*</span></label>
              <select 
                id="library"
                v-model="form.library"
                class="form-select"
                :class="{ 'is-invalid': errors.library }"
              >
                <option value="">Pilih Library</option>
                <option value="gwind">gwind</option>
                <option value="kitvue">kitvue</option>
                <option value="@pegadaian/kitvue">@pegadaian/kitvue</option>
                <option value="__custom__">+ Tambah nama library lain...</option>
              </select>
              <div v-if="errors.library" class="invalid-feedback d-block">
                {{ errors.library }}
              </div>
              
              <input
                v-if="form.library === '__custom__'"
                v-model="form.customLibrary"
                type="text"
                class="form-control mt-2"
                placeholder="Nama library baru..."
              />
            </div>

            <div v-if="state.act.needsVersion" class="col-md-6">
              <label for="version" class="form-label">Version <span class="text-danger">*</span></label>
              <input 
                id="version"
                v-model="form.version"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.version }"
                placeholder="e.g. 1.0.0 / 2.1.0"
              >
              <div v-if="errors.version" class="invalid-feedback d-block">
                {{ errors.version }}
              </div>
            </div>
          </div>

          <!-- Documentation link (publish) -->
          <div v-if="state.act.needsDocLink" class="mb-3">
            <label for="docLink" class="form-label">Link Dokumentasi</label>
            <input 
              id="docLink"
              v-model="form.docLink"
              type="url"
              class="form-control"
              placeholder="https://storybook.../docs, https://confluence..."
            >
          </div>

          <!-- Notes -->
          <div class="mb-3">
            <label for="notes" class="form-label">
              {{ state.act?.notesLabel || 'Notes' }}
              <span v-if="state.act?.notesRequired" class="text-danger">*</span>
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              class="form-control"
              :class="{ 'is-invalid': errors.notes }"
              :placeholder="state.act?.notesPlaceholder || 'Add notes...'"
              rows="3"
            ></textarea>
            <div v-if="errors.notes" class="invalid-feedback d-block">
              {{ errors.notes }}
            </div>
          </div>

          <!-- Code score -->
          <div v-if="state.act.needsScore" class="mb-3">
            <label for="score" class="form-label">Code Quality Score (0–10)</label>
            <input 
              id="score"
              v-model.number="form.score"
              type="number"
              class="form-control"
              min="0"
              max="10"
              placeholder="e.g. 8"
            >
          </div>

          <!-- Figma link -->
          <div v-if="state.act.needsFigma" class="mb-3">
            <label for="figmaLink" class="form-label">Figma Link <span class="text-danger">*</span></label>
            <input 
              id="figmaLink"
              v-model="form.figmaLink"
              type="url"
              class="form-control"
              :class="{ 'is-invalid': errors.figmaLink }"
              placeholder="https://figma.com/file/..."
            >
            <div v-if="errors.figmaLink" class="invalid-feedback d-block">
              {{ errors.figmaLink }}
            </div>
          </div>

          <!-- Preview link -->
          <div v-if="state.act.needsPreviewLink" class="mb-3">
            <label for="previewLink" class="form-label">Preview / Storybook / PR Link <span class="text-danger">*</span></label>
            <input 
              id="previewLink"
              v-model="form.previewLink"
              type="url"
              class="form-control"
              :class="{ 'is-invalid': errors.previewLink }"
              placeholder="https://..."
            >
            <div v-if="errors.previewLink" class="invalid-feedback d-block">
              {{ errors.previewLink }}
            </div>
          </div>

          <!-- Screenshot upload -->
          <div v-if="state.act.needsScreenshot" class="mb-3">
            <label for="screenshot" class="form-label">Screenshot Evidence <span class="text-danger">*</span></label>
            <div
              class="border border-2 border-dashed rounded p-4 text-center cursor-pointer"
              :class="form.screenshotName ? 'border-success bg-success-subtle' : 'border-secondary'"
              @click="fileInput.click()"
              @dragover.prevent
              @drop.prevent="handleDrop"
              style="transition: all 0.2s;"
            >
              <div v-if="form.screenshotDataUrl">
                <img
                  :src="form.screenshotDataUrl"
                  class="rounded img-thumbnail"
                  style="max-height: 100px; cursor: zoom-in"
                  @click.stop="showPreview = true"
                />
                <div class="small text-success mt-2 fw-semibold">{{ form.screenshotName }}</div>
              </div>
              <div v-else>
                <div style="font-size: 2rem">📸</div>
                <div class="small text-muted">Click or drag & drop screenshot</div>
              </div>
            </div>
            <input 
              ref="fileInput"
              id="screenshot"
              type="file"
              accept="image/*"
              class="d-none"
              @change="handleFile"
            />
            <div v-if="errors.screenshotName" class="invalid-feedback d-block mt-2">
              {{ errors.screenshotName }}
            </div>
          </div>

          <!-- Image preview overlay (fullscreen) -->
          <div 
            v-if="showPreview"
            class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-85 z-5 d-flex align-items-center justify-content-center"
            @click="showPreview = false"
            style="cursor: zoom-out; backdrop-filter: blur(2px);"
          >
            <img 
              :src="form.screenshotDataUrl"
              class="rounded"
              style="max-width: 90vw; max-height: 80vh; object-fit: contain;"
              @click.stop
            />
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
            Cancel
          </button>
          <button 
            type="button"
            class="btn"
            :class="state.act?.danger ? 'btn-danger' : 'btn-primary'"
            @click="confirm"
          >
            {{ state.act?.label }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props  = defineProps({ state: Object })
const emit   = defineEmits(['confirm','cancel'])
const auth   = useAuthStore()

const fileInput   = ref(null)
const showPreview = ref(false)

const form = reactive({
  notes: '', version: '', score: null,
  figmaLink: '', previewLink: '',
  screenshotName: '', screenshotDataUrl: '',
  library: '', customLibrary: '',
  componentName: '', docLink: '',
})

const errors = ref({})

function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) readFile(file)
  e.target.value = ''
}

function handleDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) readFile(file)
}

function readFile(file) {
  form.screenshotName = file.name
  const reader = new FileReader()
  reader.onload = (ev) => { form.screenshotDataUrl = ev.target.result }
  reader.readAsDataURL(file)
}

function confirm() {
  const act = props.state.act
  const errs = {}
  
  if (act.notesRequired && !form.notes) errs.notes = 'Notes required'
  if (act.needsVersion && !form.version) errs.version = 'Version required'
  if (act.needsLibrary) {
    const lib = form.library === '__custom__' ? form.customLibrary.trim() : form.library
    if (!lib) errs.library = 'Library wajib dipilih'
  }
  if (act.needsFigma && !form.figmaLink) errs.figmaLink = 'Figma link required'
  if (act.needsPreviewLink && !form.previewLink) errs.previewLink = 'Preview link required'
  if (act.needsScreenshot && !form.screenshotName) errs.screenshotName = 'Screenshot required'
  
  errors.value = errs
  if (Object.keys(errs).length) return

  emit('confirm', {
    action: act.action,
    notes: form.notes,
    version: form.version || undefined,
    score: form.score,
    componentName: act.needsComponentName && form.componentName.trim() ? form.componentName.trim() : undefined,
    library: act.needsLibrary ? (form.library === '__custom__' ? form.customLibrary.trim() : form.library) || undefined : undefined,
    docLink: act.needsDocLink && form.docLink.trim() ? form.docLink.trim() : undefined,
    figmaLink: form.figmaLink || undefined,
    previewLink: form.previewLink || undefined,
    screenshotName: form.screenshotName || undefined,
    screenshotDataUrl: form.screenshotDataUrl || undefined,
  })
}
</script>

<style scoped>
/* Modal overlay fix for showing the modal when parent is using bootstrap */
.modal.show {
  pointer-events: auto;
  z-index: 1050;
}
</style>
