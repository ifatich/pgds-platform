<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div v-if="open" class="modal-backdrop fade show"></div>
  </Transition>

  <!-- Modal -->
  <Transition name="fade">
    <div
      v-if="open"
      :class="{ 'modal': true, 'show': open, 'd-block': open }"
      tabindex="-1"
      role="dialog"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['update:open'])
</script>
