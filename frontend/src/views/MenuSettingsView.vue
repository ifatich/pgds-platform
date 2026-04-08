<template>
  <div>
    <!-- Header -->
    <div class="row align-items-center mb-4">
      <div class="col">
        <h2 class="mb-1">Menu Settings</h2>
        <p class="text-secondary mb-0">Atur menu yang tampil untuk setiap role</p>
      </div>
      <div class="col-auto d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="doReset">↺ Reset Default</button>
        <button class="btn btn-primary btn-sm" @click="doSave" :disabled="saving">{{ saving ? 'Saving...' : '💾 Save Settings' }}</button>
      </div>
    </div>

    <!-- Role Settings Cards Grid -->
    <div class="row g-4 mb-4">
      <!-- Role columns -->
      <div v-for="role in ['designer','engineer','developer']" :key="role" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-header">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded p-2 d-flex align-items-center justify-content-center" style="width: 30px; height: 30px; font-size: 14px"
                :style="role==='designer'?'background:var(--purplel)':role==='engineer'?'background:var(--bluel)':'background:var(--orangel)'">
                {{ role==='designer'?'🎨':role==='engineer'?'⚙️':'💻' }}
              </div>
              <div style="flex: 1; min-width: 0">
                <h5 class="mb-1" style="font-size: 13px; font-weight: 700; text-transform: capitalize">{{ role }}</h5>
                <div style="font-size: 11px; color: var(--s400)">{{ activeCount(role) }} / {{ ALL_MENU_ITEMS.length }} menu aktif</div>
              </div>
            </div>
          </div>

          <div class="card-body p-2">
            <div v-for="item in ALL_MENU_ITEMS" :key="item.id"
              class="d-flex align-items-center gap-2 p-2 rounded mb-1" style="transition: background .1s"
              :style="isEnabled(role, item.id) ? 'background: var(--s100)' : 'opacity: .5'">
              <div style="color: var(--s300); font-size: 14px; flex-shrink: 0">⠿</div>
              <div class="rounded p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px; font-size: 12px; flex-shrink: 0"
                :style="isEnabled(role,item.id)?(role==='designer'?'background:var(--purplel);color:var(--purple)':role==='engineer'?'background:var(--bluel);color:var(--blue)':'background:var(--orangel);color:var(--orange)'):'background:var(--s100);color:var(--s400)'">
                {{ item.icon }}
              </div>
              <div style="flex: 1; min-width: 0">
                <div style="font-size: 12.5px; font-weight: 600; color: var(--navy)">{{ item.label }}</div>
                <div style="font-size: 10.5px; color: var(--s400)">{{ item.description }}</div>
              </div>
              <span v-if="item.required" class="badge bg-success" style="flex-shrink: 0; font-size: 9.5px">Wajib</span>
              <!-- Toggle (custom Bootstrap switch style) -->
              <div v-if="!item.required" @click="menuStore.toggleMenu(role, item.id)" 
                class="form-check form-switch ms-2" style="flex-shrink: 0">
                <input class="form-check-input" type="checkbox" :checked="isEnabled(role, item.id)" style="cursor: pointer">
              </div>
            </div>
          </div>

          <div class="card-footer bg-light d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" style="font-size: 11.5px" @click="menuStore.enableAll(role)">Aktifkan Semua</button>
            <button class="btn btn-sm btn-outline-danger" style="font-size: 11.5px" @click="menuStore.disableOptional(role)">Minimal</button>
          </div>
        </div>
      </div>

      <!-- Admin Disabled column -->
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-header">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded p-2 d-flex align-items-center justify-content-center" style="width: 30px; height: 30px; font-size: 14px; background: var(--gl)">
                ⚡
              </div>
              <div style="flex: 1; min-width: 0">
                <h5 class="mb-1" style="font-size: 13px; font-weight: 700">Admin</h5>
                <div style="font-size: 11px; color: var(--s400)">{{ disabledAdminCount }} menu di-disable</div>
              </div>
            </div>
          </div>

          <div class="card-body p-2">
            <div class="alert alert-warning p-2 mb-3" style="font-size: 11px; line-height: 1.5; margin-bottom: 10px">
              ⚠️ Menu yang di-disable akan tetap <b>tampil</b> di sidebar admin tapi tidak bisa diklik.
            </div>
            <div v-for="item in ALL_MENU_ITEMS" :key="item.id"
              class="d-flex align-items-center gap-2 p-2 rounded mb-1" style="transition: background .1s"
              :style="isAdminDisabled(item.id) ? 'background: #fff3cd' : 'background: var(--s100)'">
              <div class="rounded p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px; font-size: 12px; flex-shrink: 0"
                :style="isAdminDisabled(item.id) ? 'background: var(--orangel); color: var(--orange)' : 'background: var(--gl); color: var(--gd)'">
                {{ item.icon }}
              </div>
              <div style="flex: 1; min-width: 0">
                <div style="font-size: 12.5px; font-weight: 600; color: var(--navy)">{{ item.label }}</div>
                <div style="font-size: 10.5px" :style="isAdminDisabled(item.id) ? 'color: var(--orange)' : 'color: var(--s400)'">
                  {{ isAdminDisabled(item.id) ? 'Disabled untuk admin' : 'Aktif untuk admin' }}
                </div>
              </div>
              <!-- Disable toggle -->
              <div @click="menuStore.toggleAdminDisabled(item.id)" class="form-check form-switch ms-2" style="flex-shrink: 0">
                <input class="form-check-input" type="checkbox" :checked="isAdminDisabled(item.id)" style="cursor: pointer">
              </div>
            </div>
          </div>

          <div class="card-footer bg-light d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" style="font-size: 11.5px" @click="menuStore.enableAllAdmin()">Enable Semua</button>
            <button class="btn btn-sm btn-outline-warning" style="font-size: 11.5px" @click="menuStore.disableAllAdmin()">Disable Semua</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-start">
        <div>
          <h5 class="mb-1">Preview Sidebar per Role</h5>
          <span style="font-size: 11.5px; color: var(--s400)">Tampilan sidebar yang akan dilihat masing-masing role</span>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="row g-0" style="border-top: 1px solid var(--s200)">
          <div v-for="(role,ri) in ['designer','engineer','developer']" :key="role" class="col-12 col-md-4" :style="ri<2?'border-right:1px solid var(--s200)':''">
            <div class="p-3 bg-light" style="border-bottom: 1px solid var(--s200)">
              <span style="font-size: 11px; font-weight: 700; color: var(--s600); text-transform: uppercase; letter-spacing: 0.8px">{{ role }}</span>
            </div>
            <div v-for="item in ALL_MENU_ITEMS.filter(m => isEnabled(role, m.id))" :key="item.id" class="d-flex align-items-center gap-2 p-3" style="border-bottom: 1px solid var(--s100)">
              <span style="font-size: 13px">{{ item.icon }}</span>
              <span style="font-size: 12px; font-weight: 500; color: var(--s700)">{{ item.label }}</span>
            </div>
            <div v-if="!ALL_MENU_ITEMS.some(m => isEnabled(role, m.id))" class="p-3 text-muted" style="font-size: 12px">Tidak ada menu aktif</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMenuStore, ALL_MENU_ITEMS } from '@/stores/menu'
import { useUiStore } from '@/stores/menu'

const menuStore = useMenuStore()
const ui        = useUiStore()
const saving    = ref(false)

const isEnabled       = (role, id) => !!menuStore.settings[role]?.[id]
const activeCount     = (role) => ALL_MENU_ITEMS.filter(m => isEnabled(role, m.id)).length
const isAdminDisabled = (id) => menuStore.isAdminDisabled(id)
const disabledAdminCount = computed(() => ALL_MENU_ITEMS.filter(m => isAdminDisabled(m.id)).length)

async function doSave() {
  saving.value = true
  try { await menuStore.saveSettings(); ui.showToast('💾 Menu settings saved') }
  catch (e) { ui.showToast(e.message, 'err') }
  finally { saving.value = false }
}

function doReset() {
  menuStore.resetDefaults()
  ui.showToast('↺ Reset to defaults')
}
</script>
