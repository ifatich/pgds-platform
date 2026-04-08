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

    <!-- ═══ COMPONENT REQUEST FIELDS ═══ -->
    <template v-if="isComponentRequest">
      
      <div class="mb-3">
        <label for="componentName" class="form-label">Component Name <span class="text-danger">*</span></label>
        <input
          id="componentName"
          v-model="f.componentName"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': e.componentName }"
          placeholder="e.g. PgdDatePicker"
        >
        <div v-if="e.componentName" class="invalid-feedback d-block">{{ e.componentName }}</div>
      </div>

      <div class="mb-3">
        <label for="componentDescription" class="form-label">Component Description <span class="text-danger">*</span></label>
        <textarea
          id="componentDescription"
          v-model="f.componentDescription"
          class="form-control"
          :class="{ 'is-invalid': e.componentDescription }"
          placeholder="Describe the component..."
          rows="3"
        ></textarea>
        <div v-if="e.componentDescription" class="invalid-feedback d-block">{{ e.componentDescription }}</div>
      </div>

      <div class="mb-3">
        <label for="useCase" class="form-label">Use Case <span class="text-danger">*</span></label>
        <textarea
          id="useCase"
          v-model="f.useCase"
          class="form-control"
          :class="{ 'is-invalid': e.useCase }"
          placeholder="Where and how will it be used..."
          rows="3"
        ></textarea>
        <div v-if="e.useCase" class="invalid-feedback d-block">{{ e.useCase }}</div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label for="priority" class="form-label">Priority</label>
          <Dropdown
            id="priority"
            :model-value="f.priority"
            :options="PRIORITIES"
            placeholder="Select priority"
            @update:model-value="f.priority = $event"
          />
        </div>

        <div class="col-md-6">
          <label for="impactLevel" class="form-label">Impact Level</label>
          <Dropdown
            id="impactLevel"
            :model-value="f.impactLevel"
            :options="IMPACTS"
            placeholder="Select"
            @update:model-value="f.impactLevel = $event"
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="designReferenceLink" class="form-label">Design Reference Link</label>
        <input
          id="designReferenceLink"
          v-model="f.designReferenceLink"
          type="url"
          class="form-control"
          :class="{ 'is-invalid': e.designReferenceLink }"
          placeholder="https://figma.com/..."
        >
        <div v-if="e.designReferenceLink" class="invalid-feedback d-block">{{ e.designReferenceLink }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label">State Requirements</label>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="state in STATES"
            :key="state"
            type="button"
            class="btn btn-sm"
            :class="[
              f.stateRequirements.includes(state)
                ? 'btn-success'
                : 'btn-outline-secondary'
            ]"
            @click.prevent="toggleState(state)"
          >
            {{ state }}
          </button>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label for="responsiveBehaviour" class="form-label">Responsive Behaviour</label>
          <Dropdown
            id="responsiveBehaviour"
            :model-value="f.responsiveBehaviour"
            :options="RESP"
            placeholder="Select"
            @update:model-value="f.responsiveBehaviour = $event"
          />
        </div>

        <div class="col-md-6">
          <div class="form-check mt-4">
            <input
              id="accessibilityRequirement"
              v-model="f.accessibilityRequirement"
              type="checkbox"
              class="form-check-input"
            >
            <label for="accessibilityRequirement" class="form-check-label">
              Accessibility (WCAG)
            </label>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label for="businessGoal" class="form-label">Business Goal</label>
        <textarea
          id="businessGoal"
          v-model="f.businessGoal"
          class="form-control"
          placeholder="What business objective does this serve?"
          rows="3"
        ></textarea>
      </div>

      <div class="mb-4">
        <label for="additionalNotes" class="form-label">Additional Notes</label>
        <textarea
          id="additionalNotes"
          v-model="f.additionalNotes"
          class="form-control"
          placeholder="Any other context..."
          rows="3"
        ></textarea>
      </div>

    </template>

    <!-- ═══ RESEARCH REQUEST FIELDS ═══ -->
    <template v-if="isResearchRequest">
      
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label for="department" class="form-label">Department</label>
          <input
            id="department"
            v-model="f.department"
            type="text"
            class="form-control"
            placeholder="e.g. Product, Design"
          >
        </div>

        <div class="col-md-6">
          <label for="projectName" class="form-label">Project / Request Name <span class="text-danger">*</span></label>
          <input
            id="projectName"
            v-model="f.projectName"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': e.projectName }"
            placeholder="e.g. Dashboard Redesign"
          >
          <div v-if="e.projectName" class="invalid-feedback d-block">{{ e.projectName }}</div>
        </div>
      </div>

      <div class="mb-4">
        <label for="problemDescription" class="form-label">Problem / Need Description <span class="text-danger">*</span></label>
        <textarea
          id="problemDescription"
          v-model="f.problemDescription"
          class="form-control"
          :class="{ 'is-invalid': e.problemDescription }"
          placeholder="Please explain the problem or need..."
          rows="4"
        ></textarea>
        <div v-if="e.problemDescription" class="invalid-feedback d-block">{{ e.problemDescription }}</div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label for="timelineQuarter" class="form-label">Timeline (Quarter) <span class="text-danger">*</span></label>
          <Dropdown
            id="timelineQuarter"
            :model-value="f.timelineQuarter"
            :options="QUARTERS"
            placeholder="Select quarter..."
            @update:model-value="f.timelineQuarter = $event"
          />
          <div v-if="e.timelineQuarter" class="invalid-feedback d-block">{{ e.timelineQuarter }}</div>
        </div>

        <div v-if="requiresSeverityLevel" class="col-md-6">
          <label for="severityLevel" class="form-label">Severity Level <span class="text-danger">*</span></label>
          <Dropdown
            id="severityLevel"
            :model-value="f.severityLevel"
            :options="SEVERITY_LEVELS"
            placeholder="Select level..."
            @update:model-value="f.severityLevel = $event"
          />
          <div v-if="e.severityLevel" class="invalid-feedback d-block">{{ e.severityLevel }}</div>
        </div>
      </div>

      <div class="mb-4">
        <label for="attachment" class="form-label">Attachment (PDF, DOC, or Image)</label>
        <div
          class="border border-2 border-dashed rounded p-4 text-center cursor-pointer"
          :class="f.attachmentName ? 'border-success bg-success-subtle' : 'border-secondary'"
          @click="fileInputRef?.click()"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
          style="transition: all 0.2s;"
        >
          <div v-if="f.attachmentName" class="mb-3">
            <div class="small fw-medium text-dark">{{ f.attachmentName }}</div>
            <div class="small text-success">✓ File selected</div>
          </div>
          <div v-else>
            <div style="font-size: 2rem" class="mb-2">📎</div>
            <div class="small text-muted">Click or drag file here</div>
            <div class="small text-muted mt-1" style="opacity: 0.7">PDF, DOC, DOCX, TXT, JPG, PNG</div>
          </div>
        </div>
        <input
          ref="fileInputRef"
          id="attachment"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          class="d-none"
          @change="handleFileUpload"
        />
        <div v-if="e.attachmentName" class="invalid-feedback d-block mt-2">{{ e.attachmentName }}</div>
      </div>

    </template>

    <!-- Action Buttons -->
    <div class="d-flex gap-2 justify-content-end pt-4 border-top">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">
        Submit Request
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

