<template>
  <div class="dropdown" ref="dropdownContainer">
    <!-- Dropdown Button/Trigger -->
    <button
      class="btn btn-sm p-2 w-100 d-flex justify-content-between align-items-center"
      :class="buttonClass"
      type="button"
      @click="isOpen = !isOpen"
      :aria-expanded="isOpen"
      style="min-width: 10rem;"
    >
      <span>{{ selectedLabel || placeholder }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
        :class="{ 'chevron-open': isOpen }"
        class="chevron-icon"
      >
        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
      </svg>
    </button>
    
    <!-- Dropdown Menu -->
    <ul class="dropdown-menu" :class="{ show: isOpen }">
      <li v-if="showSearch" class="px-2 py-2">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="Search..."
          v-model="searchQuery"
          @click.stop
        />
      </li>
      <li v-if="showSearch && (isGrouped ? hasFilteredItems : filteredOptions.length > 0)" class="dropdown-divider"></li>
      
      <!-- Grouped options -->
      <template v-if="isGrouped">
        <template v-for="(group, groupIndex) in filteredGroups" :key="group.group">
          <li v-if="group.items.length > 0" class="dropdown-header px-3 py-2 fw-bold text-uppercase" style="font-size: 11px">
            {{ group.group }}
          </li>
          <li v-for="option in group.items" :key="option.value">
            <a
              class="dropdown-item ps-4"
              :class="{ active: modelValue === option.value }"
              href="#"
              @click.prevent="selectOption(option.value)"
            >
              {{ option.label }}
            </a>
          </li>
          <li v-if="groupIndex < filteredGroups.length - 1" class="dropdown-divider"></li>
        </template>
      </template>

      <!-- Flat options -->
      <template v-else>
        <li v-for="option in filteredOptions" :key="option.value">
          <a
            class="dropdown-item"
            :class="{ active: modelValue === option.value }"
            href="#"
            @click.prevent="selectOption(option.value)"
          >
            {{ option.label }}
          </a>
        </li>
      </template>
      
      <li v-if="(isGrouped ? !hasFilteredItems : filteredOptions.length === 0)" class="text-center text-muted px-2 py-2" style="font-size: 12px">
        No options found
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  variant: {
    type: String,
    default: 'outline-secondary'
  },
  showSearch: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const dropdownContainer = ref(null)
const isOpen = ref(false)
const searchQuery = ref('')

// Detect if options are grouped format
const isGrouped = computed(() => {
  return props.options.length > 0 && props.options[0].group && props.options[0].items
})

// Normalize flat options to { label, value } format
const normalizedOptions = computed(() => {
  if (isGrouped.value) return []
  return props.options.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt }
    }
    return opt
  })
})

// Flatten grouped options for search and label lookup
const flattenedOptions = computed(() => {
  if (!isGrouped.value) return normalizedOptions.value
  const flattened = []
  props.options.forEach(group => {
    flattened.push(...group.items)
  })
  return flattened
})

// Filter grouped options based on search
const filteredGroups = computed(() => {
  if (!isGrouped.value) return []
  if (!searchQuery.value) return props.options
  
  const query = searchQuery.value.toLowerCase()
  return props.options.map(group => ({
    group: group.group,
    items: group.items.filter(opt =>
      opt.label.toLowerCase().includes(query)
    )
  })).filter(group => group.items.length > 0)
})

// Check if there are filtered items
const hasFilteredItems = computed(() => {
  return filteredGroups.value.some(group => group.items.length > 0)
})

// Filter flat options based on search
const filteredOptions = computed(() => {
  if (searchQuery.value && !isGrouped.value) {
    const query = searchQuery.value.toLowerCase()
    return normalizedOptions.value.filter(opt =>
      opt.label.toLowerCase().includes(query)
    )
  }
  return normalizedOptions.value
})

// Get selected label (works for both grouped and flat)
const selectedLabel = computed(() => {
  const selected = flattenedOptions.value.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : ''
})

// Button class based on size and variant
const buttonClass = computed(() => {
  const sizeClass = {
    'sm': 'btn-sm',
    'md': '',
    'lg': 'btn-lg'
  }[props.size]
  
  return [`btn-${props.variant}`, sizeClass].filter(Boolean).join(' ')
})

// Handle option selection
function selectOption(value) {
  emit('update:modelValue', value)
  searchQuery.value = ''
  isOpen.value = false
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.chevron-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease-in-out;
}

.chevron-icon.chevron-open {
  transform: rotate(180deg);
}

.dropdown-header {
  color: #6c757d;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.5px;
  margin-top: 8px;
}

.dropdown-header:first-child {
  margin-top: 0;
}

.dropdown-menu {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  cursor: pointer;
  font-size: 13px;
}

.dropdown-item:hover {
  background-color: var(--bs-light);
}

.dropdown-item.active {
  background-color: var(--bs-primary);
  color: white;
}

.form-control-sm {
  font-size: 12px;
}
</style>
