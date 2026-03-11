<template>
  <div>
    <div class="sh">
      <div><h2>Component Library</h2><p>{{ doneComponents.length }} komponen dirilis</p></div>
      <button v-if="canEdit" class="btn btn-primary" @click="openModal(null)">+ Add Component</button>
    </div>

    <!-- Library stats -->
    <div class="ab-row" style="margin-bottom:18px">
      <div class="ab-box">
        <div class="ab-n" style="color:var(--purple,#7c3aed)">{{ doneComponents.length }}</div>
        <div class="ab-l">Total</div>
      </div>
      <div v-for="lib in libraryStats" :key="lib.name" class="ab-box">
        <div class="ab-n" style="color:var(--blue,#1d4ed8)">{{ lib.count }}</div>
        <div class="ab-l">{{ lib.name }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="fbar">
      <div class="search-wrap"><span class="s-ic">🔍</span><input class="fi" v-model="search" placeholder="Cari nama komponen..."></div>
      <select class="fs" style="width:150px" v-model="filterLibrary">
        <option value="">All Libraries</option>
        <option v-for="lib in availableLibraries" :key="lib" :value="lib">{{ lib }}</option>
      </select>
      <select class="fs" style="width:140px" v-model="filterLevel">
        <option value="">All Levels</option>
        <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
      </select>
    </div>

    <div v-if="compStore.loading" class="empty"><div class="ei">⏳</div><p>Loading...</p></div>
    <div v-else>
      <div class="card">
        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Komponen</th>
                <th>Level</th>
                <th>Library</th>
                <th>Versi Terakhir</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginated.length === 0">
                <td colspan="6"><div class="empty"><div class="ei">📦</div><p>Belum ada komponen yang dirilis</p></div></td>
              </tr>
              <tr v-for="c in paginated" :key="c.id">
                <td>
                  <div style="font-weight:600;font-size:13px">{{ c.name }}</div>
                  <div v-if="c.description" style="font-size:11px;color:var(--s400);margin-top:2px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.description }}</div>
                </td>
                <td>
                  <span v-if="c.atomicLevel" class="badge" :class="'b-'+c.atomicLevel">{{ c.atomicLevel }}</span>
                  <span v-else style="color:var(--s300)">—</span>
                </td>
                <td>
                  <span v-if="c.library" class="badge b-backlog" style="font-size:10.5px;font-family:'JetBrains Mono',monospace">{{ c.library }}</span>
                  <span v-else style="color:var(--s300)">—</span>
                </td>
                <td>
                  <span v-if="c.version" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--s700)">v{{ c.version }}</span>
                  <span v-else style="color:var(--s300)">—</span>
                </td>
                <td style="font-size:11.5px;color:var(--s500)">{{ formatDate(c.updatedAt) }}</td>
                <td>
                  <div style="display:flex;gap:4px;align-items:center">
                    <a v-if="c.docLink" :href="c.docLink" target="_blank" class="btn btn-ghost btn-icon btn-sm" title="Lihat Dokumentasi">📄</a>
                    <button v-if="canEdit" class="btn btn-ghost btn-icon btn-sm" @click="openModal(c)" title="Edit">✏️</button>
                    <button v-if="canEdit" class="btn btn-danger btn-icon btn-sm" @click="doDelete(c)" title="Hapus">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="pag">
        <span class="pg-info">{{ filtered.length }} total</span>
        <button class="pgb" :disabled="page<=1" @click="page--">‹</button>
        <button v-for="p in pageNums" :key="p" class="pgb" :class="{ active: p===page }" @click="page=p">{{ p }}</button>
        <button class="pgb" :disabled="page>=totalPages" @click="page++">›</button>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="overlay" @click.self="showModal = false">
          <div class="modal lg">
            <div class="mh"><h2>{{ editItem ? 'Edit Component' : 'Tambah Component' }}</h2><button class="btn btn-ghost btn-icon" @click="showModal = false">✕</button></div>
            <div class="mb">
              <div class="fr">
                <div class="fg"><label class="fl">Nama Komponen <span class="req">*</span></label><input class="fi" v-model="cf.name" @input="autoSlug"><div class="fe" v-if="ce.name">{{ ce.name }}</div></div>
                <div class="fg"><label class="fl">Slug <span class="req">*</span></label><input class="fi" v-model="cf.slug"><div class="fe" v-if="ce.slug">{{ ce.slug }}</div></div>
              </div>
              <div class="fr">
                <div class="fg">
                  <label class="fl">Atomic Level <span style="color:var(--s400);font-size:11px;font-weight:400">(opsional — kosongkan untuk variant)</span></label>
                  <select class="fs" v-model="cf.atomicLevel">
                    <option value="">— (variant / belum ditentukan)</option>
                    <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
                  </select>
                </div>
                <div class="fg">
                  <label class="fl">Library</label>
                  <select class="fs" v-model="cf.library">
                    <option value="">— (tanpa library)</option>
                    <option v-for="lib in LIBRARIES" :key="lib" :value="lib">{{ lib }}</option>
                    <option value="__custom__">+ Lainnya...</option>
                  </select>
                  <input v-if="cf.library === '__custom__'" class="fi" style="margin-top:8px" v-model="cf.customLibrary" placeholder="Nama library...">
                </div>
              </div>
              <div class="fr">
                <div class="fg"><label class="fl">Version</label><input class="fi" v-model="cf.version" placeholder="1.0.0"></div>
                <div class="fg"><label class="fl">Link Dokumentasi</label><input class="fi" v-model="cf.docLink" placeholder="https://storybook.../docs"></div>
              </div>
              <div class="fg"><label class="fl">Description</label><textarea class="ft" v-model="cf.description" placeholder="Deskripsi singkat komponen..."></textarea></div>
              <div class="fr">
                <div class="fg"><label class="fl">Figma URL</label><input class="fi" v-model="cf.figmaUrl" placeholder="https://figma.com/..."></div>
                <div class="fg"><label class="fl">Storybook URL</label><input class="fi" v-model="cf.storybookUrl" placeholder="https://storybook.io/..."></div>
              </div>
            </div>
            <div class="mf">
              <button class="btn btn-sec" @click="showModal = false">Cancel</button>
              <button class="btn btn-primary" @click="save">{{ editItem ? 'Simpan' : 'Tambah' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useComponentsStore } from '@/stores/components'
import { useUiStore } from '@/stores/menu'
import { formatDate, LIBRARIES } from '@/composables/useFormat'

const auth      = useAuthStore()
const compStore = useComponentsStore()
const ui        = useUiStore()

const LEVELS = ['atom','molecule','organism','template','page']

const search        = ref('')
const filterLevel   = ref('')
const filterLibrary = ref('')
const page          = ref(1)
const PAGE_SIZE     = 10
const showModal     = ref(false)
const editItem      = ref(null)
const cf = ref({ name:'', slug:'', atomicLevel:'', library:'', customLibrary:'', version:'', docLink:'', description:'', figmaUrl:'', storybookUrl:'' })
const ce = ref({})

const canEdit = computed(() => ['engineer','super_admin'].includes(auth.role))

const doneComponents = computed(() => compStore.items.filter(c => c.status === 'done' && c.isActive))

const filtered = computed(() => doneComponents.value.filter(c => {
  if (search.value && !c.name.toLowerCase().includes(search.value.toLowerCase())) return false
  if (filterLevel.value && c.atomicLevel !== filterLevel.value) return false
  if (filterLibrary.value && c.library !== filterLibrary.value) return false
  return true
}))

const availableLibraries = computed(() => {
  const fromData = doneComponents.value.map(c => c.library).filter(Boolean)
  return [...new Set([...LIBRARIES, ...fromData])].sort()
})

const libraryStats = computed(() => {
  const map = {}
  doneComponents.value.forEach(c => {
    const k = c.library || 'No Library'
    map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*PAGE_SIZE, page.value*PAGE_SIZE))
const pageNums   = computed(() => { const p = []; for (let i=Math.max(1,page.value-2); i<=Math.min(totalPages.value,page.value+2); i++) p.push(i); return p })

function openModal(c) {
  editItem.value = c; ce.value = {}
  const libVal = c ? (LIBRARIES.includes(c.library) ? c.library : c.library ? '__custom__' : '') : ''
  const customLib = c ? (LIBRARIES.includes(c.library) ? '' : c.library || '') : ''
  cf.value = c
    ? { name: c.name, slug: c.slug, atomicLevel: c.atomicLevel || '', library: libVal, customLibrary: customLib, version: c.version || '', docLink: c.docLink || '', description: c.description || '', figmaUrl: c.figmaUrl || '', storybookUrl: c.storybookUrl || '' }
    : { name:'', slug:'', atomicLevel:'', library:'', customLibrary:'', version:'', docLink:'', description:'', figmaUrl:'', storybookUrl:'' }
  showModal.value = true
}

function autoSlug() {
  if (!editItem.value) {
    cf.value.slug = cf.value.name
      .replace(/([A-Z])/g, (m,l,i) => i > 0 ? '-'+l.toLowerCase() : l.toLowerCase())
      .replace(/^-/, '').replace(/\s+/g, '-')
  }
}

async function save() {
  const errs = {}
  if (!cf.value.name) errs.name = 'Required'
  if (!cf.value.slug) errs.slug = 'Required'
  ce.value = errs
  if (Object.keys(errs).length) return
  const payload = {
    name: cf.value.name,
    slug: cf.value.slug,
    atomicLevel: cf.value.atomicLevel || null,
    library: (cf.value.library === '__custom__' ? cf.value.customLibrary.trim() : cf.value.library) || null,
    version: cf.value.version || null,
    docLink: cf.value.docLink || null,
    description: cf.value.description || null,
    figmaUrl: cf.value.figmaUrl || null,
    storybookUrl: cf.value.storybookUrl || null,
    status: 'done',
    tags: [],
  }
  try {
    if (editItem.value) { await compStore.update(editItem.value.id, payload); ui.showToast('Component updated') }
    else { await compStore.create(payload); ui.showToast('Component berhasil ditambahkan') }
    showModal.value = false
  } catch (e) { ui.showToast(e.message, 'err') }
}

async function doDelete(c) {
  if (!confirm('Hapus komponen "' + c.name + '"?')) return
  try { await compStore.remove(c.id); ui.showToast('Component deleted') }
  catch (e) { ui.showToast(e.message, 'err') }
}
</script>