// Flatten request types for dropdown
const flattenedReqTypes = computed(() => {
  return REQ_TYPES.value.map(t => ({
    value: t.value,
    label: t.label
  }))
})

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

// Component/Engineering request types
const isComponentRequest = computed(() => {
  return currentReqType.value.category === 'engineer'
})

// Design/Research service request types (designer, illustrator, researcher)
const isResearchRequest = computed(() => {
  return ['designer', 'illustrator', 'researcher'].includes(currentReqType.value.category)
})

// Designer types that require severity level: UI UX Enhancement, UI UX Audit
const requiresSeverityLevel = computed(() => {
  return ['research_ui_ux_enhancement', 'research_ui_ux_audit'].includes(f.value.requestType)
})

const f = ref({
  // Common
  title: '',
  requestType: '',
  // Component request fields
  componentName: '',
  componentDescription: '',
  useCase: '',
  priority: 'Medium',
  impactLevel: '',
  designReferenceLink: '',
  stateRequirements: [],
  responsiveBehaviour: 'Responsive',
  accessibilityRequirement: false,
  businessGoal: '',
  additionalNotes: '',
  // Research request fields
  department: '',
  projectName: '',
  problemDescription: '',
  timelineQuarter: '',
  severityLevel: '',
  attachmentName: '',
  attachmentDataUrl: '',
})
const e = ref({})

function onTypeChange() {
  e.value = {} // Clear errors when type changes
  f.value.severityLevel = '' // Reset severity level when type changes
}

function toggleState(s) {
  const i = f.value.stateRequirements.indexOf(s)
  if (i >= 0) f.value.stateRequirements.splice(i, 1)
  else f.value.stateRequirements.push(s)
}

function handleFileDrop(event) {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    f.value.attachmentName = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      f.value.attachmentDataUrl = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  f.value.attachmentName = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    f.value.attachmentDataUrl = e.target?.result
  }
  reader.readAsDataURL(file)
}

function submit() {
  const errs = {}
  if (!f.value.title) errs.title = 'Required'
  if (!f.value.requestType) errs.requestType = 'Required'
  
  // Component request validation
  if (isComponentRequest.value) {
    if (!f.value.componentName) errs.componentName = 'Required'
    if (!f.value.componentDescription) errs.componentDescription = 'Required'
    if (!f.value.useCase) errs.useCase = 'Required'
    if (f.value.designReferenceLink && !/^https?:\/\//.test(f.value.designReferenceLink)) errs.designReferenceLink = 'Must be a valid URL'
  }
  
  // Research request validation
  if (isResearchRequest.value) {
    if (!f.value.projectName) errs.projectName = 'Required'
    if (!f.value.problemDescription) errs.problemDescription = 'Required'
    if (!f.value.timelineQuarter) errs.timelineQuarter = 'Required'
    if (requiresSeverityLevel.value && !f.value.severityLevel) errs.severityLevel = 'Required'
  }
  
  e.value = errs
  if (Object.keys(errs).length) return
  emit('submit', { ...f.value })
}
</script>