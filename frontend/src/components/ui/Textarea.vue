<template>
  <textarea
    v-bind="$attrs"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="form-control"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
})

defineEmits(['update:modelValue'])
</script>
