<template>
  <div class="mb-3">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <slot />
    <div v-if="error" class="invalid-feedback d-block">{{ error }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String },
  error: { type: String },
  required: { type: Boolean, default: false },
})
</script>
