<template>
  <div>
    <div class="mb">
      <div class="fr">
        <div class="fg"><label class="fl">Title <span class="req">*</span></label><input class="fi" v-model="f.title" placeholder="e.g. New DatePicker Component"><div class="fe" v-if="e.title">{{ e.title }}</div></div>
        <div class="fg"><label class="fl">Request Type <span class="req">*</span></label>
          <select class="fs" v-model="f.requestType">
            <option value="">Select type</option>
            <option v-for="t in REQ_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <div class="fe" v-if="e.requestType">{{ e.requestType }}</div>
        </div>
      </div>
      <div class="fr">
        <div class="fg"><label class="fl">Component Name <span class="req">*</span></label><input class="fi" v-model="f.componentName" placeholder="e.g. PgdDatePicker"><div class="fe" v-if="e.componentName">{{ e.componentName }}</div></div>
        <div class="fg"><label class="fl">Platform</label>
          <select class="fs" v-model="f.platform">
            <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>
      <div class="fg"><label class="fl">Component Description <span class="req">*</span></label><textarea class="ft" v-model="f.componentDescription" placeholder="Describe the component..."></textarea><div class="fe" v-if="e.componentDescription">{{ e.componentDescription }}</div></div>
      <div class="fg"><label class="fl">Use Case <span class="req">*</span></label><textarea class="ft" v-model="f.useCase" placeholder="Where and how will it be used..."></textarea><div class="fe" v-if="e.useCase">{{ e.useCase }}</div></div>
      <div class="fr">
        <div class="fg"><label class="fl">Priority</label>
          <select class="fs" v-model="f.priority">
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="fg"><label class="fl">Impact Level</label>
          <select class="fs" v-model="f.impactLevel">
            <option value="">Select</option>
            <option v-for="l in IMPACTS" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
      </div>
      <div class="fg"><label class="fl">Design Reference Link</label><input class="fi" v-model="f.designReferenceLink" placeholder="https://figma.com/..."><div class="fe" v-if="e.designReferenceLink">{{ e.designReferenceLink }}</div></div>
      <div class="fg">
        <label class="fl">State Requirements</label>
        <div class="multi-check">
          <div v-for="s in STATES" :key="s" class="mc-opt" :class="{ sel: f.stateRequirements.includes(s) }" @click="toggleState(s)">{{ s }}</div>
        </div>
      </div>
      <div class="fr">
        <div class="fg"><label class="fl">Responsive Behaviour</label>
          <select class="fs" v-model="f.responsiveBehaviour">
            <option v-for="r in RESP" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="fg" style="display:flex;align-items:center;gap:8px;padding-top:22px">
          <label class="ckl"><input type="checkbox" v-model="f.accessibilityRequirement"> Accessibility Requirement (WCAG)</label>
        </div>
      </div>
      <div class="fg"><label class="fl">Business Goal</label><textarea class="ft" style="min-height:60px" v-model="f.businessGoal" placeholder="What business objective does this serve?"></textarea></div>
      <div class="fg"><label class="fl">Additional Notes</label><textarea class="ft" style="min-height:60px" v-model="f.additionalNotes" placeholder="Any other context..."></textarea></div>
    </div>
    <div class="mf">
      <button class="btn btn-sec" @click="$emit('cancel')">Cancel</button>
      <button class="btn btn-primary" @click="submit">Submit Request</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataMasterStore } from '@/stores/dataMaster'

const emit = defineEmits(['submit','cancel'])
const dmStore = useDataMasterStore()

const REQ_TYPES = computed(() => dmStore.settings.requestTypes || [])
const PLATFORMS  = computed(() => dmStore.settings.platforms || ['Web'])
const PRIORITIES = computed(() => dmStore.settings.priorities || ['Medium'])
const IMPACTS    = computed(() => dmStore.settings.impactLevels || [])
const STATES     = computed(() => dmStore.settings.stateRequirements || [])
const RESP       = computed(() => dmStore.settings.responsiveBehaviours || ['Responsive'])

const f = ref({
  title:'', requestType:'', componentName:'', componentDescription:'', useCase:'',
  platform:'Web', priority:'Medium', impactLevel:'', designReferenceLink:'',
  stateRequirements:[], responsiveBehaviour:'Responsive', accessibilityRequirement:false,
  businessGoal:'', additionalNotes:'',
})
const e = ref({})

function toggleState(s) {
  const i = f.value.stateRequirements.indexOf(s)
  if (i >= 0) f.value.stateRequirements.splice(i, 1)
  else f.value.stateRequirements.push(s)
}

function submit() {
  const errs = {}
  if (!f.value.title) errs.title = 'Required'
  if (!f.value.requestType) errs.requestType = 'Required'
  if (!f.value.componentName) errs.componentName = 'Required'
  if (!f.value.componentDescription) errs.componentDescription = 'Required'
  if (!f.value.useCase) errs.useCase = 'Required'
  if (f.value.designReferenceLink && !/^https?:\/\//.test(f.value.designReferenceLink)) errs.designReferenceLink = 'Must be a valid URL'
  e.value = errs
  if (Object.keys(errs).length) return
  emit('submit', { ...f.value })
}
</script>
