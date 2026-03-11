<template>
  <div>
    <div class="sh">
      <div><h2>Menu Settings</h2><p>Atur menu yang tampil untuk setiap role</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sec" @click="doReset">↺ Reset Default</button>
        <button class="btn btn-primary" @click="doSave" :disabled="saving">{{ saving ? 'Saving...' : '💾 Save Settings' }}</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      <!-- Role columns -->
      <div v-for="role in ['designer','engineer','developer']" :key="role" class="card">
        <div class="card-hd" style="padding:14px 18px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:30px;height:30px;border-radius:var(--r8);display:flex;align-items:center;justify-content:center;font-size:14px"
              :style="role==='designer'?'background:var(--purplel)':role==='engineer'?'background:var(--bluel)':'background:var(--orangel)'">
              {{ role==='designer'?'🎨':role==='engineer'?'⚙️':'💻' }}
            </div>
            <div>
              <h3 style="font-size:13px;font-weight:700;text-transform:capitalize">{{ role }}</h3>
              <div style="font-size:11px;color:var(--s400)">{{ activeCount(role) }} / {{ ALL_MENU_ITEMS.length }} menu aktif</div>
            </div>
          </div>
        </div>

        <div class="card-bd" style="padding:10px 16px">
          <div v-for="item in ALL_MENU_ITEMS" :key="item.id"
            style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--r8);margin-bottom:4px;transition:background .1s"
            :style="isEnabled(role, item.id) ? 'background:var(--s100)' : 'opacity:.5'">
            <div style="color:var(--s300);font-size:14px;flex-shrink:0">⠿</div>
            <div style="width:26px;height:26px;border-radius:var(--r8);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0"
              :style="isEnabled(role,item.id)?(role==='designer'?'background:var(--purplel);color:var(--purple)':role==='engineer'?'background:var(--bluel);color:var(--blue)':'background:var(--orangel);color:var(--orange)'):'background:var(--s100);color:var(--s400)'">
              {{ item.icon }}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600;color:var(--navy)">{{ item.label }}</div>
              <div style="font-size:10.5px;color:var(--s400)">{{ item.description }}</div>
            </div>
            <span v-if="item.required" style="font-size:9.5px;background:var(--gl);color:var(--gd);padding:2px 7px;border-radius:10px;font-weight:600;flex-shrink:0">Wajib</span>
            <!-- Toggle -->
            <div @click="!item.required && menuStore.toggleMenu(role, item.id)"
              style="width:36px;height:20px;border-radius:10px;position:relative;transition:background .2s;flex-shrink:0"
              :style="[isEnabled(role,item.id)?'background:var(--g)':'background:var(--s300)', item.required?'cursor:not-allowed':'cursor:pointer']">
              <div style="position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s"
                :style="isEnabled(role,item.id)?'left:18px':'left:2px'"></div>
            </div>
          </div>
        </div>

        <div style="padding:10px 16px;border-top:1px solid var(--s100);display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" style="font-size:11.5px" @click="menuStore.enableAll(role)">Aktifkan Semua</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11.5px;color:var(--red)" @click="menuStore.disableOptional(role)">Minimal</button>
        </div>
      </div>

      <!-- Admin Disabled column -->
      <div class="card">
        <div class="card-hd" style="padding:14px 18px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:30px;height:30px;border-radius:var(--r8);display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--gl)">
              ⚡
            </div>
            <div>
              <h3 style="font-size:13px;font-weight:700">Admin</h3>
              <div style="font-size:11px;color:var(--s400)">{{ disabledAdminCount }} menu di-disable</div>
            </div>
          </div>
        </div>
        <div class="card-bd" style="padding:10px 16px">
          <div style="font-size:11px;color:var(--s500);margin-bottom:10px;padding:8px 10px;background:var(--orangel);border-radius:var(--r8);line-height:1.5">
            ⚠️ Menu yang di-disable akan tetap <b>tampil</b> di sidebar admin tapi tidak bisa diklik.
          </div>
          <div v-for="item in ALL_MENU_ITEMS" :key="item.id"
            style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--r8);margin-bottom:4px;transition:background .1s"
            :style="isAdminDisabled(item.id) ? 'background:#fff3cd' : 'background:var(--s100)'">
            <div style="width:26px;height:26px;border-radius:var(--r8);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0"
              :style="isAdminDisabled(item.id) ? 'background:var(--orangel);color:var(--orange)' : 'background:var(--gl);color:var(--gd)'">
              {{ item.icon }}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600;color:var(--navy)">{{ item.label }}</div>
              <div style="font-size:10.5px" :style="isAdminDisabled(item.id) ? 'color:var(--orange)' : 'color:var(--s400)'">
                {{ isAdminDisabled(item.id) ? 'Disabled untuk admin' : 'Aktif untuk admin' }}
              </div>
            </div>
            <!-- Disable toggle -->
            <div @click="menuStore.toggleAdminDisabled(item.id)"
              style="width:36px;height:20px;border-radius:10px;position:relative;transition:background .2s;flex-shrink:0;cursor:pointer"
              :style="isAdminDisabled(item.id) ? 'background:var(--orange)' : 'background:var(--s300)'">
              <div style="position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s"
                :style="isAdminDisabled(item.id) ? 'left:18px' : 'left:2px'"></div>
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--s100);display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" style="font-size:11.5px" @click="menuStore.enableAllAdmin()">Enable Semua</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11.5px;color:var(--orange)" @click="menuStore.disableAllAdmin()">Disable Semua</button>
        </div>
      </div>
    </div>

    <!-- Preview -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd"><h3>Preview Sidebar per Role</h3><span style="font-size:11.5px;color:var(--s400)">Tampilan sidebar yang akan dilihat masing-masing role</span></div>
      <div class="card-bd" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;padding:0">
        <div v-for="(role,ri) in ['designer','engineer','developer']" :key="role" :style="ri<2?'border-right:1px solid var(--s100)':''">
          <div style="padding:8px 16px;background:var(--s100);border-bottom:1px solid var(--s200)">
            <span style="font-size:11px;font-weight:700;color:var(--s600);text-transform:uppercase;letter-spacing:.8px">{{ role }}</span>
          </div>
          <div v-for="item in ALL_MENU_ITEMS.filter(m => isEnabled(role, m.id))" :key="item.id"
            style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--s100)">
            <span style="font-size:13px">{{ item.icon }}</span>
            <span style="font-size:12px;font-weight:500;color:var(--s700)">{{ item.label }}</span>
          </div>
          <div v-if="!ALL_MENU_ITEMS.some(m => isEnabled(role, m.id))" style="padding:14px 16px;font-size:12px;color:var(--s400)">Tidak ada menu aktif</div>
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
