<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import ToastContainer from '@/components/shared/ToastContainer.vue'

const auth = useAuthStore()
const menu = useMenuStore()

onMounted(async () => {
  await auth.fetchMe()
  await menu.fetchSettings()
})
</script>
