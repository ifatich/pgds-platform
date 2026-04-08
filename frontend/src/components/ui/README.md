# UI Components Bank

Kumpulan komponen reusable untuk memastikan konsistensi UI di seluruh aplikasi.

## Komponen Tersedia

### 1. StatCard
Kartu statistik dengan icon, value, label, dan opsional badge.

```vue
<StatCard
  icon="✅"
  value="24"
  label="Published Components"
  color="var(--g)"
  badge="All time"
  badgeType="success"
/>
```

**Props:**
- `icon` (String, required): Emoji atau icon
- `value` (String/Number, required): Nilai yang ditampilkan
- `label` (String, required): Label deskripsi
- `color` (String, default: 'var(--g)'): Warna nilai
- `badge` (String, default: null): Badge text
- `badgeType` (String, default: 'primary'): Bootstrap badge class

---

### 2. StatGrid
Grid untuk menampilkan multiple StatCard dengan responsive layout.

```vue
<StatGrid
  :stats="[
    { id: 1, icon: '✅', value: 24, label: 'Published', color: 'var(--g)' },
    { id: 2, icon: '🔄', value: 12, label: 'Active', color: 'var(--blue)' },
  ]"
  :columns="4"
/>
```

**Props:**
- `stats` (Array, required): Array of stat objects
- `columns` (Number, default: 4): Jumlah kolom (2, 3, 4, 6)
- `marginBottom` (String, default: '24px')

---

### 3. PageHeader
Header halaman dengan title, subtitle, dan action button.

```vue
<PageHeader
  title="User Management"
  subtitle="50 registered users"
  actionLabel="+ New User"
  actionIcon=""
  @action="handleAddUser"
/>
```

**Props:**
- `title` (String, required): Judul halaman
- `subtitle` (String): Subtitle/deskripsi
- `actionLabel` (String): Label tombol action
- `actionIcon` (String): Icon untuk tombol
- `actionClass` (String, default: 'btn-primary'): Class tombol
- `showAction` (Boolean, default: true)

**Slots:**
- `actions`: Custom actions area

---

### 4. FilterBar
Bar filter dengan search input dan multiple select dropdowns.

```vue
<FilterBar
  v-model="search"
  showSearch
  searchPlaceholder="Search users..."
  :filters="[
    {
      key: 'role',
      placeholder: 'All Roles',
      value: filterRole,
      options: [
        { value: 'designer', label: 'Designer' },
        { value: 'engineer', label: 'Engineer' },
      ],
      width: '130px'
    }
  ]"
  @update:modelValue="search = $event"
  @update:filter="handleFilterChange"
/>
```

**Props:**
- `modelValue` (String): Search text value
- `showSearch` (Boolean, default: true)
- `searchPlaceholder` (String): Placeholder teks search
- `filters` (Array): Array filter objects

---

### 5. EmptyState
Tampilan saat data kosong dengan icon dan message.

```vue
<EmptyState
  icon="📋"
  message="Belum ada data"
  padding="40px 20px"
/>
```

**Props:**
- `icon` (String, required): Emoji/icon
- `message` (String, required): Pesan kosong
- `padding` (String, default: '60px 20px')
- `iconSize` (String, default: '48px')
- `textSize` (String, default: '14px')
- `textColor` (String, default: 'var(--s700)')

---

### 6. FormField
Input form reusable dengan label, validation, dan hint.

```vue
<FormField
  id="username"
  type="text"
  label="Username"
  v-model="form.username"
  placeholder="Enter username"
  :error="errors.username"
  hint="Username harus 3-20 karakter"
  required
/>
```

**Props:**
- `id` (String, required): HTML id
- `type` (String, default: 'text'): text, email, password, textarea, select
- `label` (String): Label field
- `modelValue` (String/Number): Value
- `placeholder` (String)
- `error` (String): Error message
- `hint` (String): Hint text
- `required` (Boolean)
- `options` (Array): For select type

---

### 7. Button
Tombol reusable dengan berbagai varian dan ukuran.

```vue
<Button
  label="Save"
  type="submit"
  variant="primary"
  size="md"
  icon="💾"
  :loading="isSaving"
  @click="handleSave"
/>
```

**Props:**
- `label` (String, required)
- `type` (String, default: 'button'): button, submit, reset
- `variant` (String, default: 'primary'): primary, secondary, success, danger, outline-*, etc.
- `size` (String, default: 'md'): sm, md, lg
- `icon` (String): Icon emoji
- `disabled` (Boolean)
- `loading` (Boolean)

---

### 8. DataTable
Table wrapper dengan responsive layout dan empty state.

```vue
<DataTable
  :columns="[
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', width: '100px' },
  ]"
  :items="users"
>
  <template #cell-name="{ item }">
    <div class="fw-bold">{{ item.name }}</div>
  </template>
  <template #empty>
    <EmptyState icon="👥" message="No users found" />
  </template>
</DataTable>
```

**Props:**
- `columns` (Array, required): Array of { key, label, width? }
- `items` (Array, required): Data rows

**Slots:**
- `cell-{key}`: Custom cell rendering
- `empty`: Custom empty state

---

### 9. Badge
Badge component dengan custom styling dan status classes.

```vue
<Badge
  label="Pending"
  badgeClass="pending"
/>
```

**Props:**
- `label` (String, required)
- `badgeClass` (String, required): CSS class suffix
- `customStyle` (Object): Custom inline styles

---

### 10. Modal
Modal reusable dengan header, body, footer.

```vue
<Modal
  v-model="showModal"
  title="Create User"
  centered
  @confirm="handleConfirm"
>
  <FormField
    id="name"
    label="Name"
    v-model="form.name"
    required
  />
</Modal>
```

**Props:**
- `modelValue` (Boolean, required): Modal open/close
- `title` (String, required)
- `showFooter` (Boolean, default: true)
- `centered` (Boolean, default: true)
- `maxWidth` (String, default: '500px')
- `cancelLabel` (String, default: 'Cancel')
- `confirmLabel` (String, default: 'Confirm')

**Slots:**
- default: Modal body
- footer: Custom footer

---

## Import Usage

### Named Import
```js
import { StatCard, PageHeader, FilterBar } from '@/components/ui'
```

### Individual Import
```js
import StatCard from '@/components/ui/StatCard.vue'
```

## Best Practices

1. Gunakan komponen UI ini untuk memastikan konsistensi
2. Props yang tidak diperlukan bisa di-custom per use case
3. Gunakan slot untuk kustomisasi konten lebih kompleks
4. Selalu set `key` untuk loop items di parent component
5. Jangan ubah internal styling komponen UI kecuali urgent

---

## Contoh Penggunaan di View

```vue
<template>
  <div>
    <PageHeader
      title="Dashboard"
      subtitle="Welcome back"
      actionLabel="+ Add"
      @action="openModal"
    />

    <StatGrid :stats="stats" :columns="4" />

    <FilterBar
      v-model="search"
      :filters="filterOptions"
      @update:filter="handleFilter"
    />

    <DataTable :columns="tableColumns" :items="data">
      <template #cell-status="{ item }">
        <Badge :label="item.status" :badgeClass="item.status" />
      </template>
    </DataTable>

    <Modal v-model="showModal" title="Add Item" @confirm="save">
      <FormField
        id="name"
        label="Name"
        v-model="form.name"
        required
      />
      <FormField
        id="status"
        type="select"
        label="Status"
        v-model="form.status"
        :options="statusOptions"
      />
    </Modal>
  </div>
</template>
```
