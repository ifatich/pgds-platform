<template>
  <button
    :type="type"
    :class="buttonClasses"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => [
      'primary', 'secondary', 'success', 'danger',
      'warning', 'info', 'light', 'dark', 'link',
      'outline-primary', 'outline-secondary'
    ].includes(value),
  },
  type: { type: String, default: 'button' },
  size: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const buttonClasses = computed(() => {
  const classes = ['btn', `btn-${props.variant}`]
  if (props.size) classes.push(`btn-${props.size}`)
  return classes
})
</script>
