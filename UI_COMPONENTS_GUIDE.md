# ✅ UI Components Implementation Guide

## Project Status: 60% Complete

### What's Done ✅

1. **10 Reusable UI Components** in `/src/components/ui/`
   - StatCard, StatGrid, PageHeader, FilterBar, EmptyState
   - FormField, Button, DataTable, Badge, Modal

2. **3 Views Refactored** to use new components
   - ✅ DashboardView - Using StatGrid
   - ✅ UsersView - Using PageHeader + StatGrid  
   - ✅ ComponentsView - Using PageHeader + StatGrid

3. **Mobile Sidenav** implemented
   - Toggle button (☰ Menu) in topbar
   - Slide-out animation on mobile
   - Auto-close after navigation
   - Overlay backdrop

4. **Build Status**: ✅ 0 errors, 1.44s compile time

---

## How to Use Components in Views

### Quick Pattern Examples

#### 1️⃣ StatGrid (KPI Cards)
```vue
<template>
  <StatGrid :stats="stats" :columns="4" />
</template>

<script setup>
import { computed } from 'vue'
import { StatGrid } from '@/components/ui'

const stats = computed(() => [
  { id: '1', icon: '✅', value: 24, label: 'Published', color: 'var(--g)' },
  { id: '2', icon: '🔄', value: 12, label: 'Active', color: 'var(--blue)' },
  // ... more stats
])
</script>
```

#### 2️⃣ PageHeader (Title + Action)
```vue
<PageHeader
  title="Component Library"
  subtitle="50 components"
  actionLabel="+ New"
  @action="openModal"
/>
```

#### 3️⃣ FilterBar (Search + Filters)
```vue
<FilterBar
  v-model="search"
  :filters="[
    {
      key: 'status',
      placeholder: 'All Status',
      value: status,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'done', label: 'Done' },
      ],
      width: '150px'
    }
  ]"
  @update:modelValue="search = $event"
  @update:filter="({ key, value }) => status = value"
/>
```

#### 4️⃣ DataTable (Responsive Table)
```vue
<DataTable
  :columns="[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', width: '100px' },
  ]"
  :items="users"
>
  <template #cell-role="{ item }">
    <Badge :label="item.role" :badgeClass="item.role" />
  </template>
</DataTable>
```

#### 5️⃣ Modal (Form Dialog)
```vue
<Modal
  v-model="showModal"
  title="Create User"
  @confirm="save"
>
  <FormField
    id="name"
    label="Name"
    v-model="form.name"
    :error="errors.name"
    required
  />
</Modal>
```

---

## Remaining Views to Refactor

### Priority 1 (Easy Wins - Similar structure to DashboardView)
- **RequestsView.vue** - Add PageHeader + StatGrid for status counts
- **ResearchRequestsView.vue** - Similar pattern as RequestsView

### Priority 2 (Medium - Requires FilterBar)
- **MyTasksView.vue** - Add PageHeader + FilterBar
- **AuditView.vue** - Add PageHeader + FilterBar

### Priority 3 (Complex - Custom layouts)
- **MenuSettingsView.vue** - Consider DataTable for role settings
- **DataMasterView.vue** - Already using DataTable-like layout

---

## Mobile Sidenav Implementation Reference

### AppShell.vue Changes Made:
```vue
<!-- Template changes -->
<nav class="sidebar" :class="{ show: sidebarOpen }">
  <!-- Added close button for mobile -->
  <div class="d-lg-none d-flex justify-content-end p-2">
    <button @click="toggleSidebar">✕</button>
  </div>
</nav>

<!-- Mobile toggle button in topbar -->
<button class="btn btn-ghost btn-sm d-lg-none" @click="toggleSidebar">
  ☰ Menu
</button>

<!-- Mobile overlay backdrop -->
<div v-if="sidebarOpen" @click="sidebarOpen = false" 
  class="d-lg-none" style="position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 999">
</div>

<!-- Script changes -->
<script setup>
import { ref } from 'vue'

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function navigate(viewName) {
  sidebarOpen.value = false // Close after nav
  router.push({ name: nameMap[viewName] || viewName })
}
</script>
```

### CSS (Already in main.css):
```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -248px;
    transition: left 0.3s;
    z-index: 1000;
  }

  .sidebar.show {
    left: 0;
  }
}
```

---

## Import Shortcuts

```js
// Recommended import style
import { StatGrid, PageHeader, FilterBar, DataTable, Badge, Modal } from '@/components/ui'

// Available named exports in index.js:
// StatCard, StatGrid, PageHeader, FilterBar, EmptyState
// FormField, Button, DataTable, Badge, Modal
```

---

## Testing Checklist

- [x] Build with 0 errors
- [x] DashboardView responsive KPI cards
- [x] UsersView PageHeader + stats
- [x] ComponentsView PageHeader + stats  
- [x] Mobile sidenav toggle works
- [x] Sidebar closes after navigation
- [x] All file sizes optimized
- [ ] Remaining views use consistent patterns

---

## Notes for Next Session

1. **Priority**: Refactor RequestsView first (similar to DashboardView)
2. **Pattern**: Always use PageHeader + (StatGrid OR FilterBar) combo
3. **Performance**: Components use proper key props for loops
4. **Mobile**: Test sidebar on actual phone/tablet
5. **Accessibility**: Ensure all interactive elements have proper aria labels

---

Generated: 9 April 2026
Next target: 100% component adoption in all views
