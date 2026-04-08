<template>
  <button
    type="button"
    class="btn-close"
    aria-label="Close"
    @click="$emit('close')"
  ></button>
</template>

<script setup>
defineEmits(['close'])
</script>
