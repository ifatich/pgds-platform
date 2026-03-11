<template>
  <Teleport to="body">
    <transition name="fade">
      <div class="overlay" @click.self="$emit('cancel')">
        <div class="modal">
          <div class="mh">
            <h2>{{ state.act.title || state.act.label }}</h2>
            <button class="btn btn-ghost btn-icon" @click="$emit('cancel')">✕</button>
          </div>
          <div class="mb">
            <!-- Actor name (auto dari user login) -->
            <div class="fg" v-if="state.act.needsName">
              <label class="fl">Nama</label>
              <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--s100);border:1px solid var(--s200);border-radius:var(--r8);font-size:13px;color:var(--s700);">
                <span style="font-size:15px">👤</span>
                <span style="font-weight:600">{{ auth.user?.name }}</span>
                <span class="badge" :class="'b-'+auth.role" style="font-size:10px;margin-left:auto">{{ auth.role }}</span>
              </div>
            </div>

            <!-- Component name (publish — optional rename) -->
            <div class="fg" v-if="state.act.needsComponentName">
              <label class="fl">Nama Komponen <span style="font-size:11px;color:var(--s400)">(opsional — kosongkan jika tidak ada perubahan nama)</span></label>
              <input class="fi" v-model="form.componentName" :placeholder="state.req?.componentName || 'Nama komponen...'">
            </div>

            <!-- Library + Version side by side (publish) -->
            <div class="fr" v-if="state.act.needsLibrary || state.act.needsVersion">
              <div class="fg" v-if="state.act.needsLibrary">
                <label class="fl">Library <span class="req">*</span></label>
                <select class="fs" v-model="form.library">
                  <option value="">Pilih Library</option>
                  <option v-for="lib in LIBRARIES" :key="lib" :value="lib">{{ lib }}</option>
                  <option value="__custom__">+ Tambah nama library lain...</option>
                </select>
                <input v-if="form.library === '__custom__'" class="fi" style="margin-top:8px" v-model="form.customLibrary" placeholder="Nama library baru...">
                <div class="fe" v-if="errors.library">{{ errors.library }}</div>
              </div>
              <div class="fg" v-if="state.act.needsVersion">
                <label class="fl">Version <span class="req">*</span></label>
                <input class="fi" v-model="form.version" placeholder="e.g. 1.0.0 / 2.1.0">
                <div class="fe" v-if="errors.version">{{ errors.version }}</div>
              </div>
            </div>

            <!-- Documentation link (publish) -->
            <div class="fg" v-if="state.act.needsDocLink">
              <label class="fl">Link Dokumentasi</label>
              <input class="fi" v-model="form.docLink" placeholder="https://storybook.../docs, https://confluence...">
            </div>

            <!-- Notes -->
            <div class="fg">
              <label class="fl">{{ state.act.notesLabel || 'Notes' }} <span class="req" v-if="state.act.notesRequired">*</span></label>
              <textarea class="ft" v-model="form.notes" :placeholder="state.act.notesPlaceholder || 'Add notes...'"></textarea>
              <div class="fe" v-if="errors.notes">{{ errors.notes }}</div>
            </div>

            <!-- Code score -->
            <div class="fg" v-if="state.act.needsScore">
              <label class="fl">Code Quality Score (0–10)</label>
              <input class="fi" type="number" min="0" max="10" v-model.number="form.score" placeholder="e.g. 8">
            </div>

            <!-- Figma link -->
            <div class="fg" v-if="state.act.needsFigma">
              <label class="fl">Figma Link <span class="req">*</span></label>
              <input class="fi" v-model="form.figmaLink" placeholder="https://figma.com/file/...">
              <div class="fe" v-if="errors.figmaLink">{{ errors.figmaLink }}</div>
            </div>

            <!-- Preview link -->
            <div class="fg" v-if="state.act.needsPreviewLink">
              <label class="fl">Preview / Storybook / PR Link <span class="req">*</span></label>
              <input class="fi" v-model="form.previewLink" placeholder="https://...">
              <div class="fe" v-if="errors.previewLink">{{ errors.previewLink }}</div>
            </div>

            <!-- Screenshot upload -->
            <div class="fg" v-if="state.act.needsScreenshot">
              <label class="fl">Screenshot Evidence <span class="req">*</span></label>
              <div
                style="border:2px dashed var(--s300);border-radius:var(--r8);padding:20px;text-align:center;cursor:pointer;transition:border-color .15s"
                :style="form.screenshotName ? 'border-color:var(--g);background:var(--gl)' : ''"
                @click="fileInput.click()"
                @dragover.prevent
                @drop.prevent="handleDrop">
                <div v-if="form.screenshotDataUrl">
                  <img :src="form.screenshotDataUrl" style="max-height:120px;border-radius:var(--r8);cursor:zoom-in" @click.stop="showPreview = true">
                  <div style="font-size:12px;color:var(--gd);margin-top:6px;font-weight:600">{{ form.screenshotName }}</div>
                </div>
                <div v-else>
                  <div style="font-size:24px;margin-bottom:6px">📸</div>
                  <div style="font-size:13px;color:var(--s500)">Click or drag & drop screenshot</div>
                </div>
              </div>
              <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleFile">
              <div class="fe" v-if="errors.screenshotName">{{ errors.screenshotName }}</div>
            </div>
          </div>
          <div class="mf">
            <button class="btn btn-sec" @click="$emit('cancel')">Cancel</button>
            <button class="btn" :class="state.act.danger ? 'btn-danger' : 'btn-primary'" @click="confirm">
              {{ state.act.label }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Image preview overlay -->
    <transition name="fade">
      <div v-if="showPreview" @click="showPreview=false" style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out">
        <img :src="form.screenshotDataUrl" style="max-width:90vw;max-height:80vh;border-radius:var(--r12)">
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { LIBRARIES } from '@/composables/useFormat'

const props  = defineProps({ state: Object })
const emit   = defineEmits(['confirm','cancel'])
const auth   = useAuthStore()

const fileInput  = ref(null)
const showPreview= ref(false)

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
