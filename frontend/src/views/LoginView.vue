<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--navy)">
    <div style="background:#fff;border-radius:var(--r24);padding:40px;width:100%;max-width:420px;box-shadow:var(--sh3)">
      <!-- Logo -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px">
        <div class="sb-icon" style="width:44px;height:44px;font-size:20px">P</div>
        <div>
          <div style="font-weight:800;font-size:17px;color:var(--navy)">Pegadaian DS</div>
          <div style="font-size:12px;color:var(--s500)">Component Platform</div>
        </div>
      </div>

      <h2 style="font-size:22px;margin-bottom:6px">Selamat datang 👋</h2>
      <p style="color:var(--s500);font-size:13px;margin-bottom:28px">Masuk ke Design System Platform</p>

      <div class="fg">
        <label class="fl">Email</label>
        <input class="fi" type="email" v-model="form.email" placeholder="email@pegadaian.co.id" @keyup.enter="submit" />
        <div class="fe" v-if="errors.email">{{ errors.email }}</div>
      </div>
      <div class="fg">
        <label class="fl">Password</label>
        <input class="fi" type="password" v-model="form.password" placeholder="••••••••" @keyup.enter="submit" />
        <div class="fe" v-if="errors.password">{{ errors.password }}</div>
      </div>

      <div class="fe" v-if="errors.general" style="margin-bottom:14px;padding:10px 12px;background:var(--redl);border-radius:var(--r8)">
        ❌ {{ errors.general }}
      </div>

      <button class="btn btn-primary" style="width:100%;justify-content:center;padding:11px" @click="submit" :disabled="loading">
        {{ loading ? 'Masuk...' : 'Masuk' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const form   = ref({ email: '', password: '' })
const errors = ref({})
const loading= ref(false)

async function submit() {
  errors.value = {}
  if (!form.value.email)    { errors.value.email = 'Email wajib diisi'; return }
  if (!form.value.password) { errors.value.password = 'Password wajib diisi'; return }
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (e) {
    errors.value.general = e.message
  } finally {
    loading.value = false
  }
}
</script>
