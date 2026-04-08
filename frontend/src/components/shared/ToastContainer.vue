<template>
  <div class="toast-wrap">
    <transition-group name="fade">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="{ err: t.type==='err', warn: t.type==='warn', success: t.type==='success' }">
        {{ t.type==='err' ? '❌' : t.type==='warn' ? '⚠️' : t.type==='success' ? '✅' : '✅' }} {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/menu'
const ui = useUiStore()
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  border-left: 4px solid #00A550;
  min-width: 280px;
  animation: toastSlide 0.3s ease-out;
  pointer-events: auto;
  color: #0B1628;
}

.toast.err {
  border-left-color: #EF4444;
}

.toast.warn {
  border-left-color: #F5A623;
}

.toast.success {
  border-left-color: #00A550;
}

@keyframes toastSlide {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(400px);
}
</style>
