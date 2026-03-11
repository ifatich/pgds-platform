<template>
  <div class="toast-wrap">
    <transition-group name="fade">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="{ err: t.type==='err', warn: t.type==='warn' }">
        {{ t.type==='err' ? '❌' : t.type==='warn' ? '⚠️' : '✅' }} {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/menu'
const ui = useUiStore()
</script>
