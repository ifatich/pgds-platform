<template>
  <form @submit.prevent="submit" class="p-4">
    
    <!-- Title & Request Type (common) -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="title" class="form-label">Title <span class="text-danger">*</span></label>
        <input
          id="title"
          v-model="f.title"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': e.title }"
          placeholder="e.g. New DatePicker or Design Audit"
        >
        <div v-if="e.title" class="invalid-feedback d-block">{{ e.title }}</div>
      </div>

      <div class="col-md-6">
        <label for="requestType" class="form-label">Request Type <span class="text-danger">*</span></label>
        <Dropdown
          id="requestType"
          :model-value="f.requestType"
          :options="groupedReqTypesForDropdown"
          placeholder="Select type"
          @update:model-value="(val) => { f.requestType = val; onTypeChange() }"
        />
        <div v-if="e.requestType" class="invalid-feedback d-block">{{ e.requestType }}</div>
      </div>
    </div>

    <!-- ═══ DYNAMIC FORM FIELDS (from Data Master) ═══ -->
    <template v-if="currentCategory && formFieldsForCategory.length > 0">
      <div v-for="field in formFieldsForCategory" :key="field.key">
        <!-- Skip title if it's already handled at the top -->
        <template v-if="field.key !== 'title'">
          <!-- Text Input -->
          <div v-if="field.type === 'text'" class="mb-3">
            <label :for="field.key" class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
            <input
              :id="field.key"
              v-model="f[field.key]"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': e[field.key] }"
              :placeholder="field.placeholder"
            >
            <div v-if="e[field.key]" class="invalid-feedback d-block">{{ e[field.key] }}</div>
          </div>

          <!-- Textarea -->
          <div v-else-if="field.type === 'textarea'" class="mb-3">
            <label :for="field.key" class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
            <textarea
              :id="field.key"
              v-model="f[field.key]"
              class="form-control"
              :class="{ 'is-invalid': e[field.key] }"
              :placeholder="field.placeholder"
              :rows="field.rows || 3"
            ></textarea>
            <div v-if="e[field.key]" class="invalid-feedback d-block">{{ e[field.key] }}</div>
          </div>

          <!-- URL Input -->
          <div v-else-if="field.type === 'url'" class="mb-3">
            <label :for="field.key" class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
            <input
              :id="field.key"
              v-model="f[field.key]"
              type="url"
              class="form-control"
              :class="{ 'is-invalid': e[field.key] }"
              :placeholder="field.placeholder"
            >
            <div v-if="e[field.key]" class="invalid-feedback d-block">{{ e[field.key] }}</div>
          </div>

          <!-- Date Input -->
          <div v-else-if="field.type === 'date'" class="mb-3">
            <label :for="field.key" class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
            <input
              :id="field.key"
              v-model="f[field.key]"
              type="date"
              class="form-control"
              :class="{ 'is-invalid': e[field.key] }"
            >
            <div v-if="e[field.key]" class="invalid-feedback d-block">{{ e[field.key] }}</div>
          </div>

          <!-- Dropdown -->
          <div v-else-if="field.type === 'dropdown'" class="mb-3">
            <label :for="field.key" class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
            <Dropdown
              :id="field.key"
              :model-value="f[field.key]"
              :options="getFieldOptions(field)"
              :placeholder="'Select ' + field.label.toLowerCase()"
              @update:model-value="f[field.key] = $event"
            />
            <div v-if="e[field.key]" class="invalid-feedback d-block">{{ e[field.key] }}</div>
          </div>

          <!-- Multi-Select (buttons) -->
          <div v-else-if="field.type === 'multi-select'" class="mb-3">
            <label class="form-label">{{ field.label }}</label>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-for="option in getFieldOptions(field)"
                :key="option"
                type="button"
                class="btn btn-sm"
                :class="[
                  (f[field.key] || []).includes(option)
                    ? 'btn-success'
                    : 'btn-outline-secondary'
                ]"
                @click.prevent="toggleMultiSelect(field.key, option)"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <!-- Checkbox -->
          <div v-else-if="field.type === 'checkbox'" class="mb-3">
            <div class="form-check">
              <input
                :id="field.key"
                v-model="f[field.key]"
                type="checkbox"
                class="form-check-input"
              >
              <label :for="field.key" class="form-check-label">
                {{ field.label }}
              </label>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Empty State for unknown category -->
    <div v-else-if="f.requestType" class="alert alert-info py-4 text-center">
      <div class="mb-2">📋</div>
      <div class="small fw-bold">Select a request type to see the form fields.</div>
      <div class="small text-muted">Fields are dynamically loaded based on the chosen category.</div>
    </div>

    <!-- Action Buttons -->
    <div class="d-flex gap-2 justify-content-end pt-4 border-top">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')" :disabled="isSubmitting">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataMasterStore } from '@/stores/dataMaster'
