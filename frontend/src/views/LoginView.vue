<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100" style="background-color: var(--navy)">
    <div class="card" style="width: 100%; max-width: 420px">
      <div class="card-body">
        <!-- Logo -->
        <div class="d-flex align-items-center gap-3 mb-5">
          <div class="sb-icon" style="width: 44px; height: 44px; font-size: 20px">P</div>
          <div>
            <div class="fw-bold" style="font-size: 17px; color: var(--navy)">Pegadaian DS</div>
            <div style="font-size: 12px; color: var(--s500)">Component Platform</div>
          </div>
        </div>

        <h2 style="font-size: 22px; margin-bottom: 6px">Selamat datang 👋</h2>
        <p class="text-secondary" style="font-size: 13px; margin-bottom: 28px">Masuk ke Design System Platform</p>

        <!-- Email Field -->
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            type="email"
            class="form-control"
            v-model="form.email"
            placeholder="email@pegadaian.co.id"
            @keyup.enter="submit"
          />
          <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
        </div>

        <!-- Password Field -->
        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            type="password"
            class="form-control"
            v-model="form.password"
            placeholder="••••••••"
            @keyup.enter="submit"
          />
          <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
        </div>

        <!-- General Error -->
        <div v-if="errors.general" class="alert alert-danger mb-3">
          ❌ {{ errors.general }}
        </div>

        <!-- Submit Button -->
        <button
          class="btn btn-primary w-100"
          @click="submit"
          :disabled="loading"
        >
          {{ loading ? 'Masuk...' : 'Masuk' }}
        </button>
      </div>
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
