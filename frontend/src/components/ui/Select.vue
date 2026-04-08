<template>
  <select
    v-bind="$attrs"
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
    class="form-select"
  >
    <slot />
  </select>
</template>

<script setup>
defineProps({
  modelValue: String,
})

defineEmits(['update:modelValue'])
</script>