import { Dropdown } from '@/components/ui'

const emit = defineEmits(['submit','cancel'])
const dmStore = useDataMasterStore()
const fileInputRef = ref(null)

const REQ_TYPES = computed(() => dmStore.settings.requestTypes || [])
const PRIORITIES = computed(() => dmStore.settings.priorities || ['Medium'])
const IMPACTS    = computed(() => dmStore.settings.impactLevels || [])
const STATES     = computed(() => dmStore.settings.stateRequirements || [])
const RESP       = computed(() => dmStore.settings.responsiveBehaviours || ['Responsive'])
const QUARTERS   = computed(() => ['Q1', 'Q2', 'Q3', 'Q4'])
const SEVERITY_LEVELS = computed(() => dmStore.settings.severityLevels || ['Minor', 'Medium', 'Major'])
const FORM_FIELDS = computed(() => dmStore.settings.formFields || {})

// Group request types by category
const groupedReqTypes = computed(() => {
  const categoryMap = {
    engineer: '⚙️ Engineer',
    designer: '🎨 Designer',
    illustrator: '🎭 Illustrator',
    researcher: '🔬 Researcher',
  }
  const groups = {}
  REQ_TYPES.value.forEach(type => {
    const catKey = type.category || 'other'
    if (!groups[catKey]) {
      groups[catKey] = {
        category: categoryMap[catKey] || catKey,
        items: []
      }
    }
    groups[catKey].items.push(type)
  })
  return Object.values(groups)
})

// Format grouped types for Dropdown component
const groupedReqTypesForDropdown = computed(() => {
  return groupedReqTypes.value.map(group => ({
    group: group.category,
    items: group.items.map(t => ({
      value: t.value,
      label: t.label
    }))
  }))
})

// Get current request type object
const currentReqType = computed(() => {
  return REQ_TYPES.value.find(t => t.value === f.value.requestType) || {}
})

// Get current category from the selected request type
const currentCategory = computed(() => {
  return currentReqType.value.category || null
})

// Get form fields for current category from Data Master
const formFieldsForCategory = computed(() => {
  if (!currentCategory.value || !FORM_FIELDS.value[currentCategory.value]) {
    return []
  }
  return FORM_FIELDS.value[currentCategory.value]
})

const isKnownRequestType = computed(() => {
  if (!f.value.requestType) return true
  return REQ_TYPES.value.some(t => t.value === f.value.requestType)
})

// Component/Engineering request types
const isComponentRequest = computed(() => {
  return currentReqType.value.category === 'engineer'
})

// Design/Research service request types (designer, illustrator, researcher)
const isResearchRequest = computed(() => {
  return ['designer', 'illustrator', 'researcher'].includes(currentReqType.value.category)
})

const f = ref({
  // Common
  title: '',
  requestType: '',
  // Specific fields will be added dynamically to this object via v-model
})
const e = ref({})
const isSubmitting = ref(false)

function onTypeChange() {
  e.value = {} // Clear errors when type changes
}

// Helper: Get options for a dropdown/multi-select field from Data Master
function getFieldOptions(field) {
  if (Array.isArray(field.options)) {
    return field.options
  }
  if (typeof field.options === 'string') {
    // Reference to a Data Master list (e.g., 'priorities' -> dmStore.settings.priorities)
    return dmStore.settings[field.options] || []
  }
  return []
}

// Helper: Toggle multi-select value
function toggleMultiSelect(fieldKey, option) {
  const arr = f.value[fieldKey] || []
  const idx = arr.indexOf(option)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(option)
  }
  f.value[fieldKey] = [...arr] // Trigger reactivity
}

function submit() {
  const errs = {}
  if (!f.value.title) errs.title = 'Required'
  if (!f.value.requestType) errs.requestType = 'Required'
  if (!isKnownRequestType.value) errs.requestType = 'Invalid request type, please reselect'
  
  // Validate dynamic fields if they exist
  formFieldsForCategory.value.forEach(field => {
    if (field.required && !f.value[field.key]) {
      errs[field.key] = 'Required'
    }
    // URL validation
    if (field.type === 'url' && f.value[field.key] && !/^https?:\/\//.test(f.value[field.key])) {
      errs[field.key] = 'Must be a valid URL'
    }
  })
  
  e.value = errs
  if (Object.keys(errs).length) {
    console.log('❌ Form validation errors:', errs)
    isSubmitting.value = false
    return
  }
  
  console.log('✅ Form validation passed, emitting submit event')
  emit('submit', { ...f.value })
}

function resetForm() {
  f.value = {
    title: '',
    requestType: '',
  }
  e.value = {}
  isSubmitting.value = false
  console.log('🔄 Form resetted')
}

// Expose resetForm for parent component
defineExpose({ resetForm })
</script>